import type { Game } from '../types/card';
import type { ParsedScanHints } from '../types/scan';

const COLLECTOR_NUMBER_RE = /\b(\d{1,4}(?:\/\d{1,4})?)\b/;
const SET_CODE_RE = /\b([A-Z]{2,5})\b/;

const GAME_HINTS: Record<Game, string[]> = {
  mtg: ['illus', 'wizards', 'magic', 'mana', '®'],
  pokemon: ['hp', 'trainer', 'pokémon', 'pokemon', 'stage'],
  lorcana: ['lorcana', 'disney', 'ink'],
};

function detectGame(text: string): { game: Game; confidence: number } | null {
  const lower = text.toLowerCase();
  const scores: Record<Game, number> = { mtg: 0, pokemon: 0, lorcana: 0 };

  for (const [game, hints] of Object.entries(GAME_HINTS) as [Game, string[]][]) {
    for (const hint of hints) {
      if (lower.includes(hint)) scores[game]++;
    }
  }

  const entries = Object.entries(scores) as [Game, number][];
  const [best] = entries.sort(([, a], [, b]) => b - a);
  if (!best || best[1] === 0) return null;

  const total = entries.reduce((sum, [, v]) => sum + v, 0);
  return { game: best[0], confidence: best[1] / total };
}

function normalizeOcr(text: string): string {
  return text
    .replace(/[|]/g, 'I')
    .replace(/[0O]/g, (c, i, s) => (/\d/.test(s[i - 1] ?? '') || /\d/.test(s[i + 1] ?? '') ? '0' : c))
    .trim();
}

export function parseCardHints(rawText: string, defaultGame: Game = 'mtg'): ParsedScanHints {
  const normalized = normalizeOcr(rawText);
  const detected = detectGame(normalized);
  const game = detected?.game ?? defaultGame;
  const baseConfidence = detected?.confidence ?? 0.1;

  const numberMatch = COLLECTOR_NUMBER_RE.exec(normalized);
  const setMatch = SET_CODE_RE.exec(normalized);

  const number = numberMatch?.[1];
  const setCode = setMatch?.[1];

  const nameLines = normalized
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 2 && l.length < 50 && /[a-zA-Z]/.test(l));

  const name = nameLines[0];

  const confidence = Math.min(
    baseConfidence + (number ? 0.3 : 0) + (setCode ? 0.2 : 0) + (name ? 0.2 : 0),
    1
  );

  return { game, name, setCode, number, confidence, rawText };
}
