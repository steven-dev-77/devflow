import { describe, expect, it } from 'vitest';

import type { HealthReport } from '../api/health';
import { formatUptime, summarizeConnection } from './status';

const report = (overrides: Partial<HealthReport> = {}): HealthReport => ({
  status: 'ok',
  environment: 'test',
  version: '0.1.0',
  uptimeSeconds: 10,
  timestamp: new Date().toISOString(),
  services: { database: 'connected' },
  ...overrides,
});

describe('summarizeConnection', () => {
  it('reports checking while the first request is pending', () => {
    expect(summarizeConnection({ isPending: true, isError: false, data: undefined }).level).toBe(
      'checking',
    );
  });

  it('reports offline when the API cannot be reached', () => {
    expect(summarizeConnection({ isPending: false, isError: true, data: undefined }).level).toBe(
      'offline',
    );
  });

  it('distinguishes healthy and degraded reports', () => {
    expect(summarizeConnection({ isPending: false, isError: false, data: report() }).level).toBe(
      'online',
    );
    expect(
      summarizeConnection({
        isPending: false,
        isError: false,
        data: report({ status: 'degraded', services: { database: 'disconnected' } }),
      }).level,
    ).toBe('degraded');
  });
});

describe('formatUptime', () => {
  it.each([
    [42, '42s'],
    [125, '2m'],
    [3_660, '1h 1m'],
    [90_000, '1d 1h'],
  ])('formats %i seconds as %s', (seconds, expected) => {
    expect(formatUptime(seconds)).toBe(expected);
  });
});
