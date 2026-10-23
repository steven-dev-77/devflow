import { cn } from '@/lib/utils';

import { useHealthQuery } from '../api/health';
import { summarizeConnection, type ConnectionLevel } from '../lib/status';

const DOT_STYLES: Record<ConnectionLevel, string> = {
  online: 'bg-success',
  degraded: 'bg-warning',
  offline: 'bg-destructive',
  checking: 'bg-muted-foreground animate-pulse',
};

/** Compact header indicator reflecting live API and database health. */
export function ApiStatusIndicator({ className }: { className?: string }) {
  const health = useHealthQuery();
  const { level, label } = summarizeConnection(health);

  return (
    <div
      role="status"
      aria-live="polite"
      title={label}
      className={cn(
        'flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs text-muted-foreground',
        className,
      )}
    >
      <span aria-hidden="true" className={cn('size-2 rounded-full', DOT_STYLES[level])} />
      <span className="hidden sm:inline">{label}</span>
      <span className="sr-only sm:hidden">{label}</span>
    </div>
  );
}
