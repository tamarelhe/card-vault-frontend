import type { CardSearchParams } from './cards';

export const queryKeys = {
  me: ['me'] as const,
  cards: (params: CardSearchParams) => ['cards', params] as const,
  card: (id: string) => ['card', id] as const,
  priceHistory: (id: string) => ['card', id, 'price', 'history'] as const,
  priceVariations: (id: string, currency: string) => ['card', id, 'price', 'variations', currency] as const,
  collections: ['collections'] as const,
  collection: (id: string) => ['collection', id] as const,
  collectionItems: (id: string, params?: Record<string, unknown>) => ['collection', id, 'items', params ?? {}] as const,
  scanResolve: ['scan', 'resolve'] as const,
};
