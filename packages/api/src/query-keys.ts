import type { CardSearchParams } from './cards';

export const queryKeys = {
  me: ['me'] as const,
  profile: ['profile'] as const,
  presetAvatars: ['profile', 'preset-avatars'] as const,
  cards: (params: CardSearchParams) => ['cards', params] as const,
  card: (id: string) => ['card', id] as const,
  priceHistory: (id: string) => ['card', id, 'price', 'history'] as const,
  priceVariations: (id: string, currency: string) => ['card', id, 'price', 'variations', currency] as const,
  collections: ['collections'] as const,
  collection: (id: string) => ['collection', id] as const,
  collectionItems: (id: string, params?: Record<string, unknown>) => ['collection', id, 'items', params ?? {}] as const,
  collectionShares: (id: string) => ['collection', id, 'shares'] as const,
  sharePreview: (token: string) => ['share-preview', token] as const,
  scanResolve: ['scan', 'resolve'] as const,
  wishlists: ['wishlists'] as const,
  wishlist: (id: string) => ['wishlist', id] as const,
  wishlistItems: (id: string, params?: Record<string, unknown>) => ['wishlist', id, 'items', params ?? {}] as const,
  topMoversBase: ['prices', 'movers'] as const,
  topMovers: (params: Record<string, unknown>) => ['prices', 'movers', params] as const,
  magicTugaStock: ['wishlists', 'magictuga', 'stock'] as const,
};
