export interface Collection {
  id: string;
  name: string;
  description: string;
  card_count?: number | null;
  total_value?: string | null;
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
