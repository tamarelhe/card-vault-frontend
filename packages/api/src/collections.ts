import type { ApiClient } from './client';
import type { Collection, CollectionItem } from '@cardvault/core';

export interface CreateCollectionBody {
  name: string;
  description?: string;
  isPublic?: boolean;
}

export interface AddCollectionItemBody {
  cardId: string;
  quantity: number;
  condition: string;
  language: string;
  isFoil: boolean;
  purchasePrice?: number;
  notes?: string;
}

export type UpdateCollectionItemBody = Partial<Omit<AddCollectionItemBody, 'cardId'>>;

export function createCollectionsApi(client: ApiClient) {
  return {
    list(): Promise<Collection[]> {
      return client.get<Collection[]>('/collections');
    },
    getById(id: string): Promise<Collection> {
      return client.get<Collection>(`/collections/${id}`);
    },
    create(body: CreateCollectionBody): Promise<Collection> {
      return client.post<Collection>('/collections', body);
    },
    update(id: string, body: Partial<CreateCollectionBody>): Promise<Collection> {
      return client.patch<Collection>(`/collections/${id}`, body);
    },
    delete(id: string): Promise<void> {
      return client.delete<void>(`/collections/${id}`);
    },
    listItems(collectionId: string): Promise<CollectionItem[]> {
      return client.get<CollectionItem[]>(`/collections/${collectionId}/items`);
    },
    addItem(collectionId: string, body: AddCollectionItemBody): Promise<CollectionItem> {
      return client.post<CollectionItem>(`/collections/${collectionId}/items`, body);
    },
    updateItem(collectionId: string, itemId: string, body: UpdateCollectionItemBody): Promise<CollectionItem> {
      return client.patch<CollectionItem>(`/collections/${collectionId}/items/${itemId}`, body);
    },
    removeItem(collectionId: string, itemId: string): Promise<void> {
      return client.delete<void>(`/collections/${collectionId}/items/${itemId}`);
    },
  };
}
