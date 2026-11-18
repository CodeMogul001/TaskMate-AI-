import type {
  AppSettings,
  CreateTaskInput,
  Task,
  UpdateTaskInput,
} from '../../types/task';
import { validateManualTaskInput } from '../validation/taskValidation';

const TASKS_STORAGE_KEY = 'taskmate_ai_tasks_v1';
const SETTINGS_STORAGE_KEY = 'taskmate_ai_settings_v1';

export type StorageProviderName = 'localStorage' | 'supabase';

export interface TaskRepository {
  readonly providerName: StorageProviderName;
  getAll(): Promise<Task[]>;
  create(input: CreateTaskInput): Promise<Task>;
  bulkCreate(inputs: CreateTaskInput[]): Promise<Task[]>;
  update(id: string, input: UpdateTaskInput): Promise<Task>;
  delete(id: string): Promise<void>;
  clearCompleted(): Promise<Task[]>;
  replaceAll(tasks: Task[]): Promise<Task[]>;
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function isValidTaskRecord(item: unknown): item is Task {
  if (!item || typeof item !== 'object') return false;
  const candidate = item as Partial<Task>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.completed === 'boolean' &&
    typeof candidate.createdAt === 'string'
  );
}

export class LocalStorageTaskRepository implements TaskRepository {
  readonly providerName: StorageProviderName = 'localStorage';

  private readTasks(): Task[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(TASKS_STORAGE_KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(isValidTaskRecord).map((t) => ({
        id: t.id,
        title: t.title,
        description: typeof t.description === 'string' ? t.description : undefined,
        completed: Boolean(t.completed),
        createdAt: t.createdAt,
        updatedAt: typeof t.updatedAt === 'string' ? t.updatedAt : t.createdAt,
        source: t.source === 'ai' ? 'ai' : 'manual',
      }));
    } catch {
      return [];
    }
  }

  private writeTasks(tasks: Task[]): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  }

  async getAll(): Promise<Task[]> {
    return this.readTasks();
  }

  async create(input: CreateTaskInput): Promise<Task> {
    const validated = validateManualTaskInput(input.title, input.description);
    if (!validated.valid) {
      throw new Error(validated.error ?? 'Invalid task input.');
    }
    const now = new Date().toISOString();
    const newTask: Task = {
      id: generateId(),
      title: validated.title,
      description: validated.description,
      completed: false,
      createdAt: now,
      updatedAt: now,
      source: input.source === 'ai' ? 'ai' : 'manual',
    };
    const existing = this.readTasks();
    this.writeTasks([newTask, ...existing]);
    return newTask;
  }

  async bulkCreate(inputs: CreateTaskInput[]): Promise<Task[]> {
    const now = new Date().toISOString();
    const created: Task[] = [];
    for (const item of inputs) {
      const validated = validateManualTaskInput(item.title, item.description);
      if (!validated.valid) continue;
      created.push({
        id: generateId(),
        title: validated.title,
        description: validated.description,
        completed: false,
        createdAt: now,
        updatedAt: now,
        source: item.source === 'ai' ? 'ai' : 'manual',
      });
    }
    if (created.length === 0) {
      throw new Error('No valid tasks to add.');
    }
    const existing = this.readTasks();
    this.writeTasks([...created, ...existing]);
    return created;
  }

  async update(id: string, input: UpdateTaskInput): Promise<Task> {
    const existing = this.readTasks();
    const idx = existing.findIndex((t) => t.id === id);
    if (idx === -1) {
      throw new Error('Task not found.');
    }
    const current = existing[idx];
    let nextTitle = current.title;
    let nextDescription = current.description;

    if (input.title !== undefined || input.description !== undefined) {
      const validated = validateManualTaskInput(
        input.title ?? current.title,
        input.description !== undefined ? input.description : current.description
      );
      if (!validated.valid) {
        throw new Error(validated.error ?? 'Invalid task update.');
      }
      nextTitle = validated.title;
      nextDescription = validated.description;
    }

    const updated: Task = {
      ...current,
      title: nextTitle,
      description: nextDescription,
      completed: input.completed !== undefined ? input.completed : current.completed,
      updatedAt: new Date().toISOString(),
    };

    const nextList = [...existing];
    nextList[idx] = updated;
    this.writeTasks(nextList);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const existing = this.readTasks();
    const nextList = existing.filter((t) => t.id !== id);
    this.writeTasks(nextList);
  }

  async clearCompleted(): Promise<Task[]> {
    const existing = this.readTasks();
    const activeOnly = existing.filter((t) => !t.completed);
    this.writeTasks(activeOnly);
    return activeOnly;
  }

  async replaceAll(tasks: Task[]): Promise<Task[]> {
    const sanitized = tasks.filter(isValidTaskRecord);
    this.writeTasks(sanitized);
    return sanitized;
  }
}

export class SupabaseTaskRepository implements TaskRepository {
  readonly providerName: StorageProviderName = 'supabase';
  private readonly url: string;
  private readonly anonKey: string;

  constructor(url: string, anonKey: string) {
    this.url = url.replace(/\/+$/, '');
    this.anonKey = anonKey;
  }

