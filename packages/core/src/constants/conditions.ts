import type { CardCondition } from '../types/card';

export const CONDITIONS: Record<CardCondition, { label: string; shortLabel: string; rank: number }> = {
  mint: { label: 'Mint', shortLabel: 'M', rank: 1 },
  near_mint: { label: 'Near Mint', shortLabel: 'NM', rank: 2 },
  excellent: { label: 'Excellent', shortLabel: 'EX', rank: 3 },
  good: { label: 'Good', shortLabel: 'GD', rank: 4 },
  light_played: { label: 'Light Played', shortLabel: 'LP', rank: 5 },
  played: { label: 'Played', shortLabel: 'PL', rank: 6 },
  poor: { label: 'Poor', shortLabel: 'PR', rank: 7 },
};

export const CONDITION_LIST: CardCondition[] = [
  'mint',
  'near_mint',
  'excellent',
  'good',
  'light_played',
  'played',
  'poor',
];
