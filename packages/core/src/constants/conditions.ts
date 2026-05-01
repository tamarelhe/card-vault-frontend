import type { CardCondition } from '../types/card';

export const CONDITIONS: Record<CardCondition, { label: string; shortLabel: string; rank: number }> = {
  mint: { label: 'Mint', shortLabel: 'M', rank: 1 },
  near_mint: { label: 'Near Mint', shortLabel: 'NM', rank: 2 },
  lightly_played: { label: 'Lightly Played', shortLabel: 'LP', rank: 3 },
  moderately_played: { label: 'Moderately Played', shortLabel: 'MP', rank: 4 },
  heavily_played: { label: 'Heavily Played', shortLabel: 'HP', rank: 5 },
  damaged: { label: 'Damaged', shortLabel: 'D', rank: 6 },
};

export const CONDITION_LIST: CardCondition[] = [
  'mint',
  'near_mint',
  'lightly_played',
  'moderately_played',
  'heavily_played',
  'damaged',
];
