import {
  Check,
  FileText,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useState, type FormEvent, type RefObject } from 'react';
import type { CreateTaskInput, Task, TaskFilter, TaskStats } from '../types/task';

interface TaskListSectionProps {
  tasks: Task[];
  stats: TaskStats;
  isLoading: boolean;
  filter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCreateTask: (input: CreateTaskInput) => Promise<void>;
  onToggleTask: (id: string) => Promise<void>;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onClearCompleted: () => void;
  quickInputRef?: RefObject<HTMLInputElement | null>;
}

function formatShortDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function TaskListSection({
  tasks,
  stats,
  isLoading,
  filter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  onCreateTask,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onClearCompleted,
  quickInputRef,
}: TaskListSectionProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setFormError('Please enter a task title.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      await onCreateTask({
        title: cleanTitle,
        description: description.trim() || undefined,
        source: 'manual',
      });
      setTitle('');
      setDescription('');
      setShowNoteInput(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to add task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filterTabs: Array<{
    id: TaskFilter;
    label: string;
    count: number;
    testId: string;
  }> = [
    { id: 'all', label: 'All', count: stats.total, testId: 'task-filter-all' },
    { id: 'active', label: 'Active', count: stats.active, testId: 'task-filter-active' },
    {
      id: 'completed',
      label: 'Completed',
      count: stats.completed,
      testId: 'task-filter-completed',
    },
  ];

  return (
    <section
      aria-labelledby="tasks-workspace-heading"
      className="rounded-xl border border-zinc-200 bg-white"
    >
      {/* Quick Add Bar */}
      <div className="border-b border-zinc-200 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <h2
            id="tasks-workspace-heading"
            className="font-display text-base font-semibold text-zinc-950"
          >
            Tasks
          </h2>
          <button
            type="button"
            onClick={() => setShowNoteInput((prev) => !prev)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>{showNoteInput ? 'Hide description' : 'Add description'}</span>
          </button>
        </div>

        <form onSubmit={handleAddSubmit} className="mt-3 space-y-2.5">
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <label htmlFor="manual-task-input" className="sr-only">
              Task title
            </label>
            <input
              ref={quickInputRef}
              id="manual-task-input"
              data-testid="task-input"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (formError) setFormError(null);
              }}
              placeholder="Add a new task..."
              className="h-10 flex-1 rounded-lg border border-zinc-200 bg-zinc-50/60 px-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            />
            <button
              type="submit"
              data-testid="add-task-button"
              disabled={isSubmitting}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-zinc-800 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 whitespace-nowrap shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Add Task</span>
            </button>
          </div>

          {showNoteInput && (
            <div>
              <label htmlFor="manual-task-description" className="sr-only">
                Task description
              </label>
              <input
                id="manual-task-description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description or context..."
                className="h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50/60 px-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              />
            </div>
          )}

          {formError && (
            <p role="alert" className="text-xs text-red-600">
              {formError}
            </p>
          )}
        </form>
      </div>

      {/* Filters, Search & Clear Completed Toolbar */}
      <div className="flex flex-col gap-3 border-b border-zinc-200 bg-zinc-50/50 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div
          role="tablist"
          aria-label="Filter tasks"
          className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 p-1 self-start"
        >
          {filterTabs.map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                data-testid={tab.testId}
                onClick={() => onFilterChange(tab.id)}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  active
                    ? 'bg-white text-zinc-950 shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <span>{tab.label}</span>
                <span className="font-mono text-[11px] text-zinc-400 tabular-nums">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              data-testid="task-search-input"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search tasks..."
              aria-label="Search tasks"
              className="h-9 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-8 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 hover:text-zinc-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            data-testid="clear-completed-button"
            onClick={onClearCompleted}
            disabled={stats.completed === 0}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap shrink-0"
          >
            Clear Completed
          </button>
        </div>
      </div>

      {/* Task List */}
      {isLoading ? (
        <div className="divide-y divide-zinc-100 p-5 sm:p-6">
          {[1, 2, 3].map((row) => (
            <div key={row} className="flex items-center gap-3 py-3.5 animate-pulse">
              <div className="h-5 w-5 rounded bg-zinc-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 rounded bg-zinc-200" />
                <div className="h-3 w-1/3 rounded bg-zinc-100" />
              </div>
            </div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div
          data-testid="empty-tasks-state"
          className="flex flex-col items-center justify-center px-6 py-14 text-center"
        >
          <p className="font-display text-base font-medium text-zinc-900">
            {searchQuery.trim()
              ? 'No tasks match your search'
              : filter === 'active'
                ? 'No active tasks'
                : filter === 'completed'
                  ? 'No completed tasks yet'
                  : 'Your task list is empty'}
          </p>
          <p className="mt-1 max-w-sm text-sm text-zinc-500">
            {searchQuery.trim()
              ? 'Try another search term or clear your search filter.'
              : filter === 'completed'
                ? 'Check off tasks as you finish them to track your progress.'
                : 'Add a task manually above or describe a goal in the AI Task Generator.'}
          </p>
          {searchQuery.trim() ? (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="mt-4 h-9 rounded-lg border border-zinc-200 bg-white px-4 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Clear Search
            </button>
          ) : filter !== 'all' ? (
            <button
              type="button"
              onClick={() => onFilterChange('all')}
              className="mt-4 h-9 rounded-lg border border-zinc-200 bg-white px-4 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              View All Tasks
            </button>
          ) : null}
        </div>
      ) : (
        <ul className="divide-y divide-zinc-100" aria-label="Task items">
          {tasks.map((task) => (
            <li
              key={task.id}
              data-testid="task-item"
              data-completed={task.completed ? 'true' : 'false'}
              className="group flex items-start justify-between gap-3 px-5 py-4 transition-colors duration-150 hover:bg-zinc-50/70 sm:px-6"
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={task.completed}
                  aria-label={
                    task.completed
                      ? `Mark "${task.title}" as active`
                      : `Mark "${task.title}" as completed`
                  }
                  data-testid="task-checkbox"
                  onClick={() => void onToggleTask(task.id)}
                  className="-ml-1.5 -mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-md border transition-colors duration-150 ${
                      task.completed
                        ? 'border-zinc-900 bg-zinc-900 text-white'
                        : 'border-zinc-300 bg-white text-transparent hover:border-zinc-500'
                    }`}
                  >
                    <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                  </span>
                </button>

                <div className="min-w-0 flex-1 pt-0.5">
                  <p
                    className={`text-sm font-medium leading-snug break-words transition-colors ${
                      task.completed ? 'text-zinc-400 line-through' : 'text-zinc-900'
                    }`}
                  >
                    {task.title}
                  </p>
                  {task.description && (
                    <p
                      className={`mt-1 text-xs leading-relaxed break-words ${
                        task.completed ? 'text-zinc-400' : 'text-zinc-500'
                      }`}
                    >
                      {task.description}
                    </p>
                  )}
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                    <span className="font-mono tabular-nums">
                      {formatShortDate(task.createdAt)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{task.source === 'ai' ? 'AI planned' : 'Manual'}</span>
                    {task.completed && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-emerald-700 font-medium">Completed</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  data-testid="edit-task-button"
                  onClick={() => onEditTask(task)}
                  aria-label={`Edit "${task.title}"`}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  data-testid="delete-task-button"
                  onClick={() => onDeleteTask(task)}
                  aria-label={`Delete "${task.title}"`}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
