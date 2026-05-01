import {
  createApiClient,
  createAuthApi,
  createCardsApi,
  createCollectionsApi,
  createScanApi,
} from '@cardvault/api';

let _accessToken: string | null = null;
let _onUnauthorized: (() => void) | null = null;

export function setAccessToken(token: string | null): void {
  _accessToken = token;
}

export function setUnauthorizedHandler(handler: () => void): void {
  _onUnauthorized = handler;
}

export const apiClient = createApiClient({
  baseUrl: process.env['NEXT_PUBLIC_CARDVAULT_API_URL'] ?? 'https://api-card-vault.tamarelhe.xyz/api/v1',
  getToken: () => _accessToken,
  onUnauthorized: () => _onUnauthorized?.(),
});

export const authApi = createAuthApi(apiClient);
export const cardsApi = createCardsApi(apiClient);
export const collectionsApi = createCollectionsApi(apiClient);
export const scanApi = createScanApi(apiClient);
