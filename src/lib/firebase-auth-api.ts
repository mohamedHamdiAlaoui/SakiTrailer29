export interface VerifiedFirebaseUser {
  uid: string;
  email: string;
  fullName: string;
  picture?: string;
  emailVerified: boolean;
}

interface VerifyIdTokenSuccessResponse {
  success: true;
  user: VerifiedFirebaseUser;
}

interface VerifyIdTokenErrorResponse {
  success: false;
  error: string;
}

type VerifyIdTokenResponse = VerifyIdTokenSuccessResponse | VerifyIdTokenErrorResponse;

function getVerifyEndpoint() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!configuredBaseUrl) {
    return '/api/auth/firebase/verify';
  }

  const normalizedBaseUrl = configuredBaseUrl.endsWith('/')
    ? configuredBaseUrl.slice(0, -1)
    : configuredBaseUrl;

  return `${normalizedBaseUrl}/api/auth/firebase/verify`;
}

export async function verifyFirebaseIdToken(idToken: string): Promise<VerifiedFirebaseUser> {
  const response = await fetch(getVerifyEndpoint(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ idToken }),
  });

  const payload = (await response.json()) as VerifyIdTokenResponse;

  if (!response.ok || !payload.success) {
    const errorCode = payload.success ? 'verify_request_failed' : payload.error;
    throw new Error(errorCode || 'verify_request_failed');
  }

  return payload.user;
}
