import { Users } from 'lucide-react';

import { ModulePlaceholder } from './module-placeholder';

export function TeamPage() {
  return (
    <ModulePlaceholder
      title="Team"
      description="Manage members, roles and collaboration across your workspace."
      icon={Users}
      emptyTitle="Team management is on the way"
      emptyDescription="Inviting members and managing roles will be available once authentication is in place."
    />
  );
}
