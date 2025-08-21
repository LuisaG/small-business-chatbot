import { z } from 'zod';

export const ChatSimpleInputSchema = z.object({
  message: z.string().min(1),
  conversationId: z.string().optional(),
});

export const ChatSimpleResponseSchema = z.object({
  response: z.string(),
  conversationId: z.string(),
  weatherInfo: z.object({
    location: z.string(),
    tempF: z.number(),
    tempC: z.number(),
  }).optional(),
  businessInfo: z.object({
    name: z.string(),
    location: z.string(),
    type: z.string(),
  }).optional(),
  route: z.enum(['weather', 'business', 'both', 'fallback']),
  business_facets: z.array(z.string()),
});

export type ChatSimpleInputDto = z.infer<typeof ChatSimpleInputSchema>;
export type ChatSimpleResponseDto = z.infer<typeof ChatSimpleResponseSchema>;
