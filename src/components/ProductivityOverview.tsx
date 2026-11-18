import type { TaskStats } from '../types/task';

interface ProductivityOverviewProps {
  stats: TaskStats;
}

export function ProductivityOverview({ stats }: ProductivityOverviewProps) {
  const cards = [
    {
      label: 'Total Tasks',
      value: stats.total,
      detail: stats.total === 0 ? 'No tasks logged yet' : 'Across all lists',
      testId: 'stat-total-tasks',
      accentClass: 'text-zinc-950',
    },
    {
      label: 'Active Tasks',
      value: stats.active,
      detail: stats.active === 0 ? 'All caught up' : 'Remaining to complete',
      testId: 'stat-active-tasks',
      accentClass: 'text-blue-700',
    },
    {
      label: 'Completed Tasks',
      value: stats.completed,
      detail: `${stats.completionRate}% completion rate`,
      testId: 'stat-completed-tasks',
      accentClass: 'text-emerald-700',
    },
  ];

  return (
    <section aria-label="Productivity Overview" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-zinc-200 bg-white p-5 transition-colors duration-150"
        >
          <p className="text-sm font-medium text-zinc-500">{card.label}</p>
          <p
            data-testid={card.testId}
            className={`mt-2 font-mono text-3xl font-semibold tracking-tight tabular-nums ${card.accentClass}`}
          >
            {card.value}
          </p>
          <p className="mt-1.5 text-xs text-zinc-500 tabular-nums">{card.detail}</p>
        </div>
      ))}
    </section>
  );
}
