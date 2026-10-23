import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/ui-store';

import { Logo } from './logo';
import { SidebarNav } from './sidebar-nav';

/** Persistent sidebar for large screens with an icon-only collapsed mode. */
export function DesktopSidebar() {
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);

  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-svh shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 lg:flex',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      <div
        className={cn('flex h-16 items-center border-b px-4', collapsed && 'justify-center px-0')}
      >
        <Logo collapsed={collapsed} />
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <SidebarNav collapsed={collapsed} />
      </div>

      <div className={cn('border-t p-3', collapsed && 'flex justify-center')}>
        <Button
          variant="ghost"
          size={collapsed ? 'icon' : 'sm'}
          className={cn(!collapsed && 'w-full justify-start text-muted-foreground')}
          onClick={toggleSidebar}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
        >
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          {collapsed ? null : <span>Collapse</span>}
        </Button>
      </div>
    </aside>
  );
}

/** Slide-over navigation drawer for small screens. */
export function MobileSidebar() {
  const open = useUiStore((state) => state.mobileNavOpen);
  const setOpen = useUiStore((state) => state.setMobileNavOpen);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="left" className="w-72 bg-sidebar p-0">
        <div className="flex h-16 items-center border-b px-4">
          <Logo />
        </div>
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <SheetDescription className="sr-only">Navigate between DevFlow sections</SheetDescription>
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <SidebarNav
            onNavigate={() => {
              setOpen(false);
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
