import { createRemoteJWKSet, jwtVerify } from 'jose';

// Firebase publishes its public keys here — no service account needed
const JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
const jwks = createRemoteJWKSet(new URL(JWKS_URL));

/**
 * Verify a Firebase ID token using Firebase's public JWKS endpoint.
 * No Admin SDK or service account required.
 * 
 * Returns the decoded token payload if valid.
 * Throws if the token is invalid, expired, or from the wrong project.
 */
export async function verifyFirebaseToken(idToken) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    console.warn('[firebase] FIREBASE_PROJECT_ID not set. Token verification unavailable.');
    return null;
  }

  try {
    const { payload } = await jwtVerify(idToken, jwks, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId
    });

    return {
      uid: payload.sub,
      email: payload.email || '',
      email_verified: payload.email_verified ?? false,
      name: payload.name || ''
    };
  } catch (err) {
    throw new Error(`Invalid Firebase token: ${err.message}`);
  }
}

// Stub for compatibility — no longer needed
export function getFirebaseAdmin() {
  return null;
}
