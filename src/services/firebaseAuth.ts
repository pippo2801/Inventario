import {
  onAuthStateChanged,
  signInWithEmailAndPassword as firebaseSignIn,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
  type Unsubscribe,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebase';

function requireAuth() {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase non è configurato. Completa prima la configurazione della Web App.');
  }
  return auth;
}

/** Observe Firebase Authentication only; this does not create a local demo user. */
export function observeFirebaseAuth(
  onUserChanged: (user: FirebaseUser | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onAuthStateChanged(requireAuth(), onUserChanged, onError);
}

/** Accounts are provisioned by an administrator/backend; public sign-up is intentionally absent. */
export async function signInFirebaseWithEmail(email: string, password: string): Promise<FirebaseUser> {
  const normalizedEmail = email.trim();
  if (!normalizedEmail || !password) {
    throw new Error('Inserisci email e password.');
  }
  const credential = await firebaseSignIn(requireAuth(), normalizedEmail, password);
  return credential.user;
}

export async function signOutFirebase(): Promise<void> {
  await firebaseSignOut(requireAuth());
}
