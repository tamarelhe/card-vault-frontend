export interface Wishlist {
  id: string;
  name: string;
  description: string;
  visibility: 'public' | 'private';
  total_items: number;
  created_at: string;
  updated_at: string;
}

export interface CollectionPresence {
  id: string;
  name: string;
  ownership: 'owned' | 'shared';
}

export interface WishlistItem {
  id: string;
  oracle_id: string;
  card_name: string;
  image_uri?: string | null;
  mana_cost?: string | null;
  type_line?: string | null;
  quantity: number;
  condition?: string | null;
  foil?: boolean | null;
  notes?: string | null;
  price_eur?: string | null;
  price_usd?: string | null;
  collection_presence: CollectionPresence[];
  added_at: string;
  updated_at: string;
}

export interface WishlistItemSummary {
  id: string;
  wishlist_id: string;
  oracle_id: string;
  quantity: number;
  condition?: string | null;
  foil?: boolean | null;
  notes?: string | null;
  added_at: string;
  updated_at: string;
}

export interface MagicTugaPrice {
  id: string;
  oracle_id: string;
  card_name: string;
  foil: boolean;
  condition: string;
  condition_name: string;
  language: string;
  language_name: string;
  min_price: number;
  max_price: number;
  avg_price: number;
  total_quantity: number;
  last_seen_at: string;
}
