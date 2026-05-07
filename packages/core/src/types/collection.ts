export interface Collection {
  id: string;
  name: string;
  description: string;
  visibility: 'public' | 'private';
  ownership: 'owned' | 'shared';
  owner?: { id: string; email: string; username?: string; avatar_url?: string };
  total_cards: number;
  total_value_eur: number;
  total_value_usd: number;
  created_at: string;
  updated_at: string;
}

export interface ShareInvite {
  token: string;
  collection_id: string;
  created_at: string;
}

export interface SharedUser {
  user_id: string;
  email: string;
  username: string;
  joined_at: string;
}

export interface SharedUsersResponse {
  users: SharedUser[];
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
