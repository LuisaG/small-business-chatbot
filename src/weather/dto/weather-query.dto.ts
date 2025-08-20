import { z } from 'zod';

export const WeatherQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lon: z.coerce.number().min(-180).max(180).optional(),
  q: z.string().min(1).optional(),
}).refine(
  (data) => {
    const hasCoords = data.lat !== undefined && data.lon !== undefined;
    const hasQuery = data.q !== undefined;
    return hasCoords || hasQuery;
  },
  {
    message: 'Either lat+lon or q must be provided',
  }
);

export type WeatherQueryDto = z.infer<typeof WeatherQuerySchema>;

export const WeatherResponseSchema = z.object({
  location: z.string(),
  lat: z.number(),
  lon: z.number(),
  tempC: z.number(),
  tempF: z.number(),
  conditionCode: z.string(),
  provider: z.literal('tomorrow.io'),
});

export type WeatherResponseDto = z.infer<typeof WeatherResponseSchema>;
