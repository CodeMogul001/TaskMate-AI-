import { X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { validateManualTaskInput } from '../lib/validation/taskValidation';
import type { Task } from '../types/task';

interface TaskModalProps {
  open: boolean;
  editingTask: Task | null;
  onClose: () => void;
  onSave: (data: { title: string; description?: string }, taskId?: string) => Promise<void>;
}

export function TaskModal({ open, editingTask, onClose, onSave }: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(editingTask?.title ?? '');
    setDescription(editingTask?.description ?? '');
    setError(null);
  }, [open, editingTask]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validated = validateManualTaskInput(title, description);
    if (!validated.valid) {
      setError(validated.error ?? 'Please provide a valid task title.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSave(
        {
          title: validated.title,
          description: validated.description,
        },
        editingTask?.id
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save task.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
      data-testid="task-modal"
    >
      <div
        className="fixed inset-0 bg-zinc-950/35 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between gap-4">
          <h2 id="task-modal-title" className="font-display text-lg font-semibold text-zinc-950">
            {editingTask ? 'Edit Task' : 'New Task'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="modal-task-title"
              className="block text-xs font-medium text-zinc-700"
            >
              Title
            </label>
            <input
              id="modal-task-title"
              data-testid="edit-task-title-input"
              type="text"
              autoFocus
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g., Summarize chapter 3 lecture notes"
              className="mt-1.5 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            />
          </div>

          <div>
            <label
              htmlFor="modal-task-description"
              className="block text-xs font-medium text-zinc-700"
            >
              Description (optional)
            </label>
            <textarea
              id="modal-task-description"
              data-testid="edit-task-description-input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add helpful context, deadlines, or sub-notes..."
              className="mt-1.5 w-full resize-y rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            />
          </div>

          {error && (
            <p role="alert" className="text-xs text-red-600">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="save-task-button"
              disabled={isSaving}
              className="h-10 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 whitespace-nowrap"
            >
              {isSaving ? 'Saving...' : editingTask ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
