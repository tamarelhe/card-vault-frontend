import { z } from 'zod';

export const createWishlistSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  visibility: z.enum(['public', 'private']).default('private'),
});

export type CreateWishlistInput = z.infer<typeof createWishlistSchema>;
