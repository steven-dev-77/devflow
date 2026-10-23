import { Workflow } from 'lucide-react';

import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';

interface LogoProps {
  collapsed?: boolean;
  className?: string;
}

export function Logo({ collapsed = false, className }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <Workflow aria-hidden="true" className="size-4.5" />
      </div>
      <span className={cn('text-base font-semibold tracking-tight', collapsed && 'sr-only')}>
        {siteConfig.name}
      </span>
    </div>
  );
}
