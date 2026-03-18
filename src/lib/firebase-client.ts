import { FirebaseError, getApp, getApps, initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  sendEmailVerification as firebaseSendEmailVerification,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  deleteUser as firebaseDeleteUser,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword as firebaseUpdatePassword,
} from 'firebase/auth';

interface GoogleSignInResult {
  idToken: string;
  email: string;
  fullName: string;
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

const isGoogleAuthDebugEnabled = import.meta.env.DEV;

function logGoogleAuthDebug(message: string, details?: Record<string, unknown>) {
  if (!isGoogleAuthDebugEnabled) {
    return;
  }

  if (details) {
    console.info(`[auth][google] ${message}`, details);
    return;
  }

  console.info(`[auth][google] ${message}`);
}

function getMissingFirebaseEnvKeys() {
  const missingKeys: string[] = [];
  if (!firebaseConfig.apiKey) missingKeys.push('VITE_FIREBASE_API_KEY');
  if (!firebaseConfig.authDomain) missingKeys.push('VITE_FIREBASE_AUTH_DOMAIN');
  if (!firebaseConfig.projectId) missingKeys.push('VITE_FIREBASE_PROJECT_ID');
  if (!firebaseConfig.appId) missingKeys.push('VITE_FIREBASE_APP_ID');
  return missingKeys;
}

export function isFirebaseClientConfigured() {
  return getMissingFirebaseEnvKeys().length === 0;
}

function getFirebaseApp() {
  if (!isFirebaseClientConfigured()) {
    throw new Error('firebase_not_configured');
  }

  if (getApps().length > 0) {
    return getApp();
  }

  return initializeApp(firebaseConfig);
}

function normalizeFirebaseError(error: unknown): Error {
  if (error instanceof FirebaseError) {
    return new Error(error.code);
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error('firebase_unknown_error');
}

export async function signInWithGoogleFirebase(): Promise<GoogleSignInResult> {
  try {
    logGoogleAuthDebug('starting popup flow');
    const app = getFirebaseApp();
    const auth = getAuth(app);
    await setPersistence(auth, browserLocalPersistence);
    logGoogleAuthDebug('firebase client ready', {
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId,
    });

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    const credential = await signInWithPopup(auth, provider);
    const email = credential.user.email?.trim().toLowerCase();

    if (!email) {
      throw new Error('missing_google_email');
    }

    const idToken = await credential.user.getIdToken(true);
    const fullName = credential.user.displayName?.trim() || email.split('@')[0];
    logGoogleAuthDebug('popup flow succeeded', {
      email,
      fullName,
    });

    return { idToken, email, fullName };
  } catch (error) {
    const normalizedError = normalizeFirebaseError(error);
    logGoogleAuthDebug('popup flow failed', {
      error: normalizedError.message,
      rawErrorName: error instanceof Error ? error.name : 'unknown',
    });
    throw normalizedError;
  }
}

export async function signOutFirebaseIfInitialized() {
  if (getApps().length === 0) return;

  const auth = getAuth(getApp());
  await signOut(auth);
}

export async function signUpWithEmailFirebase(email: string, password: string) {
  try {
    const app = getFirebaseApp();
    const auth = getAuth(app);
    await setPersistence(auth, browserLocalPersistence);

    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const idToken = await credential.user.getIdToken(true);

    return { idToken, user: credential.user };
  } catch (error) {
    throw normalizeFirebaseError(error);
  }
}

export async function sendVerificationEmailFirebase(user: any) {
  try {
    await firebaseSendEmailVerification(user);
    return true;
  } catch (error) {
    console.error('Failed to send verification email', error);
    return false;
  }
}

export async function signInWithEmailFirebase(email: string, password: string) {
  try {
    const app = getFirebaseApp();
    const auth = getAuth(app);
    await setPersistence(auth, browserLocalPersistence);

    const credential = await signInWithEmailAndPassword(auth, email, password);

    if (!credential.user.emailVerified) {
      throw new Error('email_not_verified');
    }

    const idToken = await credential.user.getIdToken(true);
    return { idToken, user: credential.user };
  } catch (error) {
    if (error instanceof Error && error.message === 'email_not_verified') {
      throw error;
    }
    throw normalizeFirebaseError(error);
  }
}

export async function updatePasswordFirebase(newPassword: string) {
  try {
    const auth = getAuth(getApp());
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('user_not_logged_in_firebase');
    }
    await firebaseUpdatePassword(currentUser, newPassword);
    return true;
  } catch (error) {
    throw normalizeFirebaseError(error);
  }
}

export async function sendPasswordResetEmailFirebase(email: string) {
  try {
    const auth = getAuth(getApp());
    await firebaseSendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    throw normalizeFirebaseError(error);
  }
}

export async function deleteUserFirebase() {
  try {
    const auth = getAuth(getApp());
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('user_not_logged_in_firebase');
    }
    await firebaseDeleteUser(currentUser);
    return true;
  } catch (error) {
    throw normalizeFirebaseError(error);
  }
}
