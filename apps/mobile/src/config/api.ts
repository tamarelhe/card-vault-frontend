import { createApiClient, createAuthApi, createCardsApi, createCollectionsApi, createScanApi } from '@cardvault/api';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'cardvault_access_token';

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function deleteToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

let _token: string | null = null;

export function setInMemoryToken(token: string | null): void {
  _token = token;
}

export const apiClient = createApiClient({
  baseUrl: process.env['EXPO_PUBLIC_CARDVAULT_API_URL'] ?? 'http://localhost:8080/api/v1',
  getToken: () => _token,
});

export const authApi = createAuthApi(apiClient);
export const cardsApi = createCardsApi(apiClient);
export const collectionsApi = createCollectionsApi(apiClient);
export const scanApi = createScanApi(apiClient);
