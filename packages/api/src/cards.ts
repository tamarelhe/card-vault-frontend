import type { ApiClient } from './client';
import type { Card } from '@cardvault/core';

export interface CardSearchParams {
  q?: string;
  set_code?: string;
  collector_number?: string;
  card_type?: string;
  rarity?: string;
  mana_cost?: string;
  mana_cost_op?: 'eq' | 'lt' | 'gt' | 'lte' | 'gte';
  power?: string;
  power_op?: 'eq' | 'lt' | 'gt' | 'lte' | 'gte';
  toughness?: string;
  toughness_op?: 'eq' | 'lt' | 'gt' | 'lte' | 'gte';
  colors?: string[];
  color_match?: 'exact' | 'atmost' | 'including' | 'commander';
  sort_by?: 'name' | 'collector_number' | 'rarity' | 'cmc';
  sort_order?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

export interface CardSearchMeta {
  page: number;
  page_size: number;
  total: number;
}

export interface CardSearchResponse {
  items: Card[];
  meta: CardSearchMeta;
}

export interface PriceHistoryItem {
  currency: 'eur' | 'usd';
  price: string | null;
  price_foil: string | null;
  price_etched: string | null;
  source: string;
  fetched_at: string;
}

export interface PriceHistory {
  card_id: string;
  history: PriceHistoryItem[];
}

export interface PriceVariation {
  period: string;
  price_now: string | null;
  price_then: string | null;
  price_foil_now: string | null;
  price_foil_then: string | null;
  delta_abs: string | null;
  delta_pct: string | null;
  delta_foil_abs: string | null;
  delta_foil_pct: string | null;
  direction: 'up' | 'down' | 'stable';
}

export interface PriceVariationsResponse {
  card_id: string;
  lang: string;
  currency: string;
  variations: PriceVariation[];
  computed_at: string | null;
}

export interface TopMoverCollection {
  id: string;
  name: string;
  ownership: 'owned' | 'shared';
  owner_id: string;
  owner_email: string;
}

export interface TopMoverWishlist {
  id: string;
  name: string;
}

export interface TopMoverItem {
  card_id: string;
  name: string;
  set_code: string;
  set_name: string;
  rarity: string;
  image_uri: string | null;
  price_now: string;
  price_then: string;
  delta_abs: string;
  delta_pct: string;
  direction: 'up' | 'down';
  collections?: TopMoverCollection[];
  wishlists?: TopMoverWishlist[];
}

export interface TopMoversResponse {
  period: string;
  currency: string;
  direction: string;
  mode: string;
  movers: TopMoverItem[];
}

export interface TopMoversParams {
  period: '1d' | '7d' | '30d' | '90d';
  currency?: 'eur' | 'usd';
  direction?: 'up' | 'down' | '';
  limit?: number;
  mode?: 'global' | 'collections' | 'wishlists';
}

export function createCardsApi(client: ApiClient) {
  return {
    search(params: CardSearchParams): Promise<CardSearchResponse> {
      const p = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v === undefined || v === '' || v === null) continue;
        if (Array.isArray(v)) {
          v.forEach(item => p.append(k, String(item)));
        } else {
          p.set(k, String(v));
        }
      }
      const qs = p.toString();
      return client.get<CardSearchResponse>(`/cards${qs ? `?${qs}` : ''}`);
    },
    getById(id: string): Promise<Card> {
      return client.get<Card>(`/cards/${id}`);
    },
    priceHistory(id: string, lang = 'en'): Promise<PriceHistory> {
      return client.get<PriceHistory>(`/cards/${id}/price/history?lang=${lang}`);
    },
    priceVariations(id: string, currency = 'eur', lang = 'en'): Promise<PriceVariationsResponse> {
      return client.get<PriceVariationsResponse>(
        `/cards/${id}/price/variations?currency=${currency}&lang=${lang}`
      );
    },
    getTopMovers(params: TopMoversParams): Promise<TopMoversResponse> {
      const p = new URLSearchParams({ period: params.period });
      if (params.currency)  p.set('currency',  params.currency);
      if (params.direction !== undefined && params.direction !== '') p.set('direction', params.direction);
      if (params.limit)     p.set('limit',     String(params.limit));
      if (params.mode)      p.set('mode',      params.mode);
      return client.get<TopMoversResponse>(`/prices/movers?${p.toString()}`);
    },
  };
}
