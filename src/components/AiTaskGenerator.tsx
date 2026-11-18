import { AlertCircle, Check, Loader2, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { requestGeneratedTasks } from '../lib/ai/taskGeneratorClient';
import type { CreateTaskInput, GeneratedTaskDraft } from '../types/task';

interface AiTaskGeneratorProps {
  preferredTaskCount: 3 | 4 | 5;
  onAddTasks: (inputs: CreateTaskInput[]) => Promise<void>;
}

const EXAMPLE_GOALS = [
  'Help me prepare for my university examination tomorrow.',
  'Plan a 2-week product launch checklist for a SaaS MVP.',
  'Organize my apartment and deep clean before guests arrive.',
];

export function AiTaskGenerator({ preferredTaskCount, onAddTasks }: AiTaskGeneratorProps) {
  const [goal, setGoal] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modeNotice, setModeNotice] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<GeneratedTaskDraft[]>([]);

  const handleGenerate = async (forceDemo = false) => {
    const trimmed = goal.trim();
    if (!trimmed) {
      setError('Please describe a goal so TaskMate AI can create an action plan.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setModeNotice(null);

    try {
      const result = await requestGeneratedTasks({
        goal: trimmed,
        count: preferredTaskCount,
        forceDemo,
      });

      const nextDrafts: GeneratedTaskDraft[] = result.tasks.map((t, index) => ({
        draftId: `draft_${Date.now()}_${index}`,
        title: t.title,
        description: t.description,
      }));

      setDrafts(nextDrafts);
      if (result.notice) {
        setModeNotice(result.notice);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate tasks right now.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void handleGenerate(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      void handleGenerate(false);
    }
  };

  const handleRemoveDraft = (draftId: string) => {
    setDrafts((prev) => prev.filter((item) => item.draftId !== draftId));
  };

  const handleAddSingleDraft = async (draft: GeneratedTaskDraft) => {
    setIsAdding(true);
    setError(null);
    try {
      await onAddTasks([
        {
          title: draft.title,
          description: draft.description,
          source: 'ai',
        },
      ]);
      setDrafts((prev) => prev.filter((item) => item.draftId !== draft.draftId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add task.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddAllDrafts = async () => {
    if (drafts.length === 0) return;
    setIsAdding(true);
    setError(null);
    try {
      await onAddTasks(
        drafts.map((d) => ({
          title: d.title,
          description: d.description,
          source: 'ai' as const,
        }))
      );
      setDrafts([]);
      setGoal('');
      setModeNotice(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add generated tasks.');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <section
      aria-labelledby="ai-generator-heading"
      className="rounded-xl border border-zinc-200 bg-white p-5 sm:p-6"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2
            id="ai-generator-heading"
            className="font-display text-lg font-semibold tracking-tight text-zinc-950"
          >
            What do you want to accomplish?
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Tell your AI assistant your goal. It&apos;ll turn it into manageable tasks.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div>
          <label htmlFor="ai-goal-textarea" className="sr-only">
            Describe your goal
          </label>
          <textarea
            id="ai-goal-textarea"
            data-testid="ai-goal-input"
            rows={3}
            value={goal}
            onChange={(e) => {
              setGoal(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="e.g., Help me prepare for my university examination tomorrow."
            className="w-full resize-y rounded-lg border border-zinc-200 bg-zinc-50/60 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-zinc-400">Try:</span>
            {EXAMPLE_GOALS.map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => {
                  setGoal(sample);
                  setError(null);
                }}
                className="rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900 text-left truncate max-w-[230px]"
              >
                {sample}
              </button>
            ))}
          </div>

          <button
            type="submit"
            data-testid="generate-tasks-button"
            disabled={isGenerating || !goal.trim()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 whitespace-nowrap shrink-0"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generating Tasks...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Generate Tasks</span>
              </>
            )}
          </button>
        </div>
      </form>

      {error && (
        <div
          role="alert"
          data-testid="ai-error-alert"
          className="mt-4 flex flex-col gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => void handleGenerate(true)}
            disabled={isGenerating}
            className="h-8 self-start rounded-md border border-red-200 bg-white px-3 text-xs font-medium text-red-800 transition-colors hover:bg-red-100/60 sm:self-auto whitespace-nowrap shrink-0"
          >
            Use Offline Demo Planner
          </button>
        </div>
      )}

      {modeNotice && !error && (
        <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs text-zinc-600">
          {modeNotice}
        </div>
      )}

      {drafts.length > 0 && (
        <div
          data-testid="generated-tasks-preview"
          className="mt-5 border-t border-zinc-200 pt-5"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-display text-sm font-semibold text-zinc-900">
                Suggested Action Plan
              </h3>
              <p className="text-xs text-zinc-500 tabular-nums">
                Review {drafts.length} {drafts.length === 1 ? 'task' : 'tasks'} below before
                adding to your list.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDrafts([])}
                disabled={isAdding}
                className="h-9 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900 whitespace-nowrap"
              >
                Discard
              </button>
              <button
                type="button"
                data-testid="add-all-generated-button"
                onClick={() => void handleAddAllDrafts()}
                disabled={isAdding}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-zinc-950 px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 whitespace-nowrap"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Add All Tasks ({drafts.length})</span>
              </button>
            </div>
          </div>

          <ul className="mt-3 divide-y divide-zinc-100 rounded-lg border border-zinc-200 bg-zinc-50/40">
            {drafts.map((draft, index) => (
              <li
                key={draft.draftId}
                data-testid="generated-task-item"
                className="flex items-start justify-between gap-3 px-4 py-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span className="mt-0.5 font-mono text-xs font-medium text-zinc-400 tabular-nums">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900">{draft.title}</p>
                    {draft.description && (
                      <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
                        {draft.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => void handleAddSingleDraft(draft)}
                    disabled={isAdding}
                    aria-label={`Add "${draft.title}" to task list`}
                    className="inline-flex h-8 items-center gap-1 rounded-md px-2.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-200/70 hover:text-zinc-950 whitespace-nowrap"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add</span>
                  </button>
                  <button
                    type="button"
                    data-testid="remove-generated-task-button"
                    onClick={() => handleRemoveDraft(draft.draftId)}
                    disabled={isAdding}
                    aria-label={`Remove "${draft.title}" from suggestions`}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
