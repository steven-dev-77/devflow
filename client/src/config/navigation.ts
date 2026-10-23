import {
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react';

export const ROUTES = {
  dashboard: '/',
  projects: '/projects',
  tasks: '/tasks',
  team: '/team',
  settings: '/settings',
} as const;

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const navigation: NavSection[] = [
  {
    label: 'Workspace',
    items: [
      { title: 'Dashboard', href: ROUTES.dashboard, icon: LayoutDashboard },
      { title: 'Projects', href: ROUTES.projects, icon: FolderKanban },
      { title: 'Tasks', href: ROUTES.tasks, icon: ListChecks },
      { title: 'Team', href: ROUTES.team, icon: Users },
    ],
  },
  {
    label: 'Account',
    items: [{ title: 'Settings', href: ROUTES.settings, icon: Settings }],
  },
];
