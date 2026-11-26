import { useEffect, useState, useMemo } from "react";
import { DailyQuestWidget, FocusTimerWidget, NotepadWidget, type Goal } from "./jotai-widgets";
import { IntelligenceRail } from "./intelligence-rail";
import { FocusPlan } from "./focus-plan";
import { useToday } from "@/hooks/useToday";
import { useFocus, TimerState } from "@/contexts/FocusContext";
import { useGoals } from "@/hooks/useGoals";
import { tasksApi, TodaySummary, CalendarEvent, AIInsight, Task, FocusBlock } from "@/lib/api";
import { toast } from "sonner";
import {
  Play,
  Check,
  Target,
  Clock,
  Flame,
  Activity,
  LayoutList,
  Calendar,
  CalendarDays,
  TrendingUp,
  Loader2,
} from "lucide-react";

export function TodayContainer() {
  const {
    summary,
    calendarEvents,
    insights,
    nextAction,
    loading,
    refreshNextAction,
    refreshSummary,
  } = useToday();

  const {
    timerState,
    timeLeft,
    session,
    startSession,
    pauseSession,
    resumeSession,
    finishSession,
    setCurrentTask,
  } = useFocus();

  const {
    goals: rawGoals,
    isLoading: goalsLoading,
    createGoal,
    updateGoal,
    deleteGoal: removeGoal,
  } = useGoals();

  // Map backend Goal model to the local Goal display type used by DailyQuestWidget
  const goals: Goal[] = rawGoals.map((g) => ({
    id: g._id,
    title: g.title,
    detail: g.description || "Goal detail",
    tag: "QUEST",
    complete: g.status === "completed" || g.completed,
  }));

  const toggleGoal = (id: string) => {
    const goal = rawGoals.find((g) => g._id === id);
    if (!goal) return;
    const newStatus = goal.status === "completed" ? "active" : "completed";
    updateGoal.mutate(
      { id, data: { status: newStatus, completed: newStatus === "completed" } },
      {
        onError: () => toast.error("Failed to update goal"),
      },
    );
  };

  const deleteGoal = (id: string) => {
    removeGoal.mutate(id, {
      onError: () => toast.error("Failed to delete goal"),
    });
  };

  const addGoal = () => {
    const title = prompt("Enter quest objective:") || "New quest objective";
    createGoal.mutate(
      { title, description: "Define the next small action", progress: 0 },
      {
        onError: () => toast.error("Failed to create goal"),
      },
    );
  };

  return (
    <TodayPresentational
      loading={loading}
      summary={summary}
      calendarEvents={calendarEvents}
      insights={insights}
      nextAction={nextAction}
      goals={goals}
      timerState={timerState}
      timeLeft={timeLeft}
      session={session}
      onStartFocus={(task?: Task) => {
        if (task) {
          setCurrentTask(task);
        }
        if (timerState === "idle") startSession(25);
        else if (timerState === "paused") resumeSession();
        else if (timerState === "running") pauseSession();
      }}
      onResetFocus={() => finishSession(false)}
      onMarkComplete={async (taskId: string) => {
        try {
          await tasksApi.complete(taskId);
          toast.success("Task completed!");
          await refreshNextAction();
          await refreshSummary();
        } catch (error) {
          console.error(error);
          toast.error("Failed to complete task");
        }
      }}
      onToggleGoal={toggleGoal}
      onDeleteGoal={deleteGoal}
      onAddGoal={addGoal}
    />
  );
}

function getGreeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDuration(seconds: number) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

type TodayPresentationalProps = {
  loading: boolean;
  summary: TodaySummary | null;
  calendarEvents: CalendarEvent[];
  insights: AIInsight | null;
  nextAction: { task: Task | null; reason: string } | null;
  goals: Goal[];
  timerState: TimerState;
  timeLeft: number;
  session: FocusBlock | null;
  onStartFocus: (task?: Task) => void;
  onResetFocus: () => void;
  onMarkComplete: (taskId: string) => void;
  onToggleGoal: (id: string) => void;
  onDeleteGoal: (id: string) => void;
  onAddGoal: () => void;
};

