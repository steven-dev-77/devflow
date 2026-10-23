import { Activity, RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';

import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';

import { useHealthQuery, type DatabaseStatus } from '../api/health';
import { formatUptime, summarizeConnection, type ConnectionLevel } from '../lib/status';

const LEVEL_BADGE: Record<ConnectionLevel, BadgeProps['variant']> = {
  online: 'success',
  degraded: 'warning',
  offline: 'destructive',
  checking: 'secondary',
};

const DATABASE_BADGE: Record<DatabaseStatus, BadgeProps['variant']> = {
  connected: 'success',
  connecting: 'warning',
  disconnecting: 'warning',
  disconnected: 'destructive',
};

function StatusRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  );
}

export function SystemStatusCard({ className }: { className?: string }) {
  const health = useHealthQuery();
  const summary = summarizeConnection(health);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity aria-hidden="true" className="size-4 text-primary" />
          System status
        </CardTitle>
        <CardDescription>Live health of the DevFlow API and its services.</CardDescription>
        <CardAction>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Refresh system status"
            disabled={health.isFetching}
            onClick={() => void health.refetch()}
          >
            <RefreshCw className={cn(health.isFetching && 'animate-spin')} />
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent>
        {health.isPending ? (
          <div className="space-y-3" aria-label="Loading system status">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-5 w-full" />
            ))}
          </div>
        ) : (
          <dl className="divide-y">
            <StatusRow label="Overall">
              <Badge variant={LEVEL_BADGE[summary.level]}>{summary.label}</Badge>
            </StatusRow>

            {health.isError ? (
              <StatusRow label="Error">
                <span className="text-destructive">
                  {health.error instanceof ApiError
                    ? health.error.message
                    : 'Unexpected error while checking status'}
                </span>
              </StatusRow>
            ) : (
              <>
                <StatusRow label="Database">
                  <Badge
                    variant={DATABASE_BADGE[health.data.services.database]}
                    className="capitalize"
                  >
                    {health.data.services.database}
                  </Badge>
                </StatusRow>
                <StatusRow label="Environment">
                  <span className="capitalize">{health.data.environment}</span>
                </StatusRow>
                <StatusRow label="API version">{health.data.version}</StatusRow>
                <StatusRow label="Uptime">{formatUptime(health.data.uptimeSeconds)}</StatusRow>
              </>
            )}
          </dl>
        )}
      </CardContent>
    </Card>
  );
}
