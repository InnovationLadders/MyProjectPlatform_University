import * as jose from 'jose';
import crypto from 'crypto';

let privateKey: any;
let publicKey: any;
let jwksCache: any = null;

const KID = '68d8c42617d92';

export async function initializeKeys() {
  const privateKeyPem = process.env.LTI_PRIVATE_KEY;

  if (!privateKeyPem) {
    console.warn('LTI_PRIVATE_KEY not found in environment. Generating new key pair...');
    await generateAndStoreKeys();
    return;
  }

  try {
    privateKey = await jose.importPKCS8(privateKeyPem, 'RS256');
    publicKey = await jose.importSPKI(
      await exportPublicKey(privateKeyPem),
      'RS256'
    );
    console.log('RSA keys loaded successfully');
  } catch (error) {
    console.error('Failed to load RSA keys:', error);
    throw new Error('Failed to initialize RSA keys');
  }
}

async function generateAndStoreKeys() {
  const { publicKey: pubKey, privateKey: privKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  console.log('\n=== GENERATED RSA PRIVATE KEY ===');
  console.log('Store this in Google Secret Manager as LTI_PRIVATE_KEY:');
  console.log(privKey);
  console.log('=================================\n');

  privateKey = await jose.importPKCS8(privKey, 'RS256');
  publicKey = await jose.importSPKI(pubKey, 'RS256');
}

function exportPublicKey(privateKeyPem: string): string {
  const keyObject = crypto.createPrivateKey(privateKeyPem);
  return keyObject.export({
    type: 'spki',
    format: 'pem'
  }).toString();
}

export async function generateJWKS(): Promise<any> {
  if (jwksCache) {
    return jwksCache;
  }

  if (!publicKey) {
    await initializeKeys();
  }

  const jwk = await jose.exportJWK(publicKey);

  jwksCache = {
    keys: [
      {
        ...jwk,
        kid: KID,
        alg: 'RS256',
        use: 'sig'
      }
    ]
  };

  return jwksCache;
}

export async function signJWT(payload: any, expiresIn: string = '1h'): Promise<string> {
  if (!privateKey) {
    await initializeKeys();
  }

  const jwt = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'RS256', kid: KID, typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(privateKey);

  return jwt;
}

export async function verifyJWT(token: string, jwks: any): Promise<any> {
  const JWKS = jose.createRemoteJWKSet(new URL(jwks));
  const { payload } = await jose.jwtVerify(token, JWKS);
  return payload;
}

export async function verifyJWTWithKey(token: string, publicKeyToUse: any): Promise<any> {
  const { payload } = await jose.jwtVerify(token, publicKeyToUse);
  return payload;
}

export function generateNonce(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateState(): string {
  return crypto.randomBytes(32).toString('hex');
}
