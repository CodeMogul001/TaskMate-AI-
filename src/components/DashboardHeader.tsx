import { Menu, Plus } from 'lucide-react';
import type { NavSection, TaskStats } from '../types/task';

interface DashboardHeaderProps {
  activeSection: NavSection;
  stats: TaskStats;
  onOpenMobileNav: () => void;
  onOpenAddModal: () => void;
}

const SECTION_LABELS: Record<NavSection, string> = {
  dashboard: 'Workspace Overview',
  all: 'All Tasks',
  active: 'Active Tasks',
  completed: 'Completed Tasks',
  'ai-generator': 'AI Task Generator',
  settings: 'Settings',
};

export function DashboardHeader({
  activeSection,
  stats,
  onOpenMobileNav,
  onOpenAddModal,
}: DashboardHeaderProps) {
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onOpenMobileNav}
              aria-label="Open navigation menu"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 lg:hidden shrink-0"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              <p className="text-xs font-medium text-zinc-500 truncate">
                {SECTION_LABELS[activeSection]}
              </p>
              <h1 className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-zinc-950 text-balance">
                Let&apos;s get things done.
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenAddModal}
            data-testid="header-add-task-button"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Add Task</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-zinc-500">
          <span>{formattedDate}</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">
            {stats.active} active {stats.active === 1 ? 'task' : 'tasks'}
          </span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">
            {stats.completed} completed
          </span>
        </div>
      </div>
    </header>
  );
}
