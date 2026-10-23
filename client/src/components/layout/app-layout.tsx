import { Suspense } from 'react';
import { Outlet, ScrollRestoration } from 'react-router';

import { PageSkeleton } from '@/components/feedback/page-skeleton';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { useRouteTitle } from '@/hooks/use-route-title';

import { Header } from './header';
import { DesktopSidebar, MobileSidebar } from './sidebar';

export function AppLayout() {
  useDocumentTitle(useRouteTitle());

  return (
    <div className="flex min-h-svh bg-background">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Skip to content
      </a>

      <DesktopSidebar />
      <MobileSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <Suspense fallback={<PageSkeleton />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>

      <ScrollRestoration />
    </div>
  );
}
