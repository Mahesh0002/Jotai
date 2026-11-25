import axios from "axios";

// Base API instance
export const api = axios.create({
  baseURL: "http://localhost:5000/api/v1", // Ensure this matches backend port
  headers: {
    "Content-Type": "application/json",
  },
});

export interface Task {
  _id: string;
  title: string;
  description: string;
  status: "not_started" | "in_progress" | "blocked" | "completed";
  priority: "high" | "medium" | "low";
  dueDate?: string;
  estimatedMinutes?: number;
  projectId?: { _id: string; name: string; color: string };
  tags: string[];
  subtasks: { _id: string; title: string; isCompleted: boolean }[];
  isStarred: boolean;
  completedAt?: string;
  xpReward: number;
}

export interface Project {
  _id: string;
  name: string;
  color: string;
  description?: string;
}

export interface Goal {
  _id: string;
  title: string;
  description?: string;
  // Canonical status field
  status: "active" | "completed" | "archived";
  // Legacy boolean kept for backward compat with older consumers
  completed: boolean;
  progress: number;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Distraction {
  timestamp: string;
  category: string;
  duration: number; // in seconds
}

export interface FocusBlock {
  _id: string;
  taskId?: Task;
  title?: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  elapsedSeconds?: number;
  pausedSeconds?: number;
  notes?: string;
  distractions?: Distraction[];
  type: "deep_work" | "study" | "creative" | "admin" | "reading" | "break" | "custom";
  status: "scheduled" | "in_progress" | "completed" | "skipped";
  xpReward: number;
}

export interface Habit {
  _id: string;
  name: string;
  description?: string;
  icon: string;
  category: string;
  frequencyType: "every_day" | "weekdays" | "weekends" | "custom";
  customDays?: number[];
  time?: string;
  targetDurationMinutes?: number;
  xpReward: number;
  status: "active" | "paused" | "archived";
  createdAt: string;
  updatedAt: string;
  // Computed fields
  isCompletedToday?: boolean;
  currentStreak?: number;
}

export interface HabitAnalytics {
  score: number;
  scoreTrend: number;
  streaks: { habitId: string; name: string; icon: string; currentStreak: number }[];
  heatmap: Record<string, number>;
  topHabits: any[];
}

// Tasks API
export const tasksApi = {
  getAll: async (params?: any) => {
    const res = await api.get("/tasks", { params });
    return res.data.data as Task[];
  },
  create: async (data: Partial<Task>) => {
    const res = await api.post("/tasks", data);
    return res.data.data as Task;
  },
  update: async (id: string, data: Partial<Task>) => {
    const res = await api.patch(`/tasks/${id}`, data);
    return res.data.data as Task;
  },
  complete: async (id: string) => {
    const res = await api.post(`/tasks/${id}/complete`);
    return res.data as { success: boolean; xpAwarded: number; data: Task };
  },
  toggleSubtask: async (taskId: string, subtaskId: string, isCompleted: boolean) => {
    const res = await api.patch(`/tasks/${taskId}/subtasks/${subtaskId}`, { isCompleted });
    return res.data.data as Task;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/tasks/${id}`);
    return res.data;
  },
  getNextAction: async () => {
    const res = await api.get("/tasks/next-action");
    return res.data as { success: boolean; data: Task | null; reason: string };
  },
};

// --- Today Interfaces ---
export interface TodaySummary {
  quests: { completed: number; total: number };
  focus: { seconds: number };
  streak: number;
  weeklyGoal: number;
  habits: { completed: number };
  tasks: { dueToday: number };
}

export interface CalendarEvent {
  title: string;
  detail: string;
  start: number;
  color: string;
}

export interface AIInsight {
  type: string;
  headline: string;
  description: string;
  confidence: number;
}

// Today API
export const todayApi = {
  getSummary: async () => {
    const res = await api.get("/today/summary");
    return res.data.data as TodaySummary;
  },
  getCalendarEvents: async () => {
    const res = await api.get("/today/calendar");
    return res.data.data as CalendarEvent[];
  },
  getInsights: async () => {
    const res = await api.get("/today/insights");
    return res.data.data as AIInsight;
  },
};

// Projects API
export const projectsApi = {
  getAll: async () => {
    const res = await api.get("/projects");
    return res.data.data as Project[];
  },
  create: async (data: Partial<Project>) => {
    const res = await api.post("/projects", data);
    return res.data.data as Project;
  },
};

// Goals API
// Note: Goal routes use ApiResponse format ({ statusCode, data, success, message })
// so responses are read via res.data.data
export const goalsApi = {
  getAll: async () => {
    const res = await api.get("/goals");
    return res.data.data as Goal[];
  },
  create: async (data: Partial<Goal>) => {
    const res = await api.post("/goals", data);
    return res.data.data as Goal;
  },
  update: async (id: string, data: Partial<Goal>) => {
    const res = await api.put(`/goals/${id}`, data);
    return res.data.data as Goal;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/goals/${id}`);
    return res.data;
  },
};


