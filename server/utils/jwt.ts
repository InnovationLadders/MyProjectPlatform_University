import * as jose from 'jose';
import crypto from 'crypto';

let privateKey: jose.KeyLike | undefined;
let publicKey: jose.KeyLike | undefined;
let jwksCache: any = null;

const KID = '68d8c42617d92';

function sanitizePem(pem?: string): string | undefined {
  if (!pem) return undefined;
  let s = pem.trim();
  // remove surrounding quotes if present
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1);
  }
  // convert escaped newlines to real newlines
  s = s.replace(/\\n/g, '\n');
  return s;
}

export async function initializeKeys() {
  const raw = process.env.LTI_PRIVATE_KEY;
  const privateKeyPem = sanitizePem(raw);

  // If not provided or clearly a placeholder or too short, generate a new key pair
  if (!privateKeyPem || privateKeyPem.includes('...') || privateKeyPem.length < 100) {
    console.warn('LTI_PRIVATE_KEY not found or invalid in environment. Generating new key pair...');
    await generateAndStoreKeys();
    return;
  }

  try {
    // Import private key into jose (expects PKCS#8 PEM for importPKCS8)
    privateKey = await jose.importPKCS8(privateKeyPem, 'RS256');

    // Export the corresponding public key (SPKI PEM) using Node crypto and import into jose
    const publicSpkiPem = exportPublicKey(privateKeyPem);
    publicKey = await jose.importSPKI(publicSpkiPem, 'RS256');

    console.log('RSA keys loaded successfully');
  } catch (error) {
    console.error('Failed to load RSA keys:', error);
    console.warn('Attempting to generate a new key pair to recover...');
    try {
      await generateAndStoreKeys();
    } catch (genErr) {
      console.error('Failed to generate fallback keys:', genErr);
      throw new Error('Failed to initialize RSA keys');
    }
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
  console.log('Store this in Google Secret Manager / .env as LTI_PRIVATE_KEY (PEM with escaped newlines):');
  // show env-friendly string with \n so user can paste directly
  const envSafe = privKey.replace(/\n/g, '\\n');
  console.log(`LTI_PRIVATE_KEY="${envSafe}\n"`);
  console.log('=================================\n');

  // import into jose for runtime usage
  privateKey = await jose.importPKCS8(privKey, 'RS256');
  publicKey = await jose.importSPKI(pubKey, 'RS256');
}

function exportPublicKey(privateKeyPem: string): string {
  // Create a KeyObject from the private key PEM
  // Use an object form to be explicit about format
  const privateKeyObj = crypto.createPrivateKey({ key: privateKeyPem, format: 'pem' });
  // Derive the public key from the private key object
  const publicKeyObj = crypto.createPublicKey(privateKeyObj);
  // Export the public key as SPKI PEM
  const publicSpkiPem = publicKeyObj.export({ type: 'spki', format: 'pem' });
  return typeof publicSpkiPem === 'string' ? publicSpkiPem : publicSpkiPem.toString();
}

export async function generateJWKS(): Promise<any> {
  if (jwksCache) {
    return jwksCache;
  }

  if (!publicKey) {
    await initializeKeys();
  }

  const jwk = await jose.exportJWK(publicKey as jose.KeyLike);

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
    .sign(privateKey as jose.KeyLike);

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
