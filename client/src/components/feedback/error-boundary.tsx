import { Component, type ErrorInfo, type ReactNode } from 'react';

import { ErrorFallback } from './error-fallback';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback renderer; receives the error and a reset callback. */
  fallback?: (props: { error: unknown; reset: () => void }) => ReactNode;
  /** Changing any of these values resets the boundary (e.g. the current route). */
  resetKeys?: readonly unknown[];
  onError?: (error: unknown, info: ErrorInfo) => void;
  fullPage?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: unknown;
}

function haveKeysChanged(prev: readonly unknown[] = [], next: readonly unknown[] = []): boolean {
  return prev.length !== next.length || prev.some((key, index) => !Object.is(key, next[index]));
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: unknown, info: ErrorInfo): void {
    if (this.props.onError) {
      this.props.onError(error, info);
    } else {
      console.error('Uncaught render error:', error, info.componentStack);
    }
  }

  override componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (this.state.hasError && haveKeysChanged(prevProps.resetKeys, this.props.resetKeys)) {
      this.reset();
    }
  }

  reset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  override render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback, fullPage } = this.props;

    if (!hasError) return children;
    if (fallback) return fallback({ error, reset: this.reset });

    return <ErrorFallback error={error} onRetry={this.reset} fullPage={fullPage ?? false} />;
  }
}
