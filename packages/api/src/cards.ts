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
  direction: 'up' | 'down' | 'flat';
}

export interface PriceVariationsResponse {
  card_id: string;
  lang: string;
  currency: string;
  variations: PriceVariation[];
  computed_at: string | null;
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
    priceVariations(id: string, currency = 'eur', lang = 'en'): Promise<PriceVariationsResponse> {
      return client.get<PriceVariationsResponse>(
        `/cards/${id}/price/variations?currency=${currency}&lang=${lang}`
      );
    },
  };
}
