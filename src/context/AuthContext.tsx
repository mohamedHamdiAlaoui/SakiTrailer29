import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  createFirebaseSessionInApi,
  createFirebaseUserInApi,
  deleteProfileInApi,
  loginWithPasswordInApi,
  logoutFromApi,
  restoreAuthSessionFromApi,
  signupInApi,
  type AuthUser,
} from '@/lib/auth-api';
import { getSessionToken } from '@/lib/api';
import {
  sendVerificationEmailFirebase,
  signInWithEmailFirebase,
  signInWithGoogleFirebase,
  signOutFirebaseIfInitialized,
  signUpWithEmailFirebase,
  updatePasswordFirebase,
  deleteUserFirebase,
} from '@/lib/firebase-client';

interface LoginInput {
  email: string;
  password: string;
}

interface SignupInput {
  fullName: string;
  companyName?: string;
  email: string;
  password: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<{ success: boolean; error?: string }>;
  signup: (input: SignupInput) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  updateUser: (user: AuthUser) => void;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const isGoogleAuthDebugEnabled = import.meta.env.DEV;
const SESSION_USER_STORAGE_KEY = 'sakitrailer29_session_user_v1';
const legacyPasswordFallbackErrors = new Set([
  'firebase_not_configured',
  'auth/operation-not-allowed',
  'auth/invalid-credential',
  'auth/user-not-found',
  'auth/configuration-not-found',
  'firebase_admin_not_configured',
  'firebase_admin_init_failed',
  'firebase_admin_unavailable',
  'invalid_id_token',
]);

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

function isBrowser() {
  return typeof window !== 'undefined';
}

function getCachedSessionUser(): AuthUser | null {
  if (!isBrowser()) {
    return null;
  }

  const rawValue = window.localStorage.getItem(SESSION_USER_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as AuthUser;
  } catch {
    return null;
  }
}

function setCachedSessionUser(user: AuthUser | null) {
  if (!isBrowser()) {
    return;
  }

  if (!user) {
    window.localStorage.removeItem(SESSION_USER_STORAGE_KEY);
    return;
  }

  try {
    window.localStorage.setItem(SESSION_USER_STORAGE_KEY, JSON.stringify(user));
  } catch {
    // Ignore quota errors.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const sessionToken = getSessionToken();
    const cachedUser = sessionToken ? getCachedSessionUser() : null;

    if (cachedUser) {
      setUser(cachedUser);
    } else if (!sessionToken) {
      setCachedSessionUser(null);
    }

    const restoreSession = async () => {
      try {
        const restoredUser = await restoreAuthSessionFromApi();
        if (isMounted) {
          setUser(restoredUser);
          setCachedSessionUser(restoredUser);
        }
      } catch (error) {
        const errorCode = error instanceof Error ? error.message : 'auth_session_restore_failed';
        if (isMounted) {
          if (errorCode === 'backend_unreachable' && cachedUser) {
            // Keep the last known user if the backend is temporarily unreachable.
            setUser(cachedUser);
          } else {
            setUser(null);
            setCachedSessionUser(null);
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      async login(input) {
        try {
          // First try Firebase Auth
          try {
            const firebaseResult = await signInWithEmailFirebase(input.email, input.password);
            const nextUser = await createFirebaseSessionInApi(firebaseResult.idToken);
            setUser(nextUser);
            setCachedSessionUser(nextUser);
            return { success: true };
          } catch (firebaseError) {
            if (firebaseError instanceof Error && firebaseError.message === 'email_not_verified') {
              return { success: false, error: 'email_not_verified' };
            }
            if (firebaseError instanceof Error && legacyPasswordFallbackErrors.has(firebaseError.message)) {
              // Fallback to legacy backend password auth
              const nextUser = await loginWithPasswordInApi(input);
              setUser(nextUser);
              setCachedSessionUser(nextUser);
              return { success: true };
            }
            throw firebaseError;
          }
        } catch (error) {
          return { success: false, error: error instanceof Error ? error.message : 'auth_login_failed' };
        }
      },
      async signup(input) {
        try {
          try {
            // Register user in Firebase Auth
            const firebaseResult = await signUpWithEmailFirebase(input.email, input.password);

            // Register user in our backend database
            await createFirebaseUserInApi({
              idToken: firebaseResult.idToken,
              fullName: input.fullName,
              companyName: input.companyName,
            });

            // Send verification email
            await sendVerificationEmailFirebase(firebaseResult.user);
          } catch (firebaseError) {
            if (firebaseError instanceof Error && legacyPasswordFallbackErrors.has(firebaseError.message)) {
              await signupInApi(input);
            } else {
              throw firebaseError;
            }
          }

          // DO NOT setUser here. They must verify email and log in manually.
          return { success: true };
        } catch (error) {
          return { success: false, error: error instanceof Error ? error.message : 'auth_signup_failed' };
        }
      },
      async loginWithGoogle() {
        try {
          logGoogleAuthDebug('requesting Google identity from Firebase');
          const googleResult = await signInWithGoogleFirebase();
          logGoogleAuthDebug('sending Google identity to backend session endpoint', {
            email: googleResult.email,
          });
          const nextUser = await createFirebaseSessionInApi(googleResult.idToken);
          logGoogleAuthDebug('backend session created', {
            userId: nextUser.id,
            role: nextUser.role,
            email: nextUser.email,
          });
          setUser(nextUser);
          setCachedSessionUser(nextUser);
          return { success: true };
        } catch (error) {
          const errorCode = error instanceof Error ? error.message : 'google_auth_failed';
          logGoogleAuthDebug('google login flow failed in auth context', {
            error: errorCode,
          });
          return { success: false, error: errorCode };
        }
      },
      updateUser(updatedUser: AuthUser) {
        setUser(updatedUser);
        setCachedSessionUser(updatedUser);
      },
      async updatePassword(newPassword: string) {
        try {
          await updatePasswordFirebase(newPassword);
          return { success: true };
        } catch (error) {
          const errorCode = error instanceof Error ? error.message : 'auth_update_password_failed';
          return { success: false, error: errorCode };
        }
      },
      async deleteAccount() {
        try {
          // 1. Try deleting from Firebase first (may throw requires-recent-login)
          await deleteUserFirebase();
          
          // 2. Delete from our SQLite backend
          await deleteProfileInApi();
          
          // 3. Clear local state
          setUser(null);
          setCachedSessionUser(null);
          return { success: true };
        } catch (error) {
          const errorCode = error instanceof Error ? error.message : 'auth_delete_account_failed';
          return { success: false, error: errorCode };
        }
      },
      async logout() {
        setUser(null);
        setCachedSessionUser(null);
        try {
          await logoutFromApi();
        } finally {
          void signOutFirebaseIfInitialized();
        }
      },
    }),
    [isLoading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
