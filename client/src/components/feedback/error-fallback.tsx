import { AlertTriangle, RotateCcw } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { env } from '@/config/env';
import { cn } from '@/lib/utils';

interface ErrorFallbackProps {
  title?: string;
  message?: string;
  error?: unknown;
  onRetry?: () => void;
  actions?: ReactNode;
  fullPage?: boolean;
}

export function ErrorFallback({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  error,
  onRetry,
  actions,
  fullPage = false,
}: ErrorFallbackProps) {
  const details = env.isDev && error instanceof Error ? (error.stack ?? error.message) : null;

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center px-6 py-16 text-center',
        fullPage && 'min-h-svh',
      )}
    >
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle aria-hidden="true" className="size-6" />
      </div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{message}</p>

      {details ? (
        <pre className="mt-6 max-h-64 w-full max-w-2xl overflow-auto rounded-lg border bg-muted p-4 text-left text-xs text-muted-foreground">
          {details}
        </pre>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {onRetry ? (
          <Button onClick={onRetry}>
            <RotateCcw />
            Try again
          </Button>
        ) : null}
        {actions}
      </div>
    </div>
  );
}
