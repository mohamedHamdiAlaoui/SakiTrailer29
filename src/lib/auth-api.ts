import { clearLegacyClientAuthData, createApiHeaders, getApiEndpoint, getSessionToken, setSessionToken } from '@/lib/api';

export interface AuthUser {
  id: string;
  fullName: string;
  companyName?: string;
  email: string;
  role: 'admin' | 'user';
}

interface AuthSuccessResponse {
  success: true;
  user: AuthUser;
  sessionToken?: string;
}

interface AuthErrorResponse {
  success: false;
  error: string;
}

interface UsersSuccessResponse {
  success: true;
  users: AuthUser[];
}

type AuthResponse = AuthSuccessResponse | AuthErrorResponse;
type UsersResponse = UsersSuccessResponse | AuthErrorResponse;

async function parseAuthResponse(response: Response): Promise<AuthResponse> {
  return (await response.json()) as AuthResponse;
}

export async function restoreAuthSessionFromApi() {
  const sessionToken = getSessionToken();
  if (!sessionToken) {
    clearLegacyClientAuthData();
    return null;
  }

  const response = await fetch(getApiEndpoint('/api/auth/session'), {
    method: 'GET',
    headers: createApiHeaders({ auth: true }),
  });

  if (response.status === 401) {
    setSessionToken(null);
    clearLegacyClientAuthData();
    return null;
  }

  const payload = await parseAuthResponse(response);
  if (!response.ok || !payload.success) {
    throw new Error(payload.success ? 'auth_session_restore_failed' : payload.error);
  }

  clearLegacyClientAuthData();
  return payload.user;
}

export async function loginWithPasswordInApi(input: { email: string; password: string }) {
  const response = await fetch(getApiEndpoint('/api/auth/login'), {
    method: 'POST',
    headers: createApiHeaders({ json: true }),
    body: JSON.stringify(input),
  });

  const payload = await parseAuthResponse(response);
  if (!response.ok || !payload.success || !payload.sessionToken) {
    throw new Error(payload.success ? 'auth_login_failed' : payload.error);
  }

  setSessionToken(payload.sessionToken ?? null);
  clearLegacyClientAuthData();
  return payload.user;
}

export async function signupInApi(input: { fullName: string; email: string; password: string }) {
  const response = await fetch(getApiEndpoint('/api/auth/signup'), {
    method: 'POST',
    headers: createApiHeaders({ json: true }),
    body: JSON.stringify(input),
  });

  const payload = await parseAuthResponse(response);
  if (!response.ok || !payload.success || !payload.sessionToken) {
    throw new Error(payload.success ? 'auth_signup_failed' : payload.error);
  }

  setSessionToken(payload.sessionToken ?? null);
  clearLegacyClientAuthData();
  return payload.user;
}

export async function createFirebaseSessionInApi(idToken: string) {
  const response = await fetch(getApiEndpoint('/api/auth/firebase/session'), {
    method: 'POST',
    headers: createApiHeaders({ json: true }),
    body: JSON.stringify({ idToken }),
  });

  const payload = await parseAuthResponse(response);
  if (!response.ok || !payload.success) {
    if (payload.success === false && payload.error === 'email_not_verified') {
      throw new Error('email_not_verified');
    }
    throw new Error(payload.success ? 'firebase_session_create_failed' : payload.error);
  }

  setSessionToken(payload.sessionToken ?? null);
  clearLegacyClientAuthData();
  return payload.user;
}

export async function createFirebaseUserInApi(input: { idToken: string; fullName: string; companyName?: string }) {
  const response = await fetch(getApiEndpoint('/api/auth/firebase/register'), {
    method: 'POST',
    headers: createApiHeaders({ json: true }),
    body: JSON.stringify(input),
  });

  const payload = await parseAuthResponse(response);
  if (!response.ok || !payload.success) {
    throw new Error(payload.success ? 'firebase_register_failed' : payload.error);
  }

  return payload.user;
}

export async function logoutFromApi() {
  const sessionToken = getSessionToken();
  if (sessionToken) {
    try {
      await fetch(getApiEndpoint('/api/auth/logout'), {
        method: 'POST',
        headers: createApiHeaders({ auth: true }),
      });
    } finally {
      setSessionToken(null);
    }
  } else {
    setSessionToken(null);
  }

  clearLegacyClientAuthData();
}

export async function fetchUsersFromApi(role?: 'admin' | 'user') {
  const query = role ? `?role=${encodeURIComponent(role)}` : '';
  const response = await fetch(getApiEndpoint(`/api/users${query}`), {
    method: 'GET',
    headers: createApiHeaders({ auth: true }),
  });

  const payload = (await response.json()) as UsersResponse;
  if (!response.ok || !payload.success) {
    throw new Error(payload.success ? 'users_fetch_failed' : payload.error);
  }

  return payload.users;
}

export async function updateProfileInApi(input: { fullName: string; companyName?: string }) {
  const response = await fetch(getApiEndpoint('/api/users/profile'), {
    method: 'PUT',
    headers: createApiHeaders({ json: true, auth: true }),
    body: JSON.stringify(input),
  });

  const payload = await parseAuthResponse(response);
  if (!response.ok || !payload.success) {
    throw new Error(payload.success ? 'profile_update_failed' : payload.error);
  }

  return payload.user;
}

export async function deleteProfileInApi() {
  const response = await fetch(getApiEndpoint('/api/users/profile'), {
    method: 'DELETE',
    headers: createApiHeaders({ auth: true }),
  });

  const payload = await parseAuthResponse(response);
  if (!response.ok || !payload.success) {
    throw new Error(payload.success ? 'profile_delete_failed' : payload.error);
  }

  setSessionToken(null);
  clearLegacyClientAuthData();
  return true;
}
