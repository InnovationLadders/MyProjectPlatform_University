import { Request, Response, NextFunction } from 'express';
import * as jose from 'jose';
import { createError } from '../middleware/errorHandler.js';
import { generateNonce, generateState, verifyJWT } from '../utils/jwt.js';
import {
  createLTISession,
  getLTISessionByNonce,
  deleteLTISession,
  getUserByLTIUserId,
  createUser,
  updateUser,
  createOrUpdateContext,
  createOrUpdateResourceLink,
  createLaunchRecord
} from '../services/firestore.js';
import { getAuth } from '../services/firebase.js';
import type { LTILoginRequest, LTILaunchToken, UserData } from '../types/lti.js';

const CLASSERA_ISSUER = 'https://partners.classera.com';
const CLASSERA_AUTH_URL = 'https://partners.classera.com/automation_auth';
const CLASSERA_JWKS_URL = 'https://partners.classera.com/.well-known/jwks.json';

// export async function handleLogin(req: Request, res: Response, next: NextFunction) {
//   try {
//     const { iss, login_hint, target_link_uri, lti_message_hint, client_id }: LTILoginRequest = req.body;

//     if (!iss || !login_hint || !target_link_uri || !client_id) {
//       throw createError('Missing required parameters', 400);
//     }

//     if (iss !== CLASSERA_ISSUER) {
//       throw createError('Invalid issuer', 400);
//     }

//     const expectedClientId = process.env.CLASSERA_CLIENT_ID;
//     if (client_id !== expectedClientId) {
//       throw createError('Invalid client_id', 400);
//     }

//     const nonce = generateNonce();
//     const state = generateState();

//     await createLTISession(nonce, state);

//     const authParams = new URLSearchParams({
//       scope: 'openid',
//       response_type: 'id_token',
//       response_mode: 'form_post',
//       prompt: 'none',
//       client_id: client_id,
//       redirect_uri: target_link_uri,
//       login_hint: login_hint,
//       state: state,
//       nonce: nonce,
//       ...(lti_message_hint && { lti_message_hint })
//     });

//     const redirectUrl = `${CLASSERA_AUTH_URL}?${authParams.toString()}`;

//     console.log('[LTI Login] Redirecting to Classera', {
//       nonce,
//       state,
//       login_hint,
//       timestamp: new Date().toISOString()
//     });

