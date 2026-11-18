export type TodoFilter = 'all' | 'active' | 'completed';

export interface TodoTask {
  id: string;
  title: string;
  completed: boolean;
}
