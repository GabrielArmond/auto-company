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

// Configuração do app web (Console Firebase > Configurações do projeto > Seus apps).
export function getDb(): Firestore {
  const app = getApps()[0] ?? initializeApp(validarConfig());
  return getFirestore(app);
}

function validarConfig() {
  const faltando = (Object.keys(ENV_VARS) as (keyof typeof ENV_VARS)[])
    .filter((campo) => !config.firebase[campo])
    .map((campo) => ENV_VARS[campo]);

  if (faltando.length) {
    throw new Error(`Variáveis de ambiente do Firebase ausentes: ${faltando.join(', ')}`);
  }

  return config.firebase;
}
