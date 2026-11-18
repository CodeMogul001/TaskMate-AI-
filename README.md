# TaskMate AI

TaskMate AI is an intelligent personal productivity application that turns natural-language goals into 3–5 structured, actionable tasks and lets you manage them in a clean, Linear/Notion-inspired workspace.

## Features

- **AI Task Generator**: Describe any goal (e.g., *"Help me prepare for my university examination tomorrow."*), generate 3–5 concise, realistic tasks, prune or review them before approval, and add them to your list.
- **Full Task Management (CRUD)**: Quick-add tasks inline or via modal, edit titles and descriptions, mark tasks completed or active, and delete individual tasks.
- **Live Filtering & Search**: Filter by **All**, **Active**, or **Completed**, search across titles and descriptions in real time, and clear completed tasks with confirmation.
- **Automatic Productivity Overview**: Real-time counters for Total Tasks, Active Tasks, Completed Tasks, and completion percentage.
- **Persistent Storage**: Clean repository abstraction supporting browser `localStorage` out of the box and optional Supabase PostgreSQL REST persistence when configured.
- **Import / Export & Preferences**: Export or import tasks as JSON, configure AI task count (3–5), and customize default filters.
- **Kane CLI Ready**: Deterministic `data-testid` attributes and accessible ARIA roles across all interactive controls.

## Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React
- **Backend**: Node.js + Express (`server.ts`) with Vite middleware in development
- **AI Integration**: Server-side `@google/genai` SDK (`gemini-4-hydrogen` with structured JSON schema), optional `OPENAI_API_KEY` support, and clearly separated offline demo planner when no API key is configured
- **Persistence**: `TaskRepository` abstraction (`LocalStorageTaskRepository` + `SupabaseTaskRepository`)
- **Testing**: Kane CLI verification plan (`tests/kane-verification.md`)

## Project Structure

```text
├── server.ts                         # Express API & Vite dev/prod server
├── src/
│   ├── App.tsx                       # Main workspace layout & orchestration
│   ├── components/                   # Modular UI components
│   │   ├── AiTaskGenerator.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── DashboardHeader.tsx
│   │   ├── ProductivityOverview.tsx
│   │   ├── SettingsView.tsx
│   │   ├── Sidebar.tsx
│   │   ├── TaskListSection.tsx
│   │   └── TaskModal.tsx
│   ├── hooks/                        # State & persistence hooks
│   │   ├── useSettings.ts
│   │   └── useTasks.ts
│   ├── lib/
│   │   ├── ai/taskGeneratorClient.ts # Client API wrapper
│   │   ├── storage/taskRepository.ts # LocalStorage & Supabase adapters
│   │   └── validation/taskValidation.ts
│   ├── server/
│   │   └── aiService.ts              # Server-side AI planning & schema validation
│   └── types/
│       └── task.ts                   # Shared TypeScript interfaces
├── tests/
│   └── kane-verification.md          # End-to-end Kane CLI verification plan
├── .env.example
└── vercel.json
```

## Installation

```bash
npm install
```

## Environment Variables

Copy `.env.example` to `.env` (never commit real secrets):

```env
# Primary server-side Gemini AI key
GEMINI_API_KEY="your_gemini_api_key"

# Optional alternative OpenAI key (used if GEMINI_API_KEY is not set)
# OPENAI_API_KEY="your_openai_api_key"

# Optional Supabase REST persistence (uses localStorage when omitted)
# VITE_SUPABASE_URL="https://your-project.supabase.co"
# VITE_SUPABASE_ANON_KEY="your-anon-key"
```

If neither `GEMINI_API_KEY` nor `OPENAI_API_KEY` is configured, TaskMate AI automatically uses a clearly labeled offline demo planner so the UI and testing workflows remain functional.

## Development & Build Commands

```bash
# Start full-stack dev server on http://localhost:3000
npm run dev

# Type-check TypeScript
npm run lint

# Build production frontend bundle
npm run build

# Run production server
NODE_ENV=production npm start
```

## AI Integration Details

All AI requests are handled server-side in `POST /api/ai/generate-tasks` (`src/server/aiService.ts`):

1. Validates the incoming natural-language goal.
2. Uses `@google/genai` (`gemini-4-hydrogen`) with `responseMimeType: "application/json"` and an explicit `responseSchema` enforcing `{ tasks: [{ title, description }] }`.
3. Sanitizes, deduplicates, and validates the generated tasks (`validateAiTasksPayload`) before sending them to the browser.
4. Generated tasks are held in a reviewable preview state and persisted only after explicit user approval.

## Kane CLI Verification

See [`tests/kane-verification.md`](tests/kane-verification.md) for the full 8-scenario test plan and selector reference.

```bash
kane run --url http://localhost:3000 --plan tests/kane-verification.md
```

## Deployment (Vercel / Node)

1. Connect the repository to Vercel or any Node 22+ host.
2. Set `GEMINI_API_KEY` (or `OPENAI_API_KEY`) in your project environment variables.
3. Build command: `npm run build`.
4. Start command for Node servers: `NODE_ENV=production npm start`.
