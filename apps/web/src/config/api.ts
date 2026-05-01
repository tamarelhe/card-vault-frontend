import { createApiClient, createAuthApi, createCardsApi, createCollectionsApi, createScanApi } from '@cardvault/api';

const TOKEN_KEY = 'cardvault_token';

export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  _token = token;
}

export function loadToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  _token = null;
}

let _token: string | null = null;

export function setInMemoryToken(token: string | null): void {
  _token = token;
}

export const apiClient = createApiClient({
  baseUrl: process.env['NEXT_PUBLIC_CARDVAULT_API_URL'] ?? 'http://localhost:8080/api/v1',
  getToken: () => _token,
  onUnauthorized: () => {
    clearToken();
    window.location.href = '/login';
  },
});

export const authApi = createAuthApi(apiClient);
export const cardsApi = createCardsApi(apiClient);
export const collectionsApi = createCollectionsApi(apiClient);
export const scanApi = createScanApi(apiClient);
