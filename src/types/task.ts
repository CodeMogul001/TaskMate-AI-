export type TaskFilter = 'all' | 'active' | 'completed';

export type NavSection =
  | 'dashboard'
  | 'all'
  | 'active'
  | 'completed'
  | 'ai-generator'
  | 'settings';

export type TaskSource = 'manual' | 'ai';

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  source: TaskSource;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  source?: TaskSource;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  completed?: boolean;
}

export interface GeneratedTaskDraft {
  draftId: string;
  title: string;
  description?: string;
}

export interface GenerateTasksResult {
  tasks: Array<{
    title: string;
    description?: string;
  }>;
  provider: 'gemini' | 'openai' | 'demo';
  notice?: string;
}

export interface AiProviderStatus {
  provider: 'gemini' | 'openai' | 'demo';
  configured: boolean;
}

export interface TaskStats {
  total: number;
  active: number;
  completed: number;
  completionRate: number;
}

export interface AppSettings {
  defaultFilter: TaskFilter;
  preferredTaskCount: 3 | 4 | 5;
  confirmSingleDelete: boolean;
}
