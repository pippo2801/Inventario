/**
 * Firebase client initialization for Studio Ottico Di Pietro.
 *
 * The Firebase web configuration is a public client configuration, not a
 * service-account credential. Firestore access remains blocked by the current
 * server-side rules until the data model and authorization rules are reviewed.
 *
 * Do not enable cloud synchronization from this module alone.
 */
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDuUkyFnO3aGCnrbk5UFO7e32PNmlwCc1g',
  authDomain: 'inventario-studio.firebaseapp.com',
  projectId: 'inventario-studio',
  storageBucket: 'inventario-studio.firebasestorage.app',
  messagingSenderId: '948603878645',
  appId: '1:948603878645:web:0f13ee540ca66a6e8659bc',
};

export const firebaseApp = getApps().length > 0
  ? getApp()
  : initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(firebaseApp);
export const dbFirestore = getFirestore(firebaseApp);
export const firebaseProjectId = firebaseConfig.projectId;
