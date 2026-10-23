import { useState } from 'react';
import { RouterProvider } from 'react-router';

import { ErrorBoundary } from '@/components/feedback/error-boundary';

import { AppProviders } from './providers';
import { createAppRouter } from './router';

export function App() {
  const [router] = useState(createAppRouter);

  return (
    <ErrorBoundary fullPage>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </ErrorBoundary>
  );
}
