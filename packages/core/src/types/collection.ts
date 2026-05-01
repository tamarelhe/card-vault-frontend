export interface Collection {
  id: string;
  name: string;
  description: string;
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
