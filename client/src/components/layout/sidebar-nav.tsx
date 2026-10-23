import { NavLink } from 'react-router';

import { navigation } from '@/config/navigation';
import { cn } from '@/lib/utils';

interface SidebarNavProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function SidebarNav({ collapsed = false, onNavigate }: SidebarNavProps) {
  return (
    <nav aria-label="Main navigation" className="flex flex-col gap-6">
      {navigation.map((section) => (
        <div key={section.label} className="flex flex-col gap-1">
          <h2
            className={cn(
              'px-3 pb-1 text-xs font-medium tracking-wider text-muted-foreground uppercase',
              collapsed && 'sr-only',
            )}
          >
            {section.label}
          </h2>
          <ul className="flex flex-col gap-1">
            {section.items.map(({ title, href, icon: Icon }) => (
              <li key={href}>
                <NavLink
                  to={href}
                  end={href === '/'}
                  onClick={onNavigate}
                  title={collapsed ? title : undefined}
                  className={({ isActive }) =>
                    cn(
                      'flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium text-sidebar-foreground transition-colors outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-[3px] focus-visible:ring-sidebar-ring/50',
                      isActive && 'bg-sidebar-accent text-sidebar-accent-foreground',
                      collapsed && 'justify-center px-0',
                    )
                  }
                >
                  <Icon aria-hidden="true" className="size-4 shrink-0" />
                  <span className={cn(collapsed && 'sr-only')}>{title}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
