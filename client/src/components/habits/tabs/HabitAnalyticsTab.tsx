import { Target, TrendingUp, Flame, Calendar as CalendarIcon, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useHabitAnalytics } from "@/hooks/useHabits";

function isoDay(date: Date) {
  return date.toLocaleDateString("en-CA");
}

export function HabitAnalyticsTab() {
  const { analytics, isLoading } = useHabitAnalytics();

  if (isLoading || !analytics) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#0e0e11] text-xs text-zinc-500">
        Loading local habit analytics…
      </div>
    );
  }

  const days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return isoDay(date);
  });
  const streak = analytics.streaks ?? [];
  const topHabits = analytics.topHabits ?? [];

  return (
    <div className="flex flex-1 overflow-x-hidden bg-[#0e0e11]">
      <div className="mx-auto w-full max-w-6xl flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="mb-6 flex justify-end">
          <span className="rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-xs font-bold text-zinc-300">
            Last 30 days
          </span>
        </div>

        <div className="mb-6 flex flex-col gap-4 rounded-xl border border-purple-500/30 bg-gradient-to-r from-[#1c122e]/80 to-[#120a1f]/80 p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/20 text-purple-400">
              <Sparkles className="size-6" />
            </div>
            <div>
              <h2 className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-purple-300">
                <Target className="size-3" /> Local insight
              </h2>
              <p className="text-sm text-white">
                Your consistency score is{" "}
                <span className="font-bold text-purple-400">{analytics.score}/100</span>.
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                Calculated from your own habit completions on this device.
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent("open-ai-assistant", {
                  detail: "What do my habit patterns say about my productivity?",
                }),
              )
            }
            className="w-max rounded-lg border border-purple-500/30 bg-purple-600/20 px-5 py-2.5 text-xs font-bold text-purple-200 transition-colors hover:bg-purple-600/40"
          >
            Ask the assistant
          </button>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card className="flex flex-col p-5">
            <span className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Completion score
            </span>
            <div className="mb-2 text-3xl font-bold text-white">{analytics.score}/100</div>
            <div className="mb-4 flex items-center gap-1 text-[10px] font-medium text-emerald-500">
              <TrendingUp className="size-3" /> {analytics.scoreTrend >= 0 ? "+" : ""}
              {analytics.scoreTrend}% trend
            </div>
          </Card>
          <Card className="flex flex-col p-5">
            <span className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Active streaks
            </span>
            <div className="text-3xl font-bold text-white">{streak.length}</div>
            <div className="mb-4 mt-1 text-[10px] text-zinc-600">
              {streak.length > 0
                ? `Longest: ${Math.max(...streak.map((s) => s.currentStreak))} days`
                : "No active streaks yet"}
            </div>
          </Card>
        </div>

        <Card className="mb-6 p-6">
          <h3 className="mb-6 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-500">
            <Flame className="size-4" /> Top streaks
          </h3>
          <div className="flex flex-wrap gap-4">
            {streak.slice(0, 6).map((item) => (
              <div
                key={item.habitId}
                className="flex min-w-24 flex-1 flex-col items-center rounded-lg border border-zinc-800/50 bg-zinc-900/50 p-3"
              >
                <span className="mb-1 text-lg">{item.icon}</span>
                <span className="w-full truncate text-center text-xs font-bold text-white">
                  {item.name}
                </span>
                <span className="mt-1 flex items-center gap-1 text-xs font-bold text-orange-400">
                  <Flame className="size-3 fill-orange-400" /> {item.currentStreak}d
                </span>
              </div>
            ))}
            {streak.length === 0 && (
              <p className="w-full text-center text-xs text-zinc-500">
                Complete a habit to start a streak.
              </p>
            )}
          </div>
        </Card>

        <Card className="mb-6 p-6">
          <h3 className="mb-6 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-500">
            <CalendarIcon className="size-4" /> Activity heatmap (last 30 days)
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {days.map((day) => {
              const count = analytics.heatmap?.[day] ?? 0;
              const bg =
                count >= 3
                  ? "border-purple-400 bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                  : count === 2
                    ? "border-purple-600/50 bg-purple-700/60"
                    : count === 1
                      ? "border-purple-800/50 bg-purple-900/40"
                      : "border-transparent bg-zinc-800/50";
              return (
                <div
                  key={day}
                  title={`${day}: ${count} completions`}
                  className={`size-4 rounded-[3px] border ${bg}`}
                />
              );
            })}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="mb-6 text-sm font-bold uppercase tracking-widest text-zinc-500">
            Strongest habits
          </h3>
          <div className="flex flex-col gap-4">
            {topHabits.map((habit: any) => (
              <div key={habit.habitId} className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-bold text-white">
                  <span>{habit.name}</span>
                  <span>{habit.completionRate ?? habit.score ?? 0}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${habit.completionRate ?? habit.score ?? 0}%` }}
                  />
                </div>
              </div>
            ))}
            {topHabits.length === 0 && (
              <p className="text-xs text-zinc-500">No habit history recorded yet.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
