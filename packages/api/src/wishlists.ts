import type { ApiClient } from './client';
import type { PaginatedResponse, Wishlist, WishlistItem, WishlistItemSummary, MagicTugaPrice } from '@cardvault/core';

export interface CreateWishlistBody {
  name: string;
  description?: string;
  visibility?: 'public' | 'private';
}

export interface UpdateWishlistBody {
  name?: string;
  description?: string;
  visibility?: 'public' | 'private';
}

export interface AddWishlistItemBody {
  oracle_id: string;
  quantity: number;
  condition?: string | null;
  foil?: boolean | null;
  notes?: string;
}

export interface UpdateWishlistItemBody {
  quantity?: number;
  condition?: string | null;
  foil?: boolean | null;
  notes?: string;
}

export function createWishlistsApi(client: ApiClient) {
  return {
    list(params?: { page?: number; page_size?: number }): Promise<PaginatedResponse<Wishlist>> {
      const qs = params
        ? new URLSearchParams(
            Object.entries(params)
              .filter(([, v]) => v !== undefined)
              .map(([k, v]) => [k, String(v)])
          ).toString()
        : '';
      return client.get<PaginatedResponse<Wishlist>>(`/wishlists${qs ? `?${qs}` : ''}`);
    },
    getById(id: string): Promise<Wishlist> {
      return client.get<Wishlist>(`/wishlists/${id}`);
    },
    create(body: CreateWishlistBody): Promise<Wishlist> {
      return client.post<Wishlist>('/wishlists', body);
    },
    update(id: string, body: UpdateWishlistBody): Promise<Wishlist> {
      return client.patch<Wishlist>(`/wishlists/${id}`, body);
    },
    delete(id: string): Promise<void> {
      return client.delete<void>(`/wishlists/${id}`);
    },
    listItems(id: string, params?: { page?: number; page_size?: number }): Promise<PaginatedResponse<WishlistItem>> {
      const qs = params
        ? new URLSearchParams(
            Object.entries(params)
              .filter(([, v]) => v !== undefined)
              .map(([k, v]) => [k, String(v)])
          ).toString()
        : '';
      return client.get<PaginatedResponse<WishlistItem>>(`/wishlists/${id}/items${qs ? `?${qs}` : ''}`);
    },
    addItem(id: string, body: AddWishlistItemBody): Promise<WishlistItemSummary> {
      return client.post<WishlistItemSummary>(`/wishlists/${id}/items`, body);
    },
    updateItem(id: string, itemId: string, body: UpdateWishlistItemBody): Promise<WishlistItemSummary> {
      return client.patch<WishlistItemSummary>(`/wishlists/${id}/items/${itemId}`, body);
    },
    removeItem(id: string, itemId: string): Promise<void> {
      return client.delete<void>(`/wishlists/${id}/items/${itemId}`);
    },
    getMagicTugaStock(): Promise<MagicTugaPrice[]> {
      return client.get<MagicTugaPrice[]>('/wishlists/magictuga/stock');
    },
  };
}
