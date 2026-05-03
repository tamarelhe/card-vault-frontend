export interface Collection {
  id: string;
  name: string;
  description: string;
  visibility: 'public' | 'private';
  total_cards: number;
  total_value_eur: number;
  total_value_usd: number;
  created_at: string;
  updated_at: string;
}

export interface PaginationMeta {
  page: number;
  page_size: number;
  total: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}
