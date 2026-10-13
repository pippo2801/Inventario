import React, { useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { AlertCircle, CheckCircle2, Cloud, Loader2, LogIn, LogOut, ShieldCheck, KeyRound } from 'lucide-react';
import { firebaseAuth } from '../services/firebase';

function friendlyAuthError(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: unknown }).code)
    : '';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Email o password non corretti.';
    case 'auth/invalid-email':
      return 'Inserisci un indirizzo email valido.';
    case 'auth/too-many-requests':
      return 'Troppi tentativi. Attendi qualche minuto e riprova.';
    case 'auth/network-request-failed':
      return 'Connessione assente o instabile. Verifica Internet e riprova.';
    case 'auth/operation-not-allowed':
      return 'Accesso email/password non abilitato nel progetto Firebase.';
    default:
      return 'Accesso non riuscito. Controlla i dati e riprova.';
  }
}

export const FirebaseAccountPanel: React.FC = () => {
  const [account, setAccount] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      firebaseAuth,
      (user) => {
        setAccount(user);
        setAuthLoading(false);
      },
      () => {
        setErrorMessage('Non è stato possibile verificare la sessione Firebase.');
        setAuthLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setSubmitting(true);

    try {
      await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
      setPassword('');
      setSuccessMessage('Accesso Firebase effettuato. I dati dell’app restano salvati localmente.');
    } catch (error) {
      setErrorMessage(friendlyAuthError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setErrorMessage('Inserisci prima l’indirizzo email per ricevere il link di ripristino.');
      return;
    }

    setSubmitting(true);
    try {
      await sendPasswordResetEmail(firebaseAuth, normalizedEmail);
      setSuccessMessage('Se l’indirizzo è registrato, riceverai un’email con le istruzioni per reimpostare la password.');
    } catch (error) {
      setErrorMessage(friendlyAuthError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setSubmitting(true);

    try {
      await signOut(firebaseAuth);
      setSuccessMessage('Disconnessione Firebase completata. I dati locali non sono stati modificati.');
    } catch {
      setErrorMessage('Disconnessione non riuscita. Riprova.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mb-5 rounded-2xl border border-teal-800/60 bg-slate-900/80 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-teal-800 bg-teal-950/70 text-teal-300">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-white">Account Firebase</h3>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            Accesso all’account cloud separato dall’utente locale dell’app.
          </p>
        </div>
        <Cloud className="h-4 w-4 shrink-0 text-slate-500" />
      </div>

      {authLoading ? (
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Verifica sessione…
        </div>
      ) : account ? (
        <div className="mt-4">
          <div className="flex flex-col gap-3 rounded-xl border border-emerald-900/70 bg-emerald-950/20 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <div className="min-w-0">
                <p className="break-all text-xs font-semibold text-emerald-300">Connesso: {account.email || 'account Firebase'}</p>
                <p className="mt-1 break-all text-[10px] text-slate-500">UID: {account.uid}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={submitting}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              Esci da Firebase
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSignIn} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium text-slate-300">
            Email
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-teal-500"
              placeholder="nome@esempio.it"
            />
          </label>
          <label className="text-xs font-medium text-slate-300">
            Password
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-teal-500"
              placeholder="Password Firebase"
            />
          </label>
          <div className="sm:col-span-2 -mt-1">
            <button
              type="button"
              onClick={handlePasswordReset}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-300 underline-offset-4 hover:underline disabled:opacity-50"
            >
              <KeyRound className="h-3.5 w-3.5" />
              Password dimenticata?
            </button>
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              Accedi con Firebase
            </button>
          </div>
        </form>
      )}

      {errorMessage && (
        <p role="alert" className="mt-3 flex items-start gap-2 rounded-xl border border-red-900/70 bg-red-950/30 p-3 text-xs text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {errorMessage}
        </p>
      )}
      {successMessage && (
        <p role="status" className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-900/70 bg-emerald-950/20 p-3 text-xs text-emerald-300">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {successMessage}
        </p>
      )}

      <p className="mt-3 text-[11px] leading-5 text-amber-200/80">
        Nota: questo accesso non abilita la sincronizzazione e non assegna ruoli gestionali. I dati restano locali; Firestore rimane protetto dalle regole attuali.
      </p>
    </section>
  );
};
