'use client';

import { useState, type FormEvent, type KeyboardEvent } from 'react';
import type { TodoTask } from '../types/todo';

interface TodoItemProps {
  task: TodoTask;
  onToggle: (id: string) => void;
  onEdit: (id: string, nextTitle: string) => void;
  onDelete: (id: string) => void;
}

export function TodoItem({ task, onToggle, onEdit, onDelete }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(task.title);

  const handleStartEdit = () => {
    setDraftTitle(task.title);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setDraftTitle(task.title);
    setIsEditing(false);
  };

  const handleSave = (event?: FormEvent) => {
    event?.preventDefault();
    const cleaned = draftTitle.trim();
    if (!cleaned) return;
    onEdit(task.id, cleaned);
    setIsEditing(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <li
      data-testid="task-item"
      data-completed={task.completed ? 'true' : 'false'}
      className="animate-task-enter flex items-center justify-between gap-3 px-4 py-3.5 transition-colors duration-150 hover:bg-zinc-50/80"
    >
      {isEditing ? (
        <form onSubmit={handleSave} className="flex flex-1 items-center gap-2">
          <input
            type="text"
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            aria-label="Edit task title"
            data-testid="edit-task-input"
            className="h-9 flex-1 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
          />
          <button
            type="submit"
            data-testid="save-task-button"
            disabled={!draftTitle.trim()}
            className="h-9 rounded-lg bg-blue-600 px-3 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
          >
            Save
          </button>
          <button
            type="button"
            onClick={handleCancelEdit}
            className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 whitespace-nowrap"
          >
            Cancel
          </button>
        </form>
      ) : (
        <>
          <div className="flex min-w-0 flex-1 items-center gap-3">
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
              onClick={() => onToggle(task.id)}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all duration-150 ${
                  task.completed
                    ? 'scale-100 border-blue-600 bg-blue-600 text-white'
                    : 'scale-95 border-zinc-300 bg-white text-transparent hover:border-zinc-400'
                }`}
              >
                <svg
                  className="h-3.5 w-3.5"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M3.5 8.5L6.5 11.5L12.5 4.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>

            <span
              className={`min-w-0 flex-1 break-words text-sm transition-colors duration-150 ${
                task.completed
                  ? 'text-zinc-400 line-through'
                  : 'text-zinc-900'
              }`}
            >
              {task.title}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              data-testid="edit-task-button"
              onClick={handleStartEdit}
              className="h-8 rounded-md px-2.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              Edit
            </button>
            <button
              type="button"
              data-testid="delete-task-button"
              onClick={() => onDelete(task.id)}
              className="h-8 rounded-md px-2.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
            >
              Delete
            </button>
          </div>
        </>
      )}
    </li>
  );
}
