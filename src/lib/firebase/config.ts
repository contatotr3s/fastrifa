import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  setPersistence,
  inMemoryPersistence,
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyAdNE5s4Y6Sx2OrqNx862-LfLcEMdO-CyQ',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'gestanv.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'gestanv',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'gestanv.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '265051691683',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:265051691683:web:8216946906c6a7dd43bd16',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-3DTJ8V2GZW',
};

// Initialize Primary Firebase App (singleton)
const app =
  getApps().find((a) => a.name === '[DEFAULT]') || initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Isolated Public Bridge App: garante que visitantes não logados (via WhatsApp / QR Code)
// consigam ler rifas públicas e reservar cotas mesmo se as regras do Firestore exigirem request.auth != null,
// sem afetar o estado de login (auth.currentUser continua null na interface principal).
let bridgeApp: FirebaseApp | null = null;
let bridgeDb: Firestore | null = null;
let bridgeAuthPromise: Promise<Firestore> | null = null;

export async function getPublicFirestore(): Promise<Firestore> {
  if (auth.currentUser) {
    return db;
  }

  if (bridgeDb && bridgeApp) {
    const bAuth = getAuth(bridgeApp);
    if (bAuth.currentUser) {
      return bridgeDb;
    }
  }

  if (bridgeAuthPromise) {
    return bridgeAuthPromise;
  }

  bridgeAuthPromise = (async () => {
    try {
      const existing = getApps().find((a) => a.name === 'fastrifa-public-bridge');
      bridgeApp = existing || initializeApp(firebaseConfig, 'fastrifa-public-bridge');
      const bAuth = getAuth(bridgeApp);
      await setPersistence(bAuth, inMemoryPersistence);
      if (!bAuth.currentUser) {
        await signInWithEmailAndPassword(
          bAuth,
          'leitor.publico@fastrifa.com',
          'FastRifaPublic2026!'
        );
      }
      bridgeDb = getFirestore(bridgeApp);
      return bridgeDb;
    } catch (err) {
      console.warn('Public bridge fallback to default db:', err);
      return db;
    } finally {
      bridgeAuthPromise = null;
    }
  })();

  return bridgeAuthPromise;
}

export default app;
