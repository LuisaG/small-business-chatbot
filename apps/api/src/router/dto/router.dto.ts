import { z } from 'zod';

export const RouterInputSchema = z.object({
  message: z.string().min(1),
  businessId: z.string().optional(),
});

export const RouterOutputSchema = z.object({
  route: z.enum(['weather', 'business', 'both', 'fallback']),
  location: z.object({
    type: z.literal('business_id'),
    value: z.string(),
  }),
  timeframe: z.string(),
  business_facets: z.array(z.string()),
});

export type RouterInputDto = z.infer<typeof RouterInputSchema>;
export type RouterOutputDto = z.infer<typeof RouterOutputSchema>;
