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
  collection_id: string;
  collection_name: string;
  quantity_owned: number;
}

export interface WishlistItem {
  id: string;
  wishlist_id: string;
  card_id: string;
  card_name: string;
  set_code: string;
  set_name: string;
  collector_number: string;
  rarity: string;
  image_uri?: string | null;
  mana_cost?: string | null;
  type_line?: string | null;
  quantity: number;
  condition?: string | null;
  foil?: boolean | null;
  notes?: string | null;
  price_eur?: string | null;
  collection_presence: CollectionPresence[];
  added_at: string;
  updated_at: string;
}

export interface WishlistItemSummary {
  id: string;
  wishlist_id: string;
  card_id: string;
  quantity: number;
  condition?: string | null;
  foil?: boolean | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}