export function TodayPresentational(props: TodayPresentationalProps) {
  const {
    loading,
    summary,
    calendarEvents,
    insights,
    nextAction,
    goals,
    timerState,
    timeLeft,
    session,
    onStartFocus,
    onResetFocus,
    onMarkComplete,
    onToggleGoal,
    onDeleteGoal,
    onAddGoal,
  } = props;

  const now = new Date();
  const greeting = getGreeting(now.getHours());
  const formattedDate = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(now);

  const formatEventTime = (timestamp: number) => {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(timestamp));
  };

  const upcomingEvents = calendarEvents
    .filter((event) => event.start > now.getTime())
    .sort((a, b) => a.start - b.start)
    .slice(0, 4);

  return (
    <div className="flex gap-8 h-full">
      {/* Main Workspace (Execution) */}
      <div className="flex-1 flex flex-col min-w-0 pb-10">
        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {greeting}, Jōtai<span className="text-purple-400">.</span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{formattedDate}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-muted-foreground">All systems operational</span>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* Row 1: Today At a Glance */}
          <div className="col-span-12">
            <div className="flex min-h-[96px] w-full flex-wrap lg:flex-nowrap items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 lg:px-6 shadow-sm backdrop-blur-md">
              <div className="flex flex-col gap-1 w-full lg:w-auto mb-2 lg:mb-0">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Today at a glance
                </span>
              </div>

              <div className="hidden lg:block h-10 w-px bg-zinc-800" />

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-purple-500 text-purple-400">
                  <Target className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-white">
                    {summary ? `${summary.quests.completed} / ${summary.quests.total}` : "- / -"}
                  </span>
                  <span className="text-[10px] text-zinc-500">Quests completed</span>
                </div>
              </div>

              <div className="hidden lg:block h-10 w-px bg-zinc-800" />

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-blue-500 text-blue-400">
                  <Clock className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-white">
                    {summary ? formatDuration(summary.focus.seconds) : "-"}
                  </span>
                  <span className="text-[10px] text-zinc-500">Focus time</span>
                </div>
              </div>

              <div className="hidden lg:block h-10 w-px bg-zinc-800" />

              <div className="flex items-center gap-3">
                <div className="text-amber-500">
                  <Flame className="h-6 w-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-white">{summary?.streak || 0}</span>
                  <span className="text-[10px] text-zinc-500">Day streak</span>
                </div>
              </div>

              <div className="hidden lg:block h-10 w-px bg-zinc-800" />

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-red-500 text-red-500">
                  <Activity className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-white">{summary?.weeklyGoal || 0}%</span>
                  <span className="text-[10px] text-zinc-500">Weekly goal</span>
                </div>
              </div>

              <div className="hidden lg:block h-10 w-px bg-zinc-800" />

              <div className="flex items-center gap-3">
                <div className="text-emerald-500">
                  <LayoutList className="h-6 w-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-white">
                    {summary?.habits.completed || 0}
                  </span>
                  <span className="text-[10px] text-zinc-500">Habits done</span>
                </div>
              </div>

              <div className="hidden lg:block h-10 w-px bg-zinc-800" />

              <div className="flex items-center gap-3">
                <div className="text-red-500">
                  <Calendar className="h-6 w-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-white">
                    {summary?.tasks.dueToday || 0}
                  </span>
                  <span className="text-[10px] text-zinc-500">Due today</span>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Next Action & Focus Mode & Quests */}
          <div className="col-span-12 lg:col-span-5 row-span-2">
            <div className="flex h-full flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-sm backdrop-blur-md">
              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
                </div>
              ) : nextAction?.task ? (
                <>
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-purple-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                          Next Action
                        </span>
                      </div>
                      {nextAction.task.priority === "high" && (
                        <span className="rounded bg-red-500/10 px-2 py-0.5 text-[9px] font-bold text-red-500">
                          High Priority
                        </span>
                      )}
                    </div>

                    <h3 className="mb-1 text-xl font-bold text-white">{nextAction.task.title}</h3>
                    <p className="mb-4 text-xs text-zinc-400">
                      {nextAction.task.dueDate && `Due today • `}
                      {nextAction.task.estimatedMinutes
                        ? `${nextAction.task.estimatedMinutes} min estimated`
                        : ""}
                    </p>

                    <div className="mb-4 flex gap-2">
                      <span className="rounded border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-[10px] text-purple-300">
                        Deep Work
                      </span>
                      {nextAction.task.projectId && (
                        <span className="rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300">
                          {nextAction.task.projectId.name}
                        </span>
                      )}
                    </div>

                    <p className="text-sm leading-relaxed text-zinc-400">{nextAction.reason}</p>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={() => onStartFocus(nextAction.task ? nextAction.task : undefined)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-purple-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-700"
                    >
                      <Play className="h-4 w-4" /> Start Focus
                    </button>
                    <button
                      onClick={() => onMarkComplete(nextAction.task!._id)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 hover:text-emerald-400 hover:border-emerald-500/30"
                    >
                      <Check className="h-4 w-4" /> Mark Complete
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <Check className="h-10 w-10 text-emerald-500 mb-4" />
                  <h3 className="text-lg font-bold text-white mb-2">All Caught Up!</h3>
                  <p className="text-sm text-zinc-400">
                    You've completed all high-priority tasks for today.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="col-span-12 sm:col-span-6 lg:col-span-3 row-span-2">
            <div className="h-full rounded-xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-md shadow-sm overflow-hidden">
              <FocusTimerWidget
                seconds={timeLeft}
                running={timerState === "running"}
                sessions={0} // We can derive this from FocusContext if needed
                onToggle={onStartFocus}
                onReset={onResetFocus}
              />
            </div>
          </div>

          <div className="col-span-12 sm:col-span-6 lg:col-span-4 row-span-2 min-h-[300px]">
            <div className="h-full rounded-xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-md shadow-sm overflow-hidden p-0">
              <DailyQuestWidget
                goals={goals}
                onToggle={onToggleGoal}
                onDelete={onDeleteGoal}
                onAdd={onAddGoal}
              />
            </div>
          </div>

          {/* Row 3: Quick Capture & Up Next & AI Insight */}
          <div className="col-span-12 lg:col-span-4 row-span-1 min-h-[200px]">
            <div className="h-full rounded-xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-md shadow-sm overflow-hidden">
              <NotepadWidget />
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 row-span-1 min-h-[200px]">
            <div className="flex h-full flex-col rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-sm backdrop-blur-md">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-purple-400">
                  <CalendarDays className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                    Up Next
                  </span>
                </div>
                <button className="text-[10px] text-zinc-500 hover:text-zinc-300">
                  View calendar &rarr;
                </button>
              </div>
              <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-2">
                {upcomingEvents.length === 0 && !loading && (
                  <div className="flex items-center justify-center h-full text-sm text-zinc-500">
                    No upcoming events today.
                  </div>
                )}
                {upcomingEvents.map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="w-14 text-[10px] font-medium text-zinc-500 shrink-0">
                      {formatEventTime(item.start)}
                    </span>
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${item.color}`} />
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-xs font-semibold text-zinc-300 truncate">
                        {item.title}
                      </span>
                      <span className="text-[9px] text-zinc-500 truncate">{item.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 row-span-1 min-h-[200px]">
            <div className="flex h-full flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-sm backdrop-blur-md relative overflow-hidden">
              <div className="mb-4 flex items-center gap-2 text-purple-400 relative z-10">
                <TrendingUp className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                  AI Insight
                </span>
                <span className="ml-2 rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] font-bold text-zinc-300">
                  New
                </span>
              </div>
              <div className="relative z-10 flex-1 flex flex-col justify-center">
                {insights ? (
                  <>
                    <p className="text-sm leading-relaxed text-zinc-300 mb-2 font-medium">
                      {insights.headline}
                    </p>
                    <p className="text-xs text-zinc-500">{insights.description}</p>
                  </>
                ) : (
                  <p className="text-sm leading-relaxed text-zinc-300 mb-2">
                    Analyzing your focus data...
                  </p>
                )}
              </div>
              <button className="relative z-10 mt-2 text-left text-[10px] text-purple-400 hover:text-purple-300">
                View all insights &rarr;
              </button>
            </div>
          </div>

          {/* Row 4: Focus Plan */}
          <div className="col-span-12 row-span-1 h-[250px]">
            <FocusPlan onStartFocus={() => onStartFocus()} />
          </div>
        </div>
      </div>

      {/* Right Rail (Intelligence) */}
      <IntelligenceRail />
    </div>
  );
}
