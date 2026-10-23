import { lazy, type ComponentType } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router';

import { RootRouteError, RouteError } from '@/components/feedback/route-error';
import { AppLayout } from '@/components/layout/app-layout';
import { ROUTES } from '@/config/navigation';
import type { RouteHandle } from '@/hooks/use-route-title';

/** Code-splits a page that is exported by name rather than as the module default. */
function lazyPage<TModule extends Record<string, unknown>>(
  load: () => Promise<TModule>,
  exportName: keyof TModule & string,
) {
  return lazy(async () => {
    const module = await load();
    return { default: module[exportName] as ComponentType };
  });
}

const DashboardPage = lazyPage(() => import('@/pages/dashboard-page'), 'DashboardPage');
const ProjectsPage = lazyPage(() => import('@/pages/projects-page'), 'ProjectsPage');
const TasksPage = lazyPage(() => import('@/pages/tasks-page'), 'TasksPage');
const TeamPage = lazyPage(() => import('@/pages/team-page'), 'TeamPage');
const SettingsPage = lazyPage(() => import('@/pages/settings-page'), 'SettingsPage');
const NotFoundPage = lazyPage(() => import('@/pages/not-found-page'), 'NotFoundPage');

const handle = (title: string): RouteHandle => ({ title });

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    // Fallback for failures in the shell itself.
    errorElement: <RootRouteError />,
    children: [
      {
        // Page-level errors render inside the shell so navigation stays usable.
        errorElement: <RouteError />,
        children: [
          { index: true, element: <DashboardPage />, handle: handle('Dashboard') },
          { path: ROUTES.projects, element: <ProjectsPage />, handle: handle('Projects') },
          { path: ROUTES.tasks, element: <TasksPage />, handle: handle('Tasks') },
          { path: ROUTES.team, element: <TeamPage />, handle: handle('Team') },
          { path: ROUTES.settings, element: <SettingsPage />, handle: handle('Settings') },
          { path: '*', element: <NotFoundPage />, handle: handle('Page not found') },
        ],
      },
    ],
  },
];

export function createAppRouter() {
  return createBrowserRouter(routes);
}
