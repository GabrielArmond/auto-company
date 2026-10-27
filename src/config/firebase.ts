import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { config } from './index';

const ENV_VARS = {
  projectId: 'FIREBASE_PROJECT_ID',
  clientEmail: 'FIREBASE_CLIENT_EMAIL',
  privateKey: 'FIREBASE_PRIVATE_KEY',
} as const;

// Service account credentials (Firebase Console > Project settings > Service accounts).
// The Admin SDK bypasses the Security Rules, which deny every other client.
export async function connectFirestore(): Promise<Firestore> {
  const app = getApps()[0] ?? initializeApp({ credential: cert(validateConfig()) });
  const db = getFirestore(app);

  await db.listCollections();
  return db;
}

function validateConfig() {
  const { projectId, clientEmail, privateKey } = config.firebase;

  if (!projectId || !clientEmail || !privateKey) {
    const missing = (Object.keys(ENV_VARS) as (keyof typeof ENV_VARS)[])
      .filter((field) => !config.firebase[field])
      .map((field) => ENV_VARS[field]);
    throw new Error(`Missing Firebase environment variables: ${missing.join(', ')}`);
  }

  return { projectId, clientEmail, privateKey };
}
