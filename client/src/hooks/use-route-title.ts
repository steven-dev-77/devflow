import { useMatches } from 'react-router';

/** Metadata attached to routes via the `handle` property. */
export interface RouteHandle {
  title: string;
}

function isRouteHandle(handle: unknown): handle is RouteHandle {
  return (
    typeof handle === 'object' &&
    handle !== null &&
    typeof (handle as Partial<RouteHandle>).title === 'string'
  );
}

/** Returns the title of the deepest matched route that defines one. */
export function useRouteTitle(): string | undefined {
  const matches = useMatches();
  return matches
    .map(({ handle }) => handle)
    .filter(isRouteHandle)
    .at(-1)?.title;
}
