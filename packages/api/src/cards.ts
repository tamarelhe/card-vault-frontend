import type { ApiClient } from './client';
import type { Card } from '@cardvault/core';

export interface CardSearchParams {
  query?: string;
  game?: string;
  setCode?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedCards {
  items: Card[];
  total: number;
  page: number;
  limit: number;
}

export function createCardsApi(client: ApiClient) {
  return {
    search(params: CardSearchParams): Promise<PaginatedCards> {
      const qs = new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ).toString();
      return client.get<PaginatedCards>(`/cards${qs ? `?${qs}` : ''}`);
    },
    getById(id: string): Promise<Card> {
      return client.get<Card>(`/cards/${id}`);
    },
  };
}
