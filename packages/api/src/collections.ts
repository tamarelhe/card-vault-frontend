import type { ApiClient } from './client';
import type { Collection, CollectionCard, PaginatedResponse } from '@cardvault/core';

export interface CreateCollectionBody {
  name: string;
  description?: string;
}

export interface UpdateCollectionBody {
  name?: string;
  description?: string;
}

export interface AddCollectionCardBody {
  card_id: string;
  quantity: number;
  condition: string;
  language: string;
  foil?: boolean;
  notes?: string;
}

export interface UpdateCollectionCardBody {
  quantity?: number;
  condition?: string;
  language?: string;
  foil?: boolean;
  notes?: string;
}

export interface ListCollectionCardsParams {
  page?: number;
  page_size?: number;
  q?: string;
  set_code?: string;
  collector_number?: string;
  card_type?: string;
  mana_cost?: string;
  power?: string;
  toughness?: string;
  sort_by?: 'name' | 'collector_number' | 'rarity' | 'condition' | 'quantity' | 'added_at' | 'price';
  sort_order?: 'asc' | 'desc';
}

export function createCollectionsApi(client: ApiClient) {
  return {
    list(params?: { page?: number; page_size?: number }): Promise<PaginatedResponse<Collection>> {
      const qs = params
        ? new URLSearchParams(
            Object.entries(params)
              .filter(([, v]) => v !== undefined)
              .map(([k, v]) => [k, String(v)])
          ).toString()
        : '';
      return client.get<PaginatedResponse<Collection>>(`/collections${qs ? `?${qs}` : ''}`);
    },
    getById(id: string): Promise<Collection> {
      return client.get<Collection>(`/collections/${id}`);
    },
    create(body: CreateCollectionBody): Promise<Collection> {
      return client.post<Collection>('/collections', body);
    },
    update(id: string, body: UpdateCollectionBody): Promise<Collection> {
      return client.patch<Collection>(`/collections/${id}`, body);
    },
    delete(id: string): Promise<void> {
      return client.delete<void>(`/collections/${id}`);
    },
    listCards(collectionId: string, params?: ListCollectionCardsParams): Promise<PaginatedResponse<CollectionCard>> {
      const qs = params
        ? new URLSearchParams(
            Object.entries(params)
              .filter(([, v]) => v !== undefined)
              .map(([k, v]) => [k, String(v)])
          ).toString()
        : '';
      return client.get<PaginatedResponse<CollectionCard>>(`/collections/${collectionId}/cards${qs ? `?${qs}` : ''}`);
    },
    addCard(collectionId: string, body: AddCollectionCardBody): Promise<CollectionCard> {
      return client.post<CollectionCard>(`/collections/${collectionId}/cards`, body);
    },
    updateCard(collectionId: string, cardId: string, body: UpdateCollectionCardBody): Promise<CollectionCard> {
      return client.patch<CollectionCard>(`/collections/${collectionId}/cards/${cardId}`, body);
    },
    removeCard(collectionId: string, cardId: string): Promise<void> {
      return client.delete<void>(`/collections/${collectionId}/cards/${cardId}`);
    },
  };
}
