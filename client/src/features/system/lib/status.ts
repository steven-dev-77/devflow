import type { UseQueryResult } from '@tanstack/react-query';

import type { HealthReport } from '../api/health';

export type ConnectionLevel = 'online' | 'degraded' | 'offline' | 'checking';

export interface ConnectionSummary {
  level: ConnectionLevel;
  label: string;
}

/** Derives a single user-facing connection state from the health query. */
export function summarizeConnection(
  query: Pick<UseQueryResult<HealthReport>, 'data' | 'isPending' | 'isError'>,
): ConnectionSummary {
  if (query.isPending) return { level: 'checking', label: 'Checking connection' };
  if (query.isError || !query.data) return { level: 'offline', label: 'API unreachable' };
  if (query.data.status === 'ok') return { level: 'online', label: 'All systems operational' };
  return { level: 'degraded', label: 'Degraded service' };
}

export function formatUptime(totalSeconds: number): string {
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${totalSeconds}s`;
}
