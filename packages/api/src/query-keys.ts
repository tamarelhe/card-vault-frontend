import type { CardSearchParams } from './cards';

export const queryKeys = {
  me: ['me'] as const,
  cards: (params: CardSearchParams) => ['cards', params] as const,
  card: (id: string) => ['card', id] as const,
  priceVariations: (id: string, currency: string) => ['card', id, 'price', 'variations', currency] as const,
  collections: ['collections'] as const,
  collection: (id: string) => ['collection', id] as const,
  collectionItems: (id: string) => ['collection', id, 'items'] as const,
  scanResolve: ['scan', 'resolve'] as const,
};
