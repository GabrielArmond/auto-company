import { FirebaseError, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
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

// Web app config (Firebase Console > Project settings > Your apps) plus anonymous sign-in,
// so the Security Rules can require an authenticated client (request.auth != null).
export async function connectFirestore(): Promise<Firestore> {
  const app = getApps()[0] ?? initializeApp(validateConfig());
  await signIn(app);
  return getFirestore(app);
}

async function signIn(app: FirebaseApp) {
  const auth = getAuth(app);
  if (auth.currentUser) return;

  try {
    await signInAnonymously(auth);
  } catch (error) {
    if (error instanceof FirebaseError && error.code === 'auth/admin-restricted-operation') {
      throw new Error(
        'Anonymous sign-in is disabled. Enable it in Firebase Console > Authentication > Sign-in method.',
        { cause: error },
      );
    }
    throw error;
  }
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
