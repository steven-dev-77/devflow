import { Compass, Home } from 'lucide-react';
import { Link } from 'react-router';

import { EmptyState } from '@/components/feedback/empty-state';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/config/navigation';

export function NotFoundPage() {
  return (
    <EmptyState
      icon={Compass}
      title="Page not found"
      description="The page you're looking for doesn't exist or has been moved."
      className="mt-8"
      action={
        <Button asChild>
          <Link to={ROUTES.dashboard}>
            <Home />
            Back to dashboard
          </Link>
        </Button>
      }
    />
  );
}
