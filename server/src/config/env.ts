import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  CLIENT_ORIGIN: z
    .string()
    .default('http://localhost:5173')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.url()).min(1)),
  MONGODB_URI: z
    .string()
    .min(1, 'MONGODB_URI is required')
    .refine((value) => /^mongodb(\+srv)?:\/\//.test(value), {
      message: 'MONGODB_URI must start with mongodb:// or mongodb+srv://',
    }),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  RATE_LIMIT_WINDOW_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const details = z.prettifyError(result.error);
    // The logger depends on validated env, so report directly and abort startup.
    process.stderr.write(`Invalid environment configuration:\n${details}\n`);
    process.exit(1);
  }

  return result.data;
}

export const env = Object.freeze(loadEnv());

export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
