import { ListChecks } from 'lucide-react';

import { ModulePlaceholder } from './module-placeholder';

export function TasksPage() {
  return (
    <ModulePlaceholder
      title="Tasks"
      description="Everything that needs to get done, in one place."
      icon={ListChecks}
      emptyTitle="Task tracking is on the way"
      emptyDescription="Assigning, prioritizing and tracking tasks will be available in an upcoming release."
    />
  );
}
