import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateTasksForGoal, getAiProviderStatus } from './src/server/aiService.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    const aiStatus = getAiProviderStatus();
    res.json({
      status: 'ok',
      provider: aiStatus.provider,
      aiConfigured: aiStatus.configured,
    });
  });

  app.get('/api/ai/status', (_req, res) => {
    res.json(getAiProviderStatus());
  });

  app.post('/api/ai/generate-tasks', async (req, res) => {
    try {
      const { goal, count, forceDemo } = (req.body ?? {}) as {
        goal?: unknown;
        count?: unknown;
        forceDemo?: unknown;
      };

      if (typeof goal !== 'string' || !goal.trim()) {
        res.status(400).json({
          error: 'Please describe what you want to accomplish before generating tasks.',
        });
        return;
      }

      const result = await generateTasksForGoal(
        goal,
        typeof count === 'number' ? count : 5,
        forceDemo === true
      );

      res.json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate tasks.';
      const lower = message.toLowerCase();
      const statusCode =
        lower.includes('api_key_invalid') || lower.includes('400')
          ? 400
          : lower.includes('permission_denied') || lower.includes('403')
            ? 403
            : lower.includes('resource_exhausted') || lower.includes('429')
              ? 429
              : lower.includes('unavailable') || lower.includes('high demand') || lower.includes('503')
                ? 503
                : 500;

      res.status(statusCode).json({ error: message });
    }
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distDir, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TaskMate AI server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start TaskMate AI server:', err);
  process.exit(1);
});
