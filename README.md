# Jötai: The Operating System for Focus

Jötai is a comprehensive, gamified execution engine and productivity operating system. It moves beyond the concept of a "dashboard" or a collection of static widgets, providing a rigorously engineered, deeply integrated pipeline that bridges the gap between intention and action.

The system is built on a single continuous data flow:
**Execute → Understand → Analyze → Improve**

Every visible control in Jötai maps to a defined backend action. There are no fabricated dashboard statistics. If the system says you have a 12-day streak or a 94% task completion rate, it is mathematically derived from immutable database records.

---

## 🧠 Core Philosophy & Architecture

The fundamental principle of Jötai is that productivity tools should not distract you. The UI is designed to be visually stunning (Cyberpunk/Neumorphic aesthetic) but operationally invisible during execution. 

### The Execution Pipeline
Data in Jötai flows automatically from planning to execution to analytics:
1. **Tasks** are defined, prioritized, and estimated.
2. Tasks are assigned to **Focus Blocks** within the **Focus Plan**.
3. Focus Blocks are executed in the **Focus Workspace** (a distraction-free zone).
4. Execution data (time spent, completion status, distractions) is saved immutably.
5. This data feeds the **Insights** engine and awards XP in the **Progress** engine.
6. The **Jötai Runner (AI)** analyzes this historical data to optimize tomorrow's Focus Plan.

---

## ⚙️ The 8 Core Modules (System Specification)

### 1. Tasks (The Execution Hub)
The central repository for actionable items.
- **Hierarchical Structure**: Supports Projects, Tasks, and Subtasks.
- **Workflow**: Tasks contain metadata (priority, estimated duration, due dates).
- **Interactivity**: Keyboard-driven workflows (`N` to create, `Esc` to close) with instantaneous optimistic UI updates via React Query.

### 2. Focus Plan (The Timeline)
The bridge between theoretical tasks and concrete execution.
- **Function**: Translates the daily task list into an executable timeline (e.g., 8:00 AM to 8:00 PM).
- **Mechanics**: Supports drag-and-drop scheduling, resizing duration, and resolving overlaps.
- **State Awareness**: Includes a live "Now" indicator. Future dates show schedules; past dates show immutable completion records.

### 3. Focus Workspace (The Execution Vessel)
The environment where actual work happens.
- **Distraction-Free Design**: Enforces the visual hierarchy of *Task > Timer > Waveform*. All navigation can be stripped away in true Focus Mode.
- **Zero-Drift Timers**: Timers calculate `targetEndTime - Date.now()`. They do not rely on brittle browser `setInterval` decrements, allowing them to survive background throttling, computer sleep, or browser crashes.
- **Web Audio Integration**: Features a live synthetic/audio-reactive waveform that visually grounds the timer, making it feel alive without being distracting.
- **Decoupled Completion**: Finishing a timer does *not* automatically complete a task. The system explicitly asks for the task outcome to maintain data integrity.

### 4. Habits (The Momentum Engine)
A rigorous system for tracking recurring behaviors that aren't single-execution tasks.
- **Data Integrity**: Separates the Habit *Definition* (schedule, XP reward) from the Habit *Completion* (an immutable time-stamped log). Editing a habit's schedule today does not corrupt last month's streak data.
- **Analytics**: Calculates a dynamic "Habit Score" based on consistency, streak stability, and schedule adherence.
- **Impact Correlation**: Analyzes the relationship between habits and deep work (e.g., "Days with Morning Planning result in 24% higher task completion").
- **UI/UX**: Lightning-fast optimistic toggles (`<100ms`) with satisfying micro-animations (`+10 XP` float) to reinforce positive psychological loops.

### 5. Calendar (The Macroscopic View) *[In Development]*
- **Function**: Deep integration with the Focus Plan to view long-term timelines, upcoming project deadlines, and historical execution heatmaps.

### 6. Insights (The Analytics Engine) *[In Development]*
- **Function**: A deep analytics dashboard that digests Focus Data, Habit Trends, and Task completion rates.
- **Goal**: To answer "When am I most productive?" and "What habits actually improve my output?" rather than just showing arbitrary graphs.

### 7. Progress (The RPG Gamification Engine) *[In Development]*
- **Function**: Converts consistency into tangible momentum.
- **Mechanics**: Earned XP from completing tasks, habits, and focus blocks feeds into levels and skill trees. Specific focus types (e.g., "Deep Work", "Creative", "Study") act as RPG proficiencies that level up dynamically.

### 8. Notes & Inventory *[In Development]*
- **Function**: A robust markdown-based knowledge base directly tied to tasks and projects. Session notes taken during a Focus Block are automatically appended to the respective Task history.

---

## 🤖 The Jötai Runner (AI Coach)
Jötai features an integrated AI assistant that goes beyond conversational chatbots.
- **Context-Aware Recommendations**: By reading the Insights engine, the AI can propose concrete schedule changes (e.g., "You have a deep work block at 2 PM, but historical data shows your focus drops by 40% after lunch. Move to 10 AM?").
- **Non-Destructive Conflict Resolution**: When auto-planning, the AI generates a proposal layer over the Focus Plan. It never silently overwrites the user's explicit schedule without review.

---

## 💻 Technical Architecture

Jötai is engineered as a modern, high-performance web application.

- **Frontend**: React.js, TailwindCSS (strict custom Design System tokens), React Query (for optimistic caching and state synchronization), Web Audio API, Lucide Icons.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB / Mongoose.
- **Animation Philosophy**: "Fast, deliberate, controlled." Micro-interactions resolve in 100-150ms. Standard transitions take 150-250ms. Complex task movements take 250-350ms. No lingering or overly bouncy animations.

---

## 📊 Project Status & Roadmap

### ✅ Completed & Engineered
The backend APIs, MongoDB schemas, and frontend UI/UX logic for the following systems are fully implemented and in production-ready state:
1. **Tasks Module** (Hierarchical CRUD, React Query integration)
2. **Focus Plan** (Timeline generation, Block Modal, Real-time rendering)
3. **Focus Workspace** (Absolute timers, Waveform rendering, Distraction logging)
4. **Habits Engine** (Split Schema data integrity, Optimistic UX toggling, Score/Streak calculations)

### 🚧 Current Development (Next Up)
1. **Calendar Module**: Expanding the Focus Plan into a macroscopic monthly/weekly view.
2. **Insights Module**: Building the visual charts and correlation algorithms to power Habit Impact and Focus Quality metrics.
3. **Progress Module**: Implementing the XP accumulation algorithms and the RPG leveling system.

### 🔮 Future Scope
- **Offline-First Resilience**: Implementing Service Workers and local indexedDB caching so the Focus Workspace functions flawlessly on an airplane, syncing session data automatically upon reconnection.
- **External Integrations**: Native sync with GitHub (for developer tasks), Google Calendar, and Spotify (for Focus Workspace audio).
- **Mobile PWA**: Ensuring the UI scales perfectly to mobile devices for on-the-go Habit tracking and Task capture.
