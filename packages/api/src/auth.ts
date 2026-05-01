import type { ApiClient } from './client';
import type { User, AuthTokens } from '@cardvault/core';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export function createAuthApi(client: ApiClient) {
  return {
    login(body: LoginRequest): Promise<AuthTokens> {
      return client.post<AuthTokens>('/auth/login', body);
    },
    register(body: RegisterRequest): Promise<AuthTokens> {
      return client.post<AuthTokens>('/auth/register', body);
    },
    me(): Promise<User> {
      return client.get<User>('/auth/me');
    },
    logout(): Promise<void> {
      return client.post<void>('/auth/logout');
    },
  };
}
