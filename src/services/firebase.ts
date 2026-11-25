import { getApp, getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const env = import.meta.env;

const firebaseConfig: FirebaseOptions = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

const requiredConfigKeys: Array<keyof FirebaseOptions> = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
];

const missingConfig = requiredConfigKeys.filter((key) => {
  const value = firebaseConfig[key];
  return typeof value !== 'string' || value.trim().length === 0;
});

export const isFirebaseConfigured = missingConfig.length === 0;
export const firebaseMissingConfig = missingConfig;

let app: ReturnType<typeof initializeApp> | null = null;
let auth: Auth | null = null;
let dbFirestore: Firestore | null = null;

// Firebase stays completely inactive until a complete Web App config is supplied.
// No placeholder config, demo identity, cloud read, or cloud write is used as fallback.
if (isFirebaseConfigured) {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  dbFirestore = getFirestore(app);
}

export { app as firebaseApp, auth, dbFirestore };
