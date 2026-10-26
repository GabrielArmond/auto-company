import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { config } from './index';

// Credenciais da conta de serviço (Console Firebase > Configurações do projeto > Contas de serviço).
export function getDb(): Firestore {
  if (!getApps().length) {
    const { projectId, clientEmail, privateKey } = config.firebase;

    const faltando = Object.entries({
      FIREBASE_PROJECT_ID: projectId,
      FIREBASE_CLIENT_EMAIL: clientEmail,
      FIREBASE_PRIVATE_KEY: privateKey,
    })
      .filter(([, valor]) => !valor)
      .map(([nome]) => nome);

    if (faltando.length) {
      throw new Error(`Variáveis de ambiente do Firebase ausentes: ${faltando.join(', ')}`);
    }

    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), projectId });
  }

  return getFirestore();
}
