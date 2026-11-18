import { useCallback, useEffect, useMemo, useState } from 'react';
import { getTaskRepository, type StorageProviderName } from '../lib/storage/taskRepository';
import type {
  CreateTaskInput,
  Task,
  TaskFilter,
  TaskStats,
  UpdateTaskInput,
} from '../types/task';

export function useTasks(initialFilter: TaskFilter = 'all') {
  const repository = useMemo(() => getTaskRepository(), []);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TaskFilter>(initialFilter);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const loaded = await repository.getAll();
      setTasks(loaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks.');
    } finally {
      setIsLoading(false);
    }
  }, [repository]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const addTask = useCallback(
    async (input: CreateTaskInput): Promise<Task> => {
      setError(null);
      const created = await repository.create(input);
      setTasks((prev) => [created, ...prev]);
      return created;
    },
    [repository]
  );

  const addTasksBulk = useCallback(
    async (inputs: CreateTaskInput[]): Promise<Task[]> => {
      setError(null);
      const created = await repository.bulkCreate(inputs);
      setTasks((prev) => [...created, ...prev]);
      return created;
    },
    [repository]
  );

  const updateTask = useCallback(
    async (id: string, input: UpdateTaskInput): Promise<Task> => {
      setError(null);
      const updated = await repository.update(id, input);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      return updated;
    },
    [repository]
  );

  const toggleTask = useCallback(
    async (id: string): Promise<Task> => {
      const target = tasks.find((t) => t.id === id);
      if (!target) {
        throw new Error('Task not found.');
      }
      return updateTask(id, { completed: !target.completed });
    },
    [tasks, updateTask]
  );

  const deleteTask = useCallback(
    async (id: string): Promise<void> => {
      setError(null);
      await repository.delete(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    },
    [repository]
  );

  const clearCompletedTasks = useCallback(async (): Promise<number> => {
    setError(null);
    const completedCount = tasks.filter((t) => t.completed).length;
    const remaining = await repository.clearCompleted();
    setTasks(remaining);
    return completedCount;
  }, [repository, tasks]);

  const replaceAllTasks = useCallback(
    async (nextTasks: Task[]): Promise<void> => {
      setError(null);
      const saved = await repository.replaceAll(nextTasks);
      setTasks(saved);
    },
    [repository]
  );

  const stats: TaskStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const active = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, active, completed, completionRate };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return tasks.filter((task) => {
      if (filter === 'active' && task.completed) return false;
      if (filter === 'completed' && !task.completed) return false;
      if (!query) return true;
      const titleMatch = task.title.toLowerCase().includes(query);
      const descMatch = task.description ? task.description.toLowerCase().includes(query) : false;
      return titleMatch || descMatch;
    });
  }, [tasks, filter, searchQuery]);

  const storageProvider: StorageProviderName = repository.providerName;

  return {
    tasks,
    filteredTasks,
    stats,
    isLoading,
    error,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    storageProvider,
    addTask,
    addTasksBulk,
    updateTask,
    toggleTask,
    deleteTask,
    clearCompletedTasks,
    replaceAllTasks,
    reloadTasks: loadTasks,
  };
}
