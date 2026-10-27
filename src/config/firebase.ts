import { cert, getApps, initializeApp, type AppOptions } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { config } from './index';

const EMULATOR_PROJECT_ID = 'demo-auto-company';
const CONNECTION_TIMEOUT_MS = 10_000;

const ENV_VARS = {
  projectId: 'FIREBASE_PROJECT_ID',
  clientEmail: 'FIREBASE_CLIENT_EMAIL',
  privateKey: 'FIREBASE_PRIVATE_KEY',
} as const;

// Service account credentials (Firebase Console > Project settings > Service accounts).
// The Admin SDK bypasses the Security Rules, which deny every other client.
export async function connectFirestore(): Promise<Firestore> {
  const app = getApps()[0] ?? initializeApp(appOptions());
  const db = getFirestore(app);

  await checkConnection(db);
  return db;
}

async function checkConnection(db: Firestore) {
  const target = config.firebase.emulatorHost ? `the Firestore emulator at ${config.firebase.emulatorHost}` : 'Firestore';
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(
      () => reject(new Error(`Could not connect to ${target} within ${CONNECTION_TIMEOUT_MS / 1000}s`)),
      CONNECTION_TIMEOUT_MS,
    );
  });

  try {
    await Promise.race([db.listCollections(), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

function appOptions(): AppOptions {
  if (config.firebase.emulatorHost) {
    // Skips the Google Cloud metadata server lookup, which only logs a warning outside GCP.
    process.env.METADATA_SERVER_DETECTION ??= 'none';
    return { projectId: config.firebase.projectId || EMULATOR_PROJECT_ID };
  }
  return { credential: cert(validateConfig()) };
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
