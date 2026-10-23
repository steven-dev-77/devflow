import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/** Content-area skeleton shown while a lazily loaded page is being fetched. */
export function PageSkeleton({ className }: { className?: string }) {
  return (
    <div role="status" aria-label="Loading page" className={cn('space-y-6', className)}>
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-36 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
