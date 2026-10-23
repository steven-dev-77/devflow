import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiClient } from '@/lib/api-client';

export const databaseStatusSchema = z.enum([
  'disconnected',
  'connected',
  'connecting',
  'disconnecting',
]);

export const healthReportSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  environment: z.string(),
  version: z.string(),
  uptimeSeconds: z.number().nonnegative(),
  timestamp: z.iso.datetime(),
  services: z.object({
    database: databaseStatusSchema,
  }),
});

export type HealthReport = z.infer<typeof healthReportSchema>;
export type DatabaseStatus = z.infer<typeof databaseStatusSchema>;

const HEALTH_POLL_INTERVAL_MS = 30_000;

export const healthQueryOptions = queryOptions({
  queryKey: ['system', 'health'] as const,
  queryFn: ({ signal }) => apiClient.get('/health', healthReportSchema, { signal }),
  refetchInterval: HEALTH_POLL_INTERVAL_MS,
  staleTime: HEALTH_POLL_INTERVAL_MS / 2,
  retry: false,
});

export function useHealthQuery() {
  return useQuery(healthQueryOptions);
}
