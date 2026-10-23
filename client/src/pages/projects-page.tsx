import { FolderKanban } from 'lucide-react';

import { ModulePlaceholder } from './module-placeholder';

export function ProjectsPage() {
  return (
    <ModulePlaceholder
      title="Projects"
      description="Plan, organize and track every project in your workspace."
      icon={FolderKanban}
      emptyTitle="Project management is on the way"
      emptyDescription="Creating projects, boards and milestones will be available in an upcoming release."
    />
  );
}
