export type Game = 'mtg' | 'pokemon' | 'lorcana';

export type CardCondition = 'mint' | 'near_mint' | 'excellent' | 'good' | 'light_played' | 'played' | 'poor';

export type CardLanguage = 'en' | 'pt' | 'fr' | 'de' | 'es' | 'it' | 'jp' | 'ko' | 'zh';

export interface Card {
  id: string;
  name: string;
  game: Game;
  setCode: string;
  setName: string;
  collectorNumber: string;
  imageUrl?: string;
  prices: CardPrices;
  foilAvailable: boolean;
}

export interface CardPrices {
  usd?: number;
  usdFoil?: number;
  eur?: number;
  eurFoil?: number;
  updatedAt: string;
}
