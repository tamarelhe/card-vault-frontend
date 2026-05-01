import type { CardCondition, CardLanguage } from './card';

export interface Collection {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  ownerId: string;
  totalCards: number;
  uniqueCards: number;
  totalValue?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionItem {
  id: string;
  collectionId: string;
  cardId: string;
  quantity: number;
  condition: CardCondition;
  language: CardLanguage;
  isFoil: boolean;
  purchasePrice?: number;
  notes?: string;
  addedAt: string;
}
