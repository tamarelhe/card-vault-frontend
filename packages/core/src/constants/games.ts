import type { Game } from '../types/card';

export const GAMES: Record<Game, { label: string; shortLabel: string }> = {
  mtg: { label: 'Magic: The Gathering', shortLabel: 'MTG' },
  pokemon: { label: 'Pokémon', shortLabel: 'PKM' },
  lorcana: { label: 'Disney Lorcana', shortLabel: 'LRC' },
};

export const GAME_LIST: Game[] = ['mtg', 'pokemon', 'lorcana'];
