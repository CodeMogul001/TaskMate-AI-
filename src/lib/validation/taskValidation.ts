export interface ValidatedGeneratedTask {
  title: string;
  description?: string;
}

export interface ValidatedAiResponse {
  tasks: ValidatedGeneratedTask[];
}

export function normalizeText(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }
  return value.replace(/\s+/g, ' ').trim();
}

export function validateManualTaskInput(title: string, description?: string): {
  valid: boolean;
  title: string;
  description?: string;
  error?: string;
} {
  const cleanTitle = normalizeText(title);
  const cleanDescription = normalizeText(description);

  if (!cleanTitle) {
    return {
      valid: false,
      title: '',
      error: 'Please enter a task title.',
    };
  }

  if (cleanTitle.length > 180) {
    return {
      valid: false,
      title: cleanTitle,
      error: 'Task title must be 180 characters or fewer.',
    };
  }

  if (cleanDescription.length > 600) {
    return {
      valid: false,
      title: cleanTitle,
      error: 'Description must be 600 characters or fewer.',
    };
  }

  return {
    valid: true,
    title: cleanTitle,
    description: cleanDescription || undefined,
  };
}

export function validateAiTasksPayload(payload: unknown): ValidatedAiResponse {
  if (!payload || typeof payload !== 'object') {
    throw new Error('AI response was not a valid JSON object.');
  }

  const rawTasks = (payload as { tasks?: unknown }).tasks;
  if (!Array.isArray(rawTasks)) {
    throw new Error('AI response did not include a tasks array.');
  }

  const seenTitles = new Set<string>();
  const validated: ValidatedGeneratedTask[] = [];

  for (const item of rawTasks) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const rawTitle = normalizeText((item as { title?: unknown }).title);
    const rawDesc = normalizeText((item as { description?: unknown }).description);

    if (!rawTitle) {
      continue;
    }

    const dedupeKey = rawTitle.toLowerCase();
    if (seenTitles.has(dedupeKey)) {
      continue;
    }
    seenTitles.add(dedupeKey);

    validated.push({
      title: rawTitle.slice(0, 140),
      description: rawDesc ? rawDesc.slice(0, 320) : undefined,
    });

    if (validated.length >= 5) {
      break;
    }
  }

  if (validated.length === 0) {
    throw new Error('AI response contained no valid actionable tasks.');
  }

  return { tasks: validated };
}
