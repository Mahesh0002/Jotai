# Jōtai Core

Context: I am redesigning the frontend of my gamified productivity dashboard called "Jōtai" (based on UI screenshots featuring a cyberpunk/dark mode theme). The application has multiple interrelated widgets (Daily Quests, Focus Timer, Player Stats, Habits, News/Market/Weather feeds, Analytics, Integrations).

Goal: Act as an Expert UI/UX Engineer and Senior React Developer. Build a sleek, highly usable, pitch-dark frontend using React and Tailwind CSS. I will handle all backend logic, database connections, and global state management.

CRITICAL ARCHITECTURE RULES:

1. Pitch Dark Theme & Visual Polish:

- Do NOT use light mode or grayish-white themes. Use a deep, pitch-dark aesthetic (Application background: `bg-zinc-950` / `#09090b`).

- Widget Containers: Dark semi-transparent surfaces (`bg-zinc-900/90` or `bg-black/80` with `backdrop-blur-md`).

- Borders & Depth: Fine, glowing dark borders (`border border-zinc-800 hover:border-zinc-700 transition-colors`). Avoid harsh white borders.

- Neon Accents: Use subtle neon highlights sparingly for key actions, progress bars, and status indicators (Primary: Cyber Purple `text-purple-400` / `bg-purple-500`, Secondary: Cyber Yellow `text-yellow-400`, Success: Emerald `text-emerald-400`, Alert: Coral Crimson `text-red-400`).

2. Dynamic Drag, Drop & Resizing:

- Implement a flexible grid system (e.g., using `react-grid-layout` or a modular grid component).

- Widgets must support drag-and-drop reordering via a top drag handle on each card.

- Widgets must be resizable from the bottom-right corner (spanning columns/rows dynamically).

- Layout state (`x, y, w, h`) must be controlled at the parent layout level.

3. Complete Typography Overhaul:

- Completely drop the old pixelated/blocky fonts across the entire app.

- Use 'Inter' or 'Geist' via Google Fonts for all standard UI labels, headers, and text.

- Use 'Space Mono' or 'Fira Code' strictly for timers, numbers, percentages, and metrics.

- Apply `tabular-nums` and `tracking-tight` to all numerical text so data aligns vertically without jittering.

4. Component Fragility & Separation of Concerns:

- All widgets MUST be built as strictly "Dumb" (Presentational) components.

- Widgets must ONLY receive data and handler functions through props (e.g., `data`, `onToggle`, `onDelete`, `onUpdate`).

- Do NOT hardcode global state management hooks (e.g., Zustand, Redux) directly inside individual widget files.

- Mock all data and state handlers at the top-level parent component (`DashboardLayout`) and pass them down as props.

5. Widget Inventory to Build:

Create presentational components for the following dashboard sections:

- Header Navigation Bar: Logo, tab links (Dashboard, News & Insights, Health & Productivity, Daily Quests, Progress Overview), quick stats badge.

- Player Profile Banner: Level indicator, XP progress bar (`2,847/3,000 XP`), daily streak counter (`12 days`).

- Daily Quest Widget: Actionable checklist with task titles, subtext, status checkboxes, and action buttons.

- Player Stats Widget: Vertical progress bars for Focus Time, Calories Burnt, Steps, and Quests completed.

- Focus Mode Timer: Large circular countdown display (e.g., `25:00`), play/pause/reset buttons, session counters.

- Habit Tracker Widget: Daily/weekly habits with progress bars and quick check-ins.

- Data Feed Widgets: News Dispatch (article card with image preview), Market Watch (ticker symbols), Weather Radar.

- Analytics Center Component: Tabbed metric overview cards (Completion rate, Active streak, Active goals, Focus time) with chart placeholder space.

- Integrations Modal UI: Grid of service cards (Google Calendar, Notion, Spotify, GitHub, Trello) with "Connect" buttons.

Output Requirements:

1. Provide the main `DashboardLayout` component managing the grid state and top-level mock data.

2. Provide modular presentational components for the core widgets (`UserProfileWidget`, `DailyQuestWidget`, `FocusTimerWidget`, `StatsWidget`).

3. Ensure every widget container includes smooth inner scrollbars (`overflow-y-auto`) so content renders cleanly regardless of resized dimensions.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ba3f0dfc-2c48-4921-b1df-f7c7839dd017).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
