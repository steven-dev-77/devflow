import { z } from 'zod';

const envSchema = z.object({
  VITE_API_BASE_URL: z
    .string()
    .trim()
    .min(1)
    .default('/api/v1')
    .transform((value) => value.replace(/\/+$/, '')),
  MODE: z.string(),
  DEV: z.boolean(),
  PROD: z.boolean(),
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  throw new Error(`Invalid client environment configuration:\n${z.prettifyError(parsed.error)}`);
}

export const env = Object.freeze({
  apiBaseUrl: parsed.data.VITE_API_BASE_URL,
  mode: parsed.data.MODE,
  isDev: parsed.data.DEV,
  isProd: parsed.data.PROD,
});
