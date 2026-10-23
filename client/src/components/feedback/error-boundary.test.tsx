import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ErrorBoundary } from './error-boundary';

function Bomb({ explode }: { explode: boolean }) {
  if (explode) throw new Error('Kaboom');
  return <p>Content rendered</p>;
}

function Harness() {
  const [explode, setExplode] = useState(true);
  return (
    <ErrorBoundary
      fallback={({ reset }) => (
        <button
          type="button"
          onClick={() => {
            setExplode(false);
            reset();
          }}
        >
          Recover
        </button>
      )}
    >
      <Bomb explode={explode} />
    </ErrorBoundary>
  );
}

describe('ErrorBoundary', () => {
  it('renders the default fallback when a child throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <ErrorBoundary>
        <Bomb explode />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('recovers after reset', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const user = userEvent.setup();

    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Recover' }));

    expect(screen.getByText('Content rendered')).toBeInTheDocument();
  });

  it('reports errors to the onError callback', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <Bomb explode />
      </ErrorBoundary>,
    );

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Kaboom' }),
      expect.anything(),
    );
  });
});
