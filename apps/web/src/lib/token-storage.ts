const REFRESH_TOKEN_KEY = 'cv_rt';
const EMAIL_KEY = 'cv_email';

export function saveSession(refreshToken: string, email: string): void {
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(EMAIL_KEY, email);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getSavedEmail(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(EMAIL_KEY);
}

export function clearSession(): void {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(EMAIL_KEY);
}
