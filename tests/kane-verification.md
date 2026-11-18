# Kane CLI Browser Verification Plan

TaskMate AI includes stable `data-testid` attributes and semantic ARIA roles for deterministic real-browser end-to-end verification using **Kane CLI**.

## Stable Test Selectors

| Control / Element | `data-testid` | Purpose |
| --- | --- | --- |
| Manual task title input | `task-input` | Quick-add task input field |
| Manual add task submit | `add-task-button` | Submits quick-add task |
| Task row item | `task-item` | Each rendered task in the list (`data-completed="true\|false"`) |
| Task completion checkbox | `task-checkbox` | Toggles active / completed state (`aria-checked`) |
| Task edit button | `edit-task-button` | Opens edit modal for that task |
| Task edit modal title input | `edit-task-title-input` | Modifies task title in edit modal |
| Task edit modal description input | `edit-task-description-input` | Modifies task description in edit modal |
| Task modal save button | `save-task-button` | Saves changes in edit/new modal |
| Task delete button | `delete-task-button` | Deletes that individual task |
| Filter: All | `task-filter-all` | Shows all tasks |
| Filter: Active | `task-filter-active` | Shows active tasks only |
| Filter: Completed | `task-filter-completed` | Shows completed tasks only |
| Search input | `task-search-input` | Searches task titles and descriptions |
| Clear Completed button | `clear-completed-button` | Opens confirmation dialog for clearing completed tasks |
| Confirm dialog action button | `confirm-dialog-confirm` | Confirms destructive bulk action |
| AI goal textarea | `ai-goal-input` | Natural-language goal input |
| Generate Tasks button | `generate-tasks-button` | Calls `/api/ai/generate-tasks` |
| Generated task preview row | `generated-task-item` | Suggested task before approval |
| Remove generated task button | `remove-generated-task-button` | Removes an individual suggestion before adding |
| Add All Tasks button | `add-all-generated-button` | Persists approved AI tasks to list |
| Productivity stat counters | `stat-total-tasks`, `stat-active-tasks`, `stat-completed-tasks` | Live task statistics |

---

## End-to-End Verification Scenarios

### TEST 1: Manual Task Creation
1. Open `http://localhost:3000`.
2. Fill `[data-testid="task-input"]` with `"Submit project proposal"`.
3. Click `[data-testid="add-task-button"]`.
4. Assert `[data-testid="task-item"]` contains `"Submit project proposal"` and `[data-testid="stat-total-tasks"]` increments.

### TEST 2: Task Editing
1. Locate the task row `"Submit project proposal"`.
2. Click `[data-testid="edit-task-button"]` inside that row.
3. Replace `[data-testid="edit-task-title-input"]` with `"Submit final project proposal"`.
4. Click `[data-testid="save-task-button"]`.
5. Assert `"Submit final project proposal"` is visible in `[data-testid="task-item"]`.

### TEST 3: Task Completion
1. Click `[data-testid="task-checkbox"]` on `"Submit final project proposal"`.
2. Assert `aria-checked="true"` and `[data-testid="stat-completed-tasks"]` reflects `1`.

### TEST 4: Filtering
1. Add a second active task `"Review team feedback"`.
2. Click `[data-testid="task-filter-active"]` -> Assert `"Review team feedback"` is visible and `"Submit final project proposal"` is hidden.
3. Click `[data-testid="task-filter-completed"]` -> Assert `"Submit final project proposal"` is visible and `"Review team feedback"` is hidden.
4. Click `[data-testid="task-filter-all"]` -> Assert both tasks are visible.

### TEST 5: AI Task Generation
1. Fill `[data-testid="ai-goal-input"]` with `"Help me prepare for my university examination tomorrow."`.
2. Click `[data-testid="generate-tasks-button"]`.
3. Wait for `[data-testid="generated-task-item"]` (expect 3–5 tasks).
4. Optionally remove one generated item with `[data-testid="remove-generated-task-button"]`.
5. Click `[data-testid="add-all-generated-button"]`.
6. Assert the approved tasks now appear in `[data-testid="task-item"]`.

### TEST 6: Persistence
1. Reload the browser page (`page.reload()`).
2. Assert previously created, edited, completed, and AI-added tasks remain rendered with their exact state.

### TEST 7: Clear Completed
1. Click `[data-testid="clear-completed-button"]`.
2. Click `[data-testid="confirm-dialog-confirm"]`.
3. Assert completed tasks are removed while active tasks remain in `[data-testid="task-item"]`.

### TEST 8: Task Deletion
1. Click `[data-testid="delete-task-button"]` on an individual task row.
2. Assert that task disappears from the DOM and remains deleted after page reload.

## Running with Kane CLI

Start the application server:

```bash
npm run dev
```

Execute Kane CLI against `http://localhost:3000`:

```bash
kane run --url http://localhost:3000 --plan tests/kane-verification.md
```
