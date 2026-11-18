import { GoogleGenAI, Type } from '@google/genai';
import {
  normalizeText,
  validateAiTasksPayload,
  type ValidatedGeneratedTask,
} from '../lib/validation/taskValidation.ts';

export type AiProvider = 'gemini' | 'openai' | 'demo';

export interface ServerGenerateResult {
  tasks: ValidatedGeneratedTask[];
  provider: AiProvider;
  notice?: string;
}

const SYSTEM_INSTRUCTION = `You are a productivity planning assistant. Convert the user's goal into 3-5 specific, realistic, actionable tasks.
Rules:
- Keep tasks concise and clear.
- Break large goals into smaller actions.
- Avoid repetitive tasks.
- Use practical language.
- Preserve the user's original intention.
- Return structured JSON matching the schema.
- Each task must have a title and an optional short description.
- Never claim a task has been completed when it has only been generated.`;

function isRealKey(value: string | undefined): value is string {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed === 'MY_GEMINI_API_KEY' || trimmed === 'MY_OPENAI_API_KEY') return false;
  return true;
}

export function getAiProviderStatus(): { provider: AiProvider; configured: boolean } {
  if (isRealKey(process.env.GEMINI_API_KEY)) {
    return { provider: 'gemini', configured: true };
  }
  if (isRealKey(process.env.OPENAI_API_KEY)) {
    return { provider: 'openai', configured: true };
  }
  return { provider: 'demo', configured: false };
}

function createMockTasksForGoal(goal: string, count: number): ValidatedGeneratedTask[] {
  const lower = goal.toLowerCase();
  const targetCount = Math.min(5, Math.max(3, count));

  if (lower.includes('exam') || lower.includes('study') || lower.includes('university') || lower.includes('test')) {
    return [
      {
        title: 'Review the core lecture materials and syllabus',
        description: 'Focus on the primary chapters and highlighted concepts first.',
      },
      {
        title: 'Summarize key definitions and formulas',
        description: 'Write a concise one-page summary sheet in your own words.',
      },
      {
        title: 'Practice past examination questions',
        description: 'Time yourself on representative problems without looking at notes.',
      },
      {
        title: 'Identify and drill weak topics',
        description: 'Revisit any areas where practice answers were uncertain.',
      },
      {
        title: 'Do a final light revision before resting',
        description: 'Skim your summary sheet and get full sleep ahead of the exam.',
      },
    ].slice(0, targetCount);
  }

  if (lower.includes('launch') || lower.includes('ship') || lower.includes('release') || lower.includes('app') || lower.includes('website')) {
    return [
      {
        title: 'Finalize scope and verify core user flows',
        description: 'Walk through primary actions end-to-end and note any blockers.',
      },
      {
        title: 'Run build, type checks, and edge-case QA',
        description: 'Resolve warnings and test responsive layouts across viewports.',
      },
      {
        title: 'Prepare release notes and environment variables',
        description: 'Confirm production configuration and documentation are up to date.',
      },
      {
        title: 'Deploy to staging and verify live smoke tests',
        description: 'Check persistence, API responses, and error handling.',
      },
      {
        title: 'Publish release and monitor initial feedback',
        description: 'Share the launch update and log any follow-up improvements.',
      },
    ].slice(0, targetCount);
  }

  const conciseGoal = goal.length > 72 ? `${goal.slice(0, 69)}...` : goal;
  return [
    {
      title: `Clarify the exact outcome for "${conciseGoal}"`,
      description: 'Define what done looks like and list the required inputs or materials.',
    },
    {
      title: 'Break the work into a prioritized first step',
      description: 'Complete the smallest high-impact action in a focused 25-minute block.',
    },
    {
      title: 'Execute the core deliverable without distractions',
      description: 'Draft, build, or assemble the main body of the work.',
    },
    {
      title: 'Review quality and fill remaining gaps',
      description: 'Check for missing details, errors, or open questions.',
    },
    {
      title: 'Wrap up and schedule any follow-up actions',
      description: 'Confirm completion criteria and capture next steps if needed.',
    },
  ].slice(0, targetCount);
}

function extractReadableErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  try {
    const parsed = JSON.parse(raw) as { error?: { message?: string; code?: number } };
    if (parsed?.error?.message) {
      return parsed.error.message;
    }
  } catch {
    // not JSON
  }
  return raw;
}

function isRetryableError(err: unknown): boolean {
  const msg = extractReadableErrorMessage(err).toLowerCase();
  return (
    msg.includes('503') ||
    msg.includes('unavailable') ||
    msg.includes('high demand') ||
    msg.includes('temporarily') ||
    msg.includes('econnreset') ||
    msg.includes('etimedout')
  );
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateWithGemini(goal: string, count: number): Promise<ValidatedGeneratedTask[]> {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const prompt = `Goal: "${goal}"\nGenerate exactly ${count} practical, actionable tasks to achieve this goal.`;

  let lastError: unknown;
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: {
                      type: Type.STRING,
                      description: 'Concise, actionable task title.',
                    },
                    description: {
                      type: Type.STRING,
                      description: 'Short practical guidance for completing the task.',
                    },
                  },
                  required: ['title'],
                },
              },
            },
            required: ['tasks'],
          },
        },
      });

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        throw new Error('Gemini returned an empty response.');
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        throw new Error('Gemini returned malformed JSON.');
      }

      const validated = validateAiTasksPayload(parsed);
      return validated.tasks;
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts && isRetryableError(err)) {
        await sleep(500 * attempt);
        continue;
      }
      throw new Error(extractReadableErrorMessage(err));
    }
  }

  throw new Error(extractReadableErrorMessage(lastError));
}

async function generateWithOpenAI(goal: string, count: number): Promise<ValidatedGeneratedTask[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `${SYSTEM_INSTRUCTION}\nRespond strictly with JSON of shape {"tasks": [{"title": string, "description"?: string}]}.`,
        },
        {
          role: 'user',
          content: `Goal: "${goal}"\nGenerate ${count} specific, actionable tasks.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`OpenAI API error (${response.status}): ${errorBody || response.statusText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error('OpenAI returned an empty response.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('OpenAI returned malformed JSON.');
  }

  const validated = validateAiTasksPayload(parsed);
  return validated.tasks;
}

export async function generateTasksForGoal(
  rawGoal: string,
  requestedCount = 5,
  forceDemo = false
): Promise<ServerGenerateResult> {
  const goal = normalizeText(rawGoal);
  if (!goal) {
    throw new Error('Please describe a goal before generating tasks.');
  }
  if (goal.length > 1000) {
    throw new Error('Goal description must be 1000 characters or fewer.');
  }

  const count = Math.min(5, Math.max(3, Number(requestedCount) || 5));
  const status = getAiProviderStatus();

  if (forceDemo || !status.configured) {
    return {
      tasks: createMockTasksForGoal(goal, count),
      provider: 'demo',
      notice: status.configured
        ? 'Generated with local demo planner.'
        : 'No AI API key configured in environment — generated using offline demo planner.',
    };
  }

  if (status.provider === 'gemini') {
    const tasks = await generateWithGemini(goal, count);
    return { tasks, provider: 'gemini' };
  }

  const tasks = await generateWithOpenAI(goal, count);
  return { tasks, provider: 'openai' };
}
