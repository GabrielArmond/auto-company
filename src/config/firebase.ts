import { getApps, initializeApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { config } from './index';

const ENV_VARS = {
  apiKey: 'FIREBASE_API_KEY',
  authDomain: 'FIREBASE_AUTH_DOMAIN',
  projectId: 'FIREBASE_PROJECT_ID',
  storageBucket: 'FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'FIREBASE_MESSAGING_SENDER_ID',
  appId: 'FIREBASE_APP_ID',
} as const;

// Web app config (Firebase Console > Project settings > Your apps).
export function getDb(): Firestore {
  const app = getApps()[0] ?? initializeApp(validateConfig());
  return getFirestore(app);
}

function validateConfig() {
  const missing = (Object.keys(ENV_VARS) as (keyof typeof ENV_VARS)[])
    .filter((field) => !config.firebase[field])
    .map((field) => ENV_VARS[field]);

  if (missing.length) {
    throw new Error(`Missing Firebase environment variables: ${missing.join(', ')}`);
  }

  return config.firebase;
}
