import { Request, Response, NextFunction } from 'express';
import { createError } from '../middleware/errorHandler.js';
import { createGradePassback, updateGradePassback } from '../services/firestore.js';
import { signJWT } from '../utils/jwt.js';

interface GradeSubmission {
  userId: string;
  resourceLinkId: string;
  scoreGiven: number;
  scoreMaximum: number;
  lineitemUrl: string;
}

export async function submitGrade(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, resourceLinkId, scoreGiven, scoreMaximum, lineitemUrl }: GradeSubmission = req.body;

    if (!userId || !resourceLinkId || scoreGiven === undefined || !scoreMaximum || !lineitemUrl) {
      throw createError('Missing required grade submission parameters', 400);
    }

    if (scoreGiven < 0 || scoreGiven > scoreMaximum) {
      throw createError('Invalid score values', 400);
    }

    const gradeId = await createGradePassback({
      userId,
      resourceLinkId,
      score: scoreGiven,
      maxScore: scoreMaximum,
      status: 'pending'
    });

    try {
      const accessToken = await getClasseraAccessToken();

      const gradePayload = {
        userId,
        scoreGiven,
        scoreMaximum,
        activityProgress: 'Completed',
        gradingProgress: 'FullyGraded',
        timestamp: new Date().toISOString()
      };

      const response = await fetch(lineitemUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/vnd.ims.lis.v2.lineitem+json'
        },
        body: JSON.stringify(gradePayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Grade passback failed: ${response.status} - ${errorText}`);
      }

      await updateGradePassback(gradeId, {
        status: 'sent',
        sentAt: new Date() as any,
        response: await response.text()
      });

      console.log('[Grade Passback] Success', {
        gradeId,
        userId,
        resourceLinkId,
        scoreGiven,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        gradeId,
        message: 'Grade submitted successfully'
      });
    } catch (error) {
      await updateGradePassback(gradeId, {
        status: 'failed',
        response: error instanceof Error ? error.message : 'Unknown error'
      });

      console.error('[Grade Passback] Failed', {
        gradeId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw createError('Failed to submit grade to Classera', 500);
    }
  } catch (error) {
    next(error);
  }
}

async function getClasseraAccessToken(): Promise<string> {
  const tokenEndpoint = 'https://partners.classera.com/oauth2/token';
  const clientId = process.env.CLASSERA_CLIENT_ID;
  const clientSecret = process.env.NODE_ENV === 'production'
    ? process.env.CLASSERA_TOKEN_PRODUCTION
    : process.env.CLASSERA_TOKEN_STAGING;

  if (!clientId || !clientSecret) {
    throw new Error('Classera credentials not configured');
  }

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://purl.imsglobal.org/spec/lti-ags/scope/score'
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${response.status}`);
  }

  const data: any = await response.json();
  return data.access_token;
}
