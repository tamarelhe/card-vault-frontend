import type { ApiClient } from './client';
import type { Collection, CollectionCard, PaginatedResponse } from '@cardvault/core';

export interface CreateCollectionBody {
  name: string;
  description?: string;
  visibility?: 'public' | 'private';
}

export interface UpdateCollectionBody {
  name?: string;
  description?: string;
  visibility?: 'public' | 'private';
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
  rarity?: string;
  card_type?: string;
  mana_cost?: string;
  mana_cost_op?: 'eq' | 'lt' | 'gt' | 'lte' | 'gte';
  power?: string;
  power_op?: 'eq' | 'lt' | 'gt' | 'lte' | 'gte';
  toughness?: string;
  toughness_op?: 'eq' | 'lt' | 'gt' | 'lte' | 'gte';
  colors?: string[];
  color_match?: 'exact' | 'atmost' | 'including' | 'commander';
  sort_by?: 'name' | 'collector_number' | 'rarity' | 'cmc' | 'condition' | 'quantity' | 'added_at' | 'price';
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
      const p = new URLSearchParams();
      for (const [k, v] of Object.entries(params ?? {})) {
        if (v === undefined || v === '' || v === null) continue;
        if (Array.isArray(v)) v.forEach(item => p.append(k, String(item)));
        else p.set(k, String(v));
      }
      const qs = p.toString();
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