  private get headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      apikey: this.anonKey,
      Authorization: `Bearer ${this.anonKey}`,
      Prefer: 'return=representation',
    };
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.url}/rest/v1/${path}`, {
      ...init,
      headers: {
        ...this.headers,
        ...(init?.headers ?? {}),
      },
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Supabase request failed (${response.status}): ${text || response.statusText}`);
    }
    if (response.status === 204) {
      return undefined as T;
    }
    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  async getAll(): Promise<Task[]> {
    const rows = await this.request<Array<Record<string, unknown>>>(
      'tasks?select=*&order=created_at.desc'
    );
    return rows.map((row) => ({
      id: String(row.id),
      title: String(row.title),
      description: typeof row.description === 'string' ? row.description : undefined,
      completed: Boolean(row.completed),
      createdAt: String(row.created_at ?? new Date().toISOString()),
      updatedAt: String(row.updated_at ?? row.created_at ?? new Date().toISOString()),
      source: row.source === 'ai' ? 'ai' : 'manual',
    }));
  }

  async create(input: CreateTaskInput): Promise<Task> {
    const validated = validateManualTaskInput(input.title, input.description);
    if (!validated.valid) {
      throw new Error(validated.error ?? 'Invalid task input.');
    }
    const now = new Date().toISOString();
    const payload = {
      id: generateId(),
      title: validated.title,
      description: validated.description ?? null,
      completed: false,
      created_at: now,
      updated_at: now,
      source: input.source === 'ai' ? 'ai' : 'manual',
    };
    const rows = await this.request<Array<Record<string, unknown>>>('tasks', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const row = rows[0] ?? payload;
    return {
      id: String(row.id),
      title: String(row.title),
      description: typeof row.description === 'string' ? row.description : undefined,
      completed: Boolean(row.completed),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
      source: row.source === 'ai' ? 'ai' : 'manual',
    };
  }

  async bulkCreate(inputs: CreateTaskInput[]): Promise<Task[]> {
    const now = new Date().toISOString();
    const payloads = inputs
      .map((item) => {
        const validated = validateManualTaskInput(item.title, item.description);
        if (!validated.valid) return null;
        return {
          id: generateId(),
          title: validated.title,
          description: validated.description ?? null,
          completed: false,
          created_at: now,
          updated_at: now,
          source: item.source === 'ai' ? 'ai' : 'manual',
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);

    if (payloads.length === 0) {
      throw new Error('No valid tasks to add.');
    }

    const rows = await this.request<Array<Record<string, unknown>>>('tasks', {
      method: 'POST',
      body: JSON.stringify(payloads),
    });

    return rows.map((row) => ({
      id: String(row.id),
      title: String(row.title),
      description: typeof row.description === 'string' ? row.description : undefined,
      completed: Boolean(row.completed),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
      source: row.source === 'ai' ? 'ai' : 'manual',
    }));
  }

  async update(id: string, input: UpdateTaskInput): Promise<Task> {
    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (input.title !== undefined) {
      const validated = validateManualTaskInput(input.title, input.description);
      if (!validated.valid) {
        throw new Error(validated.error ?? 'Invalid task update.');
      }
      patch.title = validated.title;
      if (input.description !== undefined) {
        patch.description = validated.description ?? null;
      }
    } else if (input.description !== undefined) {
      patch.description = input.description.trim() || null;
    }
    if (input.completed !== undefined) {
      patch.completed = input.completed;
    }

    const rows = await this.request<Array<Record<string, unknown>>>(
      `tasks?id=eq.${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }
    );
    const row = rows[0];
    if (!row) {
      throw new Error('Task not found.');
    }
    return {
      id: String(row.id),
      title: String(row.title),
      description: typeof row.description === 'string' ? row.description : undefined,
      completed: Boolean(row.completed),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
      source: row.source === 'ai' ? 'ai' : 'manual',
    };
  }

  async delete(id: string): Promise<void> {
    await this.request<void>(`tasks?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  async clearCompleted(): Promise<Task[]> {
    await this.request<void>('tasks?completed=eq.true', {
      method: 'DELETE',
    });
    return this.getAll();
  }

  async replaceAll(tasks: Task[]): Promise<Task[]> {
    await this.request<void>('tasks?id=neq.00000000-0000-0000-0000-000000000000', {
      method: 'DELETE',
    });
    if (tasks.length === 0) return [];
    return this.bulkCreate(
      tasks.map((t) => ({
        title: t.title,
        description: t.description,
        source: t.source,
      }))
    );
  }
}

export function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return Boolean(
    typeof url === 'string' &&
      url.startsWith('http') &&
      typeof key === 'string' &&
      key.length > 10
  );
}

let cachedRepo: TaskRepository | null = null;

export function getTaskRepository(): TaskRepository {
  if (cachedRepo) return cachedRepo;
  if (isSupabaseConfigured()) {
    cachedRepo = new SupabaseTaskRepository(
      import.meta.env.VITE_SUPABASE_URL as string,
      import.meta.env.VITE_SUPABASE_ANON_KEY as string
    );
  } else {
    cachedRepo = new LocalStorageTaskRepository();
  }
  return cachedRepo;
}

export const DEFAULT_SETTINGS: AppSettings = {
  defaultFilter: 'all',
  preferredTaskCount: 5,
  confirmSingleDelete: false,
};

export function loadAppSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      defaultFilter:
        parsed.defaultFilter === 'active' || parsed.defaultFilter === 'completed'
          ? parsed.defaultFilter
          : 'all',
      preferredTaskCount:
        parsed.preferredTaskCount === 3 || parsed.preferredTaskCount === 4
          ? parsed.preferredTaskCount
          : 5,
      confirmSingleDelete: Boolean(parsed.confirmSingleDelete),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveAppSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}
