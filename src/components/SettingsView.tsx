import { Download, RotateCcw, Trash2, Upload } from 'lucide-react';
import { useRef, useState, type ChangeEvent } from 'react';
import type { StorageProviderName } from '../lib/storage/taskRepository';
import type { AiProviderStatus, AppSettings, Task, TaskFilter } from '../types/task';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
  storageProvider: StorageProviderName;
  aiStatus: AiProviderStatus;
  tasks: Task[];
  onImportTasks: (tasks: Task[]) => Promise<void>;
  onLoadSampleTasks: () => Promise<void>;
  onRequestClearAll: () => void;
}

export function SettingsView({
  settings,
  onUpdateSettings,
  storageProvider,
  aiStatus,
  tasks,
  onImportTasks,
  onLoadSampleTasks,
  onRequestClearAll,
}: SettingsViewProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importMessage, setImportMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(tasks, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `taskmate-tasks-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleImportChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportMessage(null);

    try {
      const text = await file.text();
      const parsed: unknown = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        throw new Error('Imported file must contain a JSON array of tasks.');
      }
      await onImportTasks(parsed as Task[]);
      setImportMessage({
        type: 'success',
        text: `Imported ${parsed.length} tasks successfully.`,
      });
    } catch (err) {
      setImportMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to import tasks file.',
      });
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="font-display text-base font-semibold text-zinc-950">
          Workspace Preferences
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Customize how TaskMate AI plans tasks and behaves across sessions.
        </p>

        <div className="mt-6 space-y-5 divide-y divide-zinc-100">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <label
                htmlFor="default-filter-select"
                className="text-sm font-medium text-zinc-900"
              >
                Default task filter
              </label>
              <p className="text-xs text-zinc-500">
                Choose which tasks appear first when opening the dashboard.
              </p>
            </div>
            <select
              id="default-filter-select"
              value={settings.defaultFilter}
              onChange={(e) =>
                onUpdateSettings({ defaultFilter: e.target.value as TaskFilter })
              }
              className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
            >
              <option value="all">All Tasks</option>
              <option value="active">Active Tasks</option>
              <option value="completed">Completed Tasks</option>
            </select>
          </div>

          <div className="flex flex-col gap-2 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <label
                htmlFor="task-count-select"
                className="text-sm font-medium text-zinc-900"
              >
                AI tasks per goal
              </label>
              <p className="text-xs text-zinc-500">
                Target number of actionable steps generated for each goal.
              </p>
            </div>
            <select
              id="task-count-select"
              value={settings.preferredTaskCount}
              onChange={(e) =>
                onUpdateSettings({
                  preferredTaskCount: Number(e.target.value) as 3 | 4 | 5,
                })
              }
              className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
            >
              <option value={3}>3 tasks</option>
              <option value={4}>4 tasks</option>
              <option value={5}>5 tasks</option>
            </select>
          </div>

          <div className="flex items-center justify-between gap-4 pt-5">
            <div>
              <label
                htmlFor="confirm-single-delete-toggle"
                className="text-sm font-medium text-zinc-900"
              >
                Confirm individual task deletion
              </label>
              <p className="text-xs text-zinc-500">
                Ask for confirmation before deleting a single task row. Bulk actions always
                require confirmation.
              </p>
            </div>
            <input
              id="confirm-single-delete-toggle"
              type="checkbox"
              checked={settings.confirmSingleDelete}
              onChange={(e) =>
                onUpdateSettings({ confirmSingleDelete: e.target.checked })
              }
              className="h-4 w-4 rounded border-zinc-300 text-zinc-950 focus:ring-blue-600"
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="font-display text-base font-semibold text-zinc-950">
          Storage &amp; AI Environment
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Active runtime configuration detected from your deployment environment.
        </p>

        <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4">
            <dt className="text-xs font-medium text-zinc-500">Persistence Adapter</dt>
            <dd className="mt-1 text-sm font-medium text-zinc-900">
              {storageProvider === 'supabase'
                ? 'Supabase PostgreSQL (REST)'
                : 'Browser LocalStorage (MVP)'}
            </dd>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4">
            <dt className="text-xs font-medium text-zinc-500">AI Planning Engine</dt>
            <dd className="mt-1 text-sm font-medium text-zinc-900">
              {aiStatus.provider === 'gemini'
                ? 'Gemini Server API (Configured)'
                : aiStatus.provider === 'openai'
                  ? 'OpenAI Server API (Configured)'
                  : 'Offline Demo Planner (No API key set)'}
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-zinc-100 pt-5">
          <button
            type="button"
            onClick={handleExport}
            disabled={tasks.length === 0}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export JSON</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Import JSON</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={(e) => void handleImportChange(e)}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => void onLoadSampleTasks()}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Load Sample Tasks</span>
          </button>

          <button
            type="button"
            onClick={onRequestClearAll}
            disabled={tasks.length === 0}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-200 bg-white px-3.5 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear All Tasks</span>
          </button>
        </div>

        {importMessage && (
          <p
            role="status"
            className={`mt-3 text-xs ${
              importMessage.type === 'success' ? 'text-emerald-700' : 'text-red-600'
            }`}
          >
            {importMessage.text}
          </p>
        )}
      </section>
    </div>
  );
}
