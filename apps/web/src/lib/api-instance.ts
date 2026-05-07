import {
  createApiClient,
  createAuthApi,
  createCardsApi,
  createCollectionsApi,
  createImportsApi,
  createProfileApi,
  createScanApi,
  createWishlistsApi,
} from '@cardvault/api';

let _accessToken: string | null = null;
let _onUnauthorized: (() => void) | null = null;

const API_BASE = process.env['NEXT_PUBLIC_CARDVAULT_API_URL'] ?? 'https://api-card-vault.tamarelhe.xyz/api/v1';

export function setAccessToken(token: string | null): void {
  _accessToken = token;
}

export function setUnauthorizedHandler(handler: () => void): void {
  _onUnauthorized = handler;
}

export function getAvatarUrl(avatarPath: string): string {
  try {
    return new URL(API_BASE).origin + avatarPath;
  } catch {
    return avatarPath;
  }
}

export const apiClient = createApiClient({
  baseUrl: API_BASE,
  getToken: () => _accessToken,
  onUnauthorized: () => _onUnauthorized?.(),
});

export const authApi = createAuthApi(apiClient);
export const cardsApi = createCardsApi(apiClient);
export const collectionsApi = createCollectionsApi(apiClient);
export const importsApi = createImportsApi(apiClient);
export const profileApi = createProfileApi(apiClient);
export const scanApi = createScanApi(apiClient);
export const wishlistsApi = createWishlistsApi(apiClient);
