/**
 * Placeholder AI task generator.
 * Replace the body of this function with a real API call
 * (e.g., POST /api/generate-tasks) when integrating an LLM provider.
 */
export async function generateTasksFromGoal(goal: string): Promise<string[]> {
  const normalized = goal.trim();
  if (!normalized) {
    throw new Error('Please describe a goal first.');
  }

  // Simulate network latency for realistic loading UI
  await new Promise((resolve) => setTimeout(resolve, 650));

  const lower = normalized.toLowerCase();

  if (lower.includes('exam') || lower.includes('study') || lower.includes('test')) {
    return [
      'Review core lecture slides and syllabus topics',
      'Summarize key formulas and definitions on one sheet',
      'Solve a timed set of past examination questions',
      'Revisit missed concepts and difficult problems',
      'Do a light final review before getting rest',
    ];
  }

  if (lower.includes('launch') || lower.includes('website') || lower.includes('app')) {
    return [
      'Verify all primary user flows end-to-end',
      'Run production build and fix any warnings',
      'Confirm environment variables and hosting settings',
      'Publish deployment and run post-launch smoke checks',
    ];
  }

  const shortGoal =
    normalized.length > 55 ? `${normalized.slice(0, 52)}...` : normalized;

  return [
    `Define the clear outcome for "${shortGoal}"`,
    'Break the work into a 25-minute starter step',
    'Complete the main deliverable without distractions',
    'Review the result and finalize remaining details',
  ];
}
