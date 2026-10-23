import { Home } from 'lucide-react';
import { isRouteErrorResponse, Link, useRouteError } from 'react-router';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/config/navigation';

import { ErrorFallback } from './error-fallback';

function isChunkLoadError(error: unknown): boolean {
  return (
    error instanceof Error &&
    /Failed to fetch dynamically imported module|Importing a module script failed/i.test(
      error.message,
    )
  );
}

interface RouteErrorProps {
  fullPage?: boolean;
}

/** Error element for React Router routes: handles thrown responses, chunk failures and crashes. */
export function RouteError({ fullPage = false }: RouteErrorProps) {
  const error = useRouteError();

  const homeAction = (
    <Button variant="outline" asChild>
      <Link to={ROUTES.dashboard}>
        <Home />
        Back to dashboard
      </Link>
    </Button>
  );

  if (isRouteErrorResponse(error)) {
    return (
      <ErrorFallback
        title={error.status === 404 ? 'Page not found' : `${error.status} ${error.statusText}`}
        message="The page you requested could not be loaded."
        actions={homeAction}
        fullPage={fullPage}
      />
    );
  }

  if (isChunkLoadError(error)) {
    // Usually caused by a new deployment replacing the previously loaded asset files.
    return (
      <ErrorFallback
        title="A new version is available"
        message="Part of the application failed to load. Reload the page to get the latest version."
        onRetry={() => {
          window.location.reload();
        }}
        fullPage={fullPage}
      />
    );
  }

  return (
    <ErrorFallback
      error={error}
      onRetry={() => {
        window.location.reload();
      }}
      actions={homeAction}
      fullPage={fullPage}
    />
  );
}

export function RootRouteError() {
  return <RouteError fullPage />;
}
