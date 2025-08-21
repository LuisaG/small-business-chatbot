import { z } from 'zod';

export const ChatMessageSchema = z.object({
  message: z.string().min(1),
  businessLocation: z.string().optional(),
  businessName: z.string().optional(),
  businessType: z.string().optional(),
  conversationId: z.string().optional(),
});

export const ChatResponseSchema = z.object({
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
});

export type ChatMessageDto = z.infer<typeof ChatMessageSchema>;
export type ChatResponseDto = z.infer<typeof ChatResponseSchema>;