//     res.redirect(redirectUrl);
//   } catch (error) {
//     next(error);
//   }
// }
export async function handleLogin(req: Request, res: Response, next: NextFunction) {
  try {
    // Handle both GET (query params) and POST (body)
    const params = req.method === 'GET' ? req.query : req.body;
    
    const { 
      iss, 
      login_hint, 
      target_link_uri, 
      lti_message_hint, 
      client_id 
    }: LTILoginRequest = params;

    if (!iss || !login_hint || !target_link_uri || !client_id) {
      throw createError('Missing required parameters', 400);
    }

    if (iss !== CLASSERA_ISSUER) {
      throw createError('Invalid issuer', 400);
    }

    const expectedClientId = process.env.CLASSERA_CLIENT_ID;
    if (client_id !== expectedClientId) {
      throw createError('Invalid client_id', 400);
    }

    const nonce = generateNonce();
    const state = generateState();

    await createLTISession(nonce, state);

    const authParams = new URLSearchParams({
      scope: 'openid',
      response_type: 'id_token',
      response_mode: 'form_post',
      prompt: 'none',
      client_id: client_id as string,
      redirect_uri: target_link_uri as string,
      login_hint: login_hint as string,
      state: state,
      nonce: nonce,
      ...(lti_message_hint && { lti_message_hint: lti_message_hint as string })
    });

    const redirectUrl = `${CLASSERA_AUTH_URL}?${authParams.toString()}`;

    console.log('[LTI Login] Redirecting to Classera', {
      method: req.method,
      nonce,
      state,
      login_hint,
      timestamp: new Date().toISOString()
    });

    res.redirect(redirectUrl);
  } catch (error) {
    next(error);
  }
}
export async function handleLaunch(req: Request, res: Response, next: NextFunction) {
  try {
    const { id_token, state } = req.body;

    if (!id_token) {
      throw createError('Missing id_token', 400);
    }

    const JWKS = jose.createRemoteJWKSet(new URL(CLASSERA_JWKS_URL));
    const { payload } = await jose.jwtVerify(id_token, JWKS);

    const ltiClaims = payload as unknown as LTILaunchToken;

    if (ltiClaims.iss !== CLASSERA_ISSUER) {
      throw createError('Invalid issuer in token', 401);
    }

    const expectedClientId = process.env.CLASSERA_CLIENT_ID;
    if (ltiClaims.aud !== expectedClientId) {
      throw createError('Invalid audience in token', 401);
    }

    const session = await getLTISessionByNonce(ltiClaims.nonce);
    if (!session) {
      throw createError('Invalid or expired nonce', 401);
    }

    await deleteLTISession(session.id);

    const messageType = ltiClaims['https://purl.imsglobal.org/spec/lti/claim/message_type'];
    if (messageType !== 'LtiResourceLinkRequest') {
      throw createError('Invalid message type', 400);
    }

    const version = ltiClaims['https://purl.imsglobal.org/spec/lti/claim/version'];
    if (version !== '1.3.0') {
      throw createError('Unsupported LTI version', 400);
    }

    const ltiUserId = ltiClaims.sub;
    const roles = ltiClaims['https://purl.imsglobal.org/spec/lti/claim/roles'] || [];
    const resourceLink = ltiClaims['https://purl.imsglobal.org/spec/lti/claim/resource_link'];
    const context = ltiClaims['https://purl.imsglobal.org/spec/lti/claim/context'];
    const agsEndpoint = ltiClaims['https://purl.imsglobal.org/spec/lti-ags/claim/endpoint'];

    const appRole = mapLTIRolesToAppRole(roles);

    let existingUser = await getUserByLTIUserId(ltiUserId);
    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      await updateUser(userId, {
        name: ltiClaims.name || existingUser.data.name,
        email: ltiClaims.email || existingUser.data.email,
        classeraRoles: roles,
        classeraEnabled: true
      });
    } else {
      const newUserData: Omit<UserData, 'createdAt' | 'updatedAt'> = {
        ltiUserId,
        platformUserId: ltiUserId,
        classeraEnabled: true,
        classeraRoles: roles,
        name: ltiClaims.name || 'Unknown User',
        email: ltiClaims.email || `${ltiUserId}@classera.local`,
        givenName: ltiClaims.given_name,
        familyName: ltiClaims.family_name
      };

      userId = await createUser(newUserData);
    }

    if (context) {
      await createOrUpdateContext({
        contextId: context.id,
        contextTitle: context.title,
        contextLabel: context.label,
        courseId: context.id,
        platform: CLASSERA_ISSUER
      });
    }

    if (resourceLink) {
      await createOrUpdateResourceLink({
        resourceLinkId: resourceLink.id,
        title: resourceLink.title,
        description: resourceLink.description,
        contextId: context?.id || 'unknown',
        lineitemUrl: agsEndpoint?.lineitem
      });
    }

    await createLaunchRecord({
      userId,
      contextId: context?.id || 'unknown',
      resourceLinkId: resourceLink?.id || 'unknown',
      outcome: 'success'
    });

    const firebaseAuth = getAuth();
    const customToken = await firebaseAuth.createCustomToken(userId, {
      role: appRole,
      ltiUserId,
      classeraEnabled: true
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectUrl = `${frontendUrl}/lti/callback?token=${customToken}&role=${appRole}`;

    console.log('[LTI Launch] Success', {
      userId,
      ltiUserId,
      role: appRole,
      contextId: context?.id,
      timestamp: new Date().toISOString()
    });

    res.redirect(redirectUrl);
  } catch (error) {
    console.error('[LTI Launch] Error:', error);

    await createLaunchRecord({
      userId: 'unknown',
      contextId: 'unknown',
      resourceLinkId: 'unknown',
      outcome: 'failure',
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    });

    next(error);
  }
}

function mapLTIRolesToAppRole(roles: string[]): string {
  const roleString = roles.join(',').toLowerCase();

  if (roleString.includes('instructor') || roleString.includes('teacher')) {
    return 'teacher';
  }

  if (roleString.includes('administrator')) {
    return 'admin';
  }

  return 'student';
}
