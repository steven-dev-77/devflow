import { Activity, FolderKanban, ListChecks } from 'lucide-react';

import { EmptyState } from '@/components/feedback/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SystemStatusCard } from '@/features/system/components/system-status-card';

export function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="An overview of your projects, tasks and team activity."
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="grid gap-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Projects</CardTitle>
              <CardDescription>Your active projects and their progress.</CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={FolderKanban}
                title="No projects to show"
                description="Projects you create or join will appear here once project management is available."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>My tasks</CardTitle>
              <CardDescription>Work assigned to you across all projects.</CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={ListChecks}
                title="No tasks to show"
                description="Tasks assigned to you will be listed here, ordered by due date and priority."
              />
            </CardContent>
          </Card>
        </div>

        <div className="grid content-start gap-6">
          <SystemStatusCard />

          <Card>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
              <CardDescription>Updates from your team.</CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={Activity}
                title="No activity yet"
                description="Changes to projects and tasks will be recorded here."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
