const SESSION_TOKEN_STORAGE_KEY = 'sakitrailer29_session_token';

function isBrowser() {
  return typeof window !== 'undefined';
}

export function getApiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!configuredBaseUrl) {
    return '';
  }

  return configuredBaseUrl.endsWith('/') ? configuredBaseUrl.slice(0, -1) : configuredBaseUrl;
}

export function getApiEndpoint(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}

export function getSessionToken() {
  if (!isBrowser()) {
    return '';
  }

  return window.localStorage.getItem(SESSION_TOKEN_STORAGE_KEY)?.trim() || '';
}

export function setSessionToken(token: string | null) {
  if (!isBrowser()) {
    return;
  }

  if (!token) {
    window.localStorage.removeItem(SESSION_TOKEN_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(SESSION_TOKEN_STORAGE_KEY, token);
}

export function clearLegacyClientAuthData() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem('sakitrailer29_auth_session');
  window.localStorage.removeItem('sakitrailer29_auth_users');
  window.localStorage.removeItem('sakitrailer29_orders');
}

export function createApiHeaders({
  headers,
  auth = false,
  json = false,
}: {
  headers?: HeadersInit;
  auth?: boolean;
  json?: boolean;
}) {
  const nextHeaders = new Headers(headers);

  if (json && !nextHeaders.has('Content-Type')) {
    nextHeaders.set('Content-Type', 'application/json');
  }

  if (auth) {
    const sessionToken = getSessionToken();
    if (sessionToken) {
      nextHeaders.set('Authorization', `Bearer ${sessionToken}`);
    }
  }

  return nextHeaders;
}
