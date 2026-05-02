export type Game = 'mtg' | 'pokemon' | 'lorcana';

export type CardCondition =
  | 'mint'
  | 'near_mint'
  | 'lightly_played'
  | 'moderately_played'
  | 'heavily_played'
  | 'damaged';

export type CardLanguage = 'en' | 'pt' | 'fr' | 'de' | 'es' | 'it' | 'jp' | 'ko' | 'zh';

export interface CardFace {
  name: string;
  mana_cost?: string | null;
  type_line?: string | null;
  oracle_text?: string | null;
  image_uri?: string | null;
  power?: string | null;
  toughness?: string | null;
  artist?: string | null;
}

export interface CardPrices {
  eur?: number | null;
  eur_foil?: number | null;
  eur_etched?: number | null;
  usd?: number | null;
  usd_foil?: number | null;
  usd_etched?: number | null;
}

export interface Card {
  id: string;
  scryfall_id?: string | null;
  lang: string;
  name: string;
  set_code: string;
  set_name: string;
  collector_number: string;
  layout: string;
  rarity: string;
  cmc?: number | null;
  colors: string[];
  color_identity: string[];
  keywords: string[];
  power?: string | null;
  toughness?: string | null;
  mana_cost?: string | null;
  type_line?: string | null;
  oracle_text?: string | null;
  image_uri?: string | null;
  card_faces?: CardFace[] | null;
  legalities?: Record<string, string> | null;
  games: string[];
  finishes: string[];
  reserved: boolean;
  foil: boolean;
  nonfoil: boolean;
  promo: boolean;
  reprint: boolean;
  full_art: boolean;
  border_color?: string | null;
  frame?: string | null;
  artist?: string | null;
  prices?: CardPrices | null;
  updated_at: string;
}

export interface CollectionCard {
  id: string;
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
  condition: CardCondition;
  language: string;
  foil: boolean;
  notes?: string | null;
  price_eur?: string | null;
  price_usd?: string | null;
  added_at: string;
  updated_at: string;
}
