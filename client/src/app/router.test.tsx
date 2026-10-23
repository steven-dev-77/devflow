import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { jsonResponse, renderRoutes } from '@/test/render';

import { routes } from './router';

const healthReport = {
  status: 'degraded',
  environment: 'development',
  version: '0.1.0',
  uptimeSeconds: 125,
  timestamp: new Date().toISOString(),
  services: { database: 'disconnected' },
};

beforeEach(() => {
  vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
    Promise.resolve(jsonResponse({ success: true, data: healthReport })),
  );
});

describe('application routes', () => {
  it('renders the dashboard inside the app shell', async () => {
    renderRoutes(routes);

    expect(await screen.findByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getAllByRole('navigation', { name: 'Main navigation' }).length).toBeGreaterThan(
      0,
    );
    expect(document.title).toBe('Dashboard · DevFlow');
  });

  it('shows live system status from the health endpoint', async () => {
    renderRoutes(routes);

    expect(await screen.findByText('disconnected')).toBeInTheDocument();
    expect(screen.getAllByText('Degraded service').length).toBeGreaterThan(0);
    expect(screen.getByText('2m')).toBeInTheDocument();
  });

  it('navigates between sections from the sidebar', async () => {
    const user = userEvent.setup();
    const { router } = renderRoutes(routes);
    await screen.findByRole('heading', { level: 1, name: 'Dashboard' });

    const nav = screen.getAllByRole('navigation', { name: 'Main navigation' })[0];
    if (!nav) throw new Error('navigation not rendered');
    await user.click(within(nav).getByRole('link', { name: 'Projects' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Projects' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/projects');
    expect(within(nav).getByRole('link', { name: 'Projects' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('renders a not-found page for unknown routes', async () => {
    renderRoutes(routes, { initialPath: '/does-not-exist' });

    expect(await screen.findByText('Page not found', { selector: 'h3' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to dashboard/i })).toHaveAttribute('href', '/');
  });

  it('applies the theme selected in settings', async () => {
    const user = userEvent.setup();
    renderRoutes(routes, { initialPath: '/settings' });

    await user.click(await screen.findByRole('radio', { name: 'Dark' }));

    expect(screen.getByRole('radio', { name: 'Dark' })).toHaveAttribute('aria-checked', 'true');
  });
});
