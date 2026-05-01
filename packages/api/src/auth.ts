import type { ApiClient } from './client';
import type { TokenPair } from '@cardvault/core';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface LogoutRequest {
  refresh_token: string;
}

export function createAuthApi(client: ApiClient) {
  return {
    login(body: LoginRequest): Promise<TokenPair> {
      return client.post<TokenPair>('/auth/login', body);
    },
    register(body: RegisterRequest): Promise<TokenPair> {
      return client.post<TokenPair>('/auth/register', body);
    },
    refresh(body: RefreshRequest): Promise<TokenPair> {
      return client.post<TokenPair>('/auth/refresh', body);
    },
    logout(body: LogoutRequest): Promise<void> {
      return client.post<void>('/auth/logout', body);
    },
  };
}
