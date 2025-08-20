import { z } from 'zod';

const configSchema = z.object({
  port: z.coerce.number().default(3000),
  cacheTtlSeconds: z.coerce.number().default(120),
  nominatimUserAgent: z.string(),
  tomorrowApiKey: z.string(),
  tomorrowFields: z.string().default('temperature,weatherCode'),
  openApiKey: z.string(),
});

export type Config = z.infer<typeof configSchema>;

export const configuration = (): Config => {
  const config = configSchema.parse({
    port: process.env.PORT,
    cacheTtlSeconds: process.env.CACHE_TTL_SECONDS,
    nominatimUserAgent: process.env.NOMINATIM_USER_AGENT,
    tomorrowApiKey: process.env.TOMORROW_API_KEY,
    tomorrowFields: process.env.TOMORROW_FIELDS,
    openApiKey: process.env.OPEN_API_KEY,
  });

  return config;
};
