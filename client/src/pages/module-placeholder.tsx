import type { LucideIcon } from 'lucide-react';

import { EmptyState } from '@/components/feedback/empty-state';
import { PageHeader } from '@/components/layout/page-header';

interface ModulePlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
}

/** Shared layout for sections whose feature module has not been implemented yet. */
export function ModulePlaceholder({
  title,
  description,
  icon,
  emptyTitle,
  emptyDescription,
}: ModulePlaceholderProps) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <EmptyState icon={icon} title={emptyTitle} description={emptyDescription} />
    </>
  );
}