// Focus Blocks API
export const focusApi = {
  getAll: async (params?: { start?: string; end?: string }) => {
    const res = await api.get("/focus", { params });
    return res.data.data as FocusBlock[];
  },
  create: async (data: Partial<FocusBlock>) => {
    const res = await api.post("/focus", data);
    return res.data.data as FocusBlock;
  },
  update: async (id: string, data: Partial<FocusBlock>) => {
    const res = await api.patch(`/focus/${id}`, data);
    return res.data.data as FocusBlock;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/focus/${id}`);
    return res.data;
  },
  complete: async (
    id: string,
    payload: {
      completeTask?: boolean;
      elapsedSeconds?: number;
      pausedSeconds?: number;
      distractions?: Distraction[];
      notes?: string;
    } = {},
  ) => {
    const res = await api.post(`/focus/${id}/complete`, payload);
    return res.data as { success: boolean; xpAwarded: number; data: FocusBlock; task: Task | null };
  },
};

// Habits API
export const habitsApi = {
  getAll: async (date?: string, status?: string) => {
    const params: any = {};
    if (date) params.date = date;
    if (status) params.status = status;
    const res = await api.get("/habits", { params });
    return res.data.data as Habit[];
  },
  getAnalytics: async () => {
    const res = await api.get("/habits/analytics");
    return res.data.data as HabitAnalytics;
  },
  create: async (data: Partial<Habit>) => {
    const res = await api.post("/habits", data);
    return res.data.data as Habit;
  },
  update: async (id: string, data: Partial<Habit>) => {
    const res = await api.patch(`/habits/${id}`, data);
    return res.data.data as Habit;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/habits/${id}`);
    return res.data;
  },
  toggleCompletion: async (id: string, date: string, status: "completed" | "incomplete") => {
    const res = await api.post(`/habits/${id}/complete`, { date, status });
    return res.data as { success: boolean; data: any; xpAwarded: number };
  },
  getConsistency: async (params?: { period?: string; startDate?: string; endDate?: string }) => {
    const res = await api.get("/habits/consistency", { params });
    return res.data.data as HabitConsistency[];
  },
};

// --- Notes Interfaces ---
export interface NoteFolder {
  _id: string;
  name: string;
  icon: string;
  color: string;
  createdAt: string;
}

export interface NoteTag {
  _id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface Note {
  _id: string;
  title: string;
  content: string;
  folderId?: NoteFolder | null;
  tagIds: NoteTag[];
  pinned: boolean;
  createdAt: string;
  lastEdited: string;
}

// Notes API
export const notesApi = {
  getAll: async () => {
    const res = await api.get("/notes");
    return res.data.data as Note[];
  },
  create: async (data: Partial<Note>) => {
    const res = await api.post("/notes", data);
    return res.data.data as Note;
  },
  update: async (id: string, data: Partial<Note>) => {
    const res = await api.patch(`/notes/${id}`, data);
    return res.data.data as Note;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/notes/${id}`);
    return res.data;
  },
  // Folders
  getFolders: async () => {
    const res = await api.get("/notes/folders");
    return res.data.data as NoteFolder[];
  },
  createFolder: async (data: Partial<NoteFolder>) => {
    const res = await api.post("/notes/folders", data);
    return res.data.data as NoteFolder;
  },
  deleteFolder: async (id: string) => {
    const res = await api.delete(`/notes/folders/${id}`);
    return res.data;
  },
  // Tags
  getTags: async () => {
    const res = await api.get("/notes/tags");
    return res.data.data as NoteTag[];
  },
  createTag: async (data: Partial<NoteTag>) => {
    const res = await api.post("/notes/tags", data);
    return res.data.data as NoteTag;
  },
  deleteTag: async (id: string) => {
    const res = await api.delete(`/notes/tags/${id}`);
    return res.data;
  },
};

// --- Analytics Interfaces ---
export interface AnalyticsKPIs {
  completionRate: number;
  focusTimeSeconds: number;
  bestStreak: number;
  activeGoals: number;
  totalXp: number;
}

export interface FocusAnalytics {
  deepWork: number;
  projectWork: number;
  meetings: number;
  breaks: number;
  total: number;
  focusByDay: { date: string; day: string; focusSeconds: number }[];
}

export interface TasksAnalytics {
  all: { label: string; completed: number; total: number; percent: number };
  groups: { id: string; label: string; completed: number; total: number; percent: number }[];
}

export interface XpAnalyticsItem {
  date: string;
  day: string;
  xp: number;
}

export interface HabitConsistency {
  id: string;
  name: string;
  streak: number;
  days: boolean[];
}

// Analytics API
export const analyticsApi = {
  getKpis: async (params?: { period?: string; startDate?: string; endDate?: string }) => {
    const res = await api.get("/analytics/kpis", { params });
    return res.data.data as AnalyticsKPIs;
  },
  getFocus: async (params?: { period?: string; startDate?: string; endDate?: string }) => {
    const res = await api.get("/analytics/focus", { params });
    return res.data.data as FocusAnalytics;
  },
  getTasks: async (params?: { period?: string; startDate?: string; endDate?: string }) => {
    const res = await api.get("/analytics/tasks", { params });
    return res.data.data as TasksAnalytics;
  },
  getXp: async (params?: { period?: string; startDate?: string; endDate?: string }) => {
    const res = await api.get("/analytics/xp", { params });
    return res.data.data as XpAnalyticsItem[];
  },
};

// --- Proposals Interfaces (Jötai Runner) ---
export interface Proposal {
  _id: string;
  type: "schedule_proposal" | "habit_insight" | "subtask_suggestion";
  data: any;
  status: "pending" | "accepted" | "rejected";
  flags: string[];
  createdAt: string;
}

// Proposals API
export const proposalsApi = {
  getAll: async (status?: string) => {
    const params: any = {};
    if (status) params.status = status;
    const res = await api.get("/proposals", { params });
    return res.data.data as Proposal[];
  },
  updateStatus: async (id: string, status: "pending" | "accepted" | "rejected") => {
    const res = await api.patch(`/proposals/${id}/status`, { status });
    return res.data.data as Proposal;
  }
};
