import { z } from 'zod';

const conditions = ['mint', 'near_mint', 'excellent', 'good', 'light_played', 'played', 'poor'] as const;
const languages = ['en', 'pt', 'fr', 'de', 'es', 'it', 'jp', 'ko', 'zh'] as const;

export const createCollectionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(false),
});

export const addCollectionItemSchema = z.object({
  cardId: z.string().uuid(),
  quantity: z.number().int().min(1).max(9999),
  condition: z.enum(conditions),
  language: z.enum(languages),
  isFoil: z.boolean().default(false),
  purchasePrice: z.number().nonnegative().optional(),
  notes: z.string().max(500).optional(),
});

export const updateCollectionItemSchema = addCollectionItemSchema.partial().omit({ cardId: true });

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
export type AddCollectionItemInput = z.infer<typeof addCollectionItemSchema>;
export type UpdateCollectionItemInput = z.infer<typeof updateCollectionItemSchema>;
