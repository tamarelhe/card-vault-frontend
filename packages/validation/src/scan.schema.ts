import { z } from 'zod';

const games = ['mtg', 'pokemon', 'lorcana'] as const;

export const scanResolveSchema = z.object({
  game: z.enum(games),
  name: z.string().optional(),
  setCode: z.string().optional(),
  number: z.string().optional(),
  rawText: z.string().min(1),
});

export type ScanResolveInput = z.infer<typeof scanResolveSchema>;
