import { z } from 'zod';

const conditions = [
  'mint',
  'near_mint',
  'lightly_played',
  'moderately_played',
  'heavily_played',
  'damaged',
] as const;

export const createCollectionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  visibility: z.enum(['public', 'private']).default('private'),
});

export const updateCollectionCardSchema = z.object({
  quantity: z.number().int().min(1).max(9999).optional(),
  condition: z.enum(conditions).optional(),
  language: z.string().optional(),
  foil: z.boolean().optional(),
  notes: z.string().max(500).optional(),
});

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
export type UpdateCollectionCardInput = z.infer<typeof updateCollectionCardSchema>;
