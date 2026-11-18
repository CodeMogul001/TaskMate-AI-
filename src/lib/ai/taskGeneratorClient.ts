import type { AiProviderStatus, GenerateTasksResult } from '../../types/task';
import { validateAiTasksPayload } from '../validation/taskValidation';

export async function fetchAiStatus(): Promise<AiProviderStatus> {
  const response = await fetch('/api/ai/status');
  if (!response.ok) {
    return { provider: 'demo', configured: false };
  }
  return (await response.json()) as AiProviderStatus;
}

export async function requestGeneratedTasks(params: {
  goal: string;
  count?: number;
  forceDemo?: boolean;
}): Promise<GenerateTasksResult> {
  const response = await fetch('/api/ai/generate-tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      goal: params.goal,
      count: params.count ?? 5,
      forceDemo: params.forceDemo ?? false,
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | (GenerateTasksResult & { error?: string })
    | null;

  if (!response.ok) {
    throw new Error(payload?.error || `Request failed with status ${response.status}`);
  }

  const validated = validateAiTasksPayload(payload);
  return {
    tasks: validated.tasks,
    provider: payload?.provider ?? 'gemini',
    notice: payload?.notice,
  };
}
