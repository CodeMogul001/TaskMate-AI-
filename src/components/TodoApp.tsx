'use client';

import { useState, type FormEvent } from 'react';
import { generateTasksFromGoal } from '../lib/generateTasks';
import type { TodoFilter, TodoTask } from '../types/todo';
import { TodoItem } from './TodoItem';

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function TodoApp() {
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [manualTitle, setManualTitle] = useState('');
  const [goalInput, setGoalInput] = useState('');
  const [filter, setFilter] = useState<TodoFilter>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [goalError, setGoalError] = useState<string | null>(null);

  const handleAddManualTask = (event: FormEvent) => {
    event.preventDefault();
    const cleaned = manualTitle.trim();
    if (!cleaned) return;

    const newTask: TodoTask = {
      id: createId(),
      title: cleaned,
      completed: false,
    };

    setTasks((prev) => [newTask, ...prev]);
    setManualTitle('');
  };

  const handleGenerateTasks = async (event: FormEvent) => {
    event.preventDefault();
    const cleanedGoal = goalInput.trim();
    if (!cleanedGoal) {
      setGoalError('Please describe a goal to generate tasks.');
      return;
    }

    setIsGenerating(true);
    setGoalError(null);

    try {
      const titles = await generateTasksFromGoal(cleanedGoal);
      const generatedTasks: TodoTask[] = titles.slice(0, 5).map((title) => ({
        id: createId(),
        title,
        completed: false,
      }));
      setTasks((prev) => [...generatedTasks, ...prev]);
      setGoalInput('');
    } catch (err) {
      setGoalError(
        err instanceof Error ? err.message : 'Unable to generate tasks.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const handleEditTask = (id: string, nextTitle: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, title: nextTitle } : task
      )
    );
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const activeCount = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.length - activeCount;

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  const filterOptions: Array<{ id: TodoFilter; label: string; count: number }> = [
    { id: 'all', label: 'All', count: tasks.length },
    { id: 'active', label: 'Active', count: activeCount },
    { id: 'completed', label: 'Completed', count: completedCount },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-10 text-zinc-900 sm:px-6 sm:py-14">
      <main className="mx-auto w-full max-w-2xl space-y-6">
        {/* Header */}
        <header className="space-y-1.5">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl text-balance">
            TaskMate AI
          </h1>
          <p className="text-sm text-zinc-500 tabular-nums">
            {activeCount} active · {completedCount} completed
          </p>
        </header>

        {/* AI Goal Generator */}
        <section
          aria-labelledby="goal-generator-label"
          className="rounded-xl border border-zinc-200 bg-white p-5 sm:p-6"
        >
          <form onSubmit={handleGenerateTasks} className="space-y-3">
            <label
              id="goal-generator-label"
              htmlFor="goal-input"
              className="block text-sm font-medium text-zinc-900"
            >
              Describe a goal
            </label>
            <div className="flex flex-col gap-2.5 sm:flex-row">
              <input
                id="goal-input"
                data-testid="ai-goal-input"
                type="text"
                value={goalInput}
                onChange={(e) => {
                  setGoalInput(e.target.value);
                  if (goalError) setGoalError(null);
                }}
                placeholder="e.g., Help me prepare for my university exam tomorrow"
                className="h-10 flex-1 rounded-lg border border-zinc-200 bg-zinc-50/60 px-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/15"
              />
              <button
                type="submit"
                data-testid="generate-tasks-button"
                disabled={isGenerating || !goalInput.trim()}
                className="h-10 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 whitespace-nowrap shrink-0"
              >
                {isGenerating ? 'Generating...' : 'Generate tasks'}
              </button>
            </div>
            {goalError && (
              <p role="alert" className="text-xs text-red-600">
                {goalError}
              </p>
            )}
          </form>
        </section>

        {/* Manual Task Input + Filters + List */}
        <section
          aria-label="Task workspace"
          className="overflow-hidden rounded-xl border border-zinc-200 bg-white"
        >
          {/* Manual Add Form */}
          <form
            onSubmit={handleAddManualTask}
            className="flex flex-col gap-2.5 border-b border-zinc-200 p-4 sm:flex-row sm:p-5"
          >
            <label htmlFor="manual-task-input" className="sr-only">
              Add a task
            </label>
            <input
              id="manual-task-input"
              data-testid="task-input"
              type="text"
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              placeholder="Add a task manually..."
              className="h-10 flex-1 rounded-lg border border-zinc-200 bg-zinc-50/60 px-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            />
            <button
              type="submit"
              data-testid="add-task-button"
              disabled={!manualTitle.trim()}
              className="h-10 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 whitespace-nowrap shrink-0"
            >
              Add task
            </button>
          </form>

          {/* Filter Buttons */}
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50/60 px-4 py-3 sm:px-5">
            <div
              role="tablist"
              aria-label="Filter tasks"
              className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 p-1"
            >
              {filterOptions.map((option) => {
                const isSelected = filter === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    data-testid={`task-filter-${option.id}`}
                    onClick={() => setFilter(option.id)}
                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                      isSelected
                        ? 'bg-white text-zinc-950 shadow-xs'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    <span>{option.label}</span>
                    <span className="font-mono text-[11px] text-zinc-400 tabular-nums">
                      {option.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Task List or Empty State */}
          {filteredTasks.length === 0 ? (
            <div
              data-testid="empty-tasks-state"
              className="px-6 py-12 text-center"
            >
              <p className="text-sm font-medium text-zinc-900">
                {tasks.length === 0
                  ? 'No tasks yet'
                  : filter === 'active'
                    ? 'No active tasks'
                    : 'No completed tasks'}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {tasks.length === 0
                  ? 'Add a task above or describe a goal to generate 3–5 steps.'
                  : 'Switch filters above to view your other tasks.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-100" aria-label="Tasks">
              {filteredTasks.map((task) => (
                <TodoItem
                  key={task.id}
                  task={task}
                  onToggle={handleToggleTask}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
                />
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
