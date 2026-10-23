import { Menu } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ApiStatusIndicator } from '@/features/system/components/api-status-indicator';
import { useRouteTitle } from '@/hooks/use-route-title';
import { useUiStore } from '@/stores/ui-store';

import { Logo } from './logo';
import { ThemeToggle } from './theme-toggle';

export function Header() {
  const title = useRouteTitle();
  const setMobileNavOpen = useUiStore((state) => state.setMobileNavOpen);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label="Open navigation"
        onClick={() => {
          setMobileNavOpen(true);
        }}
      >
        <Menu />
      </Button>

      <Logo collapsed className="lg:hidden" />

      {title ? (
        <p className="hidden truncate text-sm font-medium text-muted-foreground sm:block lg:text-base lg:text-foreground">
          {title}
        </p>
      ) : null}

      <div className="ml-auto flex items-center gap-2">
        <ApiStatusIndicator />
        <ThemeToggle />
      </div>
    </header>
  );
}
