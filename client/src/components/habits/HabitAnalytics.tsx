import React from "react";
import { Card } from "@/components/ui/card";
import { useHabitAnalytics } from "@/hooks/useHabits";
import { Target, TrendingUp, Flame, Calendar as CalendarIcon } from "lucide-react";

export function HabitAnalytics({ fullView = false }: { fullView?: boolean }) {
  const { analytics, isLoading } = useHabitAnalytics();

  if (isLoading || !analytics) {
    return (
      <Card className="flex flex-col gap-4 p-6 min-h-[300px]">
        <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-2">
          Habit Score
        </h2>
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-zinc-800 rounded"></div>
          <div className="h-16 bg-zinc-800 rounded"></div>
        </div>
      </Card>
    );
  }

  // Generate last 30 days for heatmap
  const today = new Date();
  const days = Array.from({ length: 30 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (29 - i));
    return d.toLocaleDateString("en-CA");
  });

  return (
    <div className={`flex flex-col gap-6 ${fullView ? "w-full max-w-4xl mx-auto" : ""}`}>
      <Card className="flex flex-col p-6 min-h-[300px] relative overflow-hidden group">
        {/* Background aesthetics */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-500/20 transition-all duration-700"></div>

        <div className="flex items-center justify-between mb-8 z-10">
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
            <Target className="h-4 w-4" /> Habit Score
          </h2>
          <div className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />+{analytics.scoreTrend}% this week
          </div>
        </div>

        {/* Main Score Display */}
        <div className="flex flex-col items-center justify-center flex-1 z-10 pb-4">
          <div className="text-6xl font-black tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            {analytics.score}
            <span className="text-2xl text-zinc-600 ml-1">/100</span>
          </div>
          <p className="text-sm font-medium text-zinc-400 mt-2">Consistency compounding.</p>
        </div>

        {/* Mini Streak Highlight */}
        <div className="mt-auto z-10 pt-4 border-t border-zinc-800">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">
            Top Streaks
          </h3>
          <div className="flex gap-4">
            {analytics.streaks.slice(0, 3).map((streak) => (
              <div
                key={streak.habitId}
                className="flex-1 flex flex-col items-center bg-zinc-900/50 rounded-lg p-3 border border-zinc-800/50"
              >
                <span className="text-lg mb-1">{streak.icon}</span>
                <div className="text-xs font-bold text-white truncate w-full text-center">
                  {streak.name}
                </div>
                <div className="text-xs font-bold text-orange-400 mt-1 flex items-center gap-1">
                  <Flame className="h-3 w-3 fill-orange-400" /> {streak.currentStreak}d
                </div>
              </div>
            ))}
            {analytics.streaks.length === 0 && (
              <div className="w-full text-center text-xs text-zinc-500 py-2">
                No active streaks. Start building one today!
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Heatmap (only shown in full view or if explicitly desired) */}
      {fullView || analytics ? (
        <Card className="p-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" /> Activity Heatmap (Last 30 Days)
          </h2>

          <div className="flex flex-wrap gap-1.5 mt-2">
            {days.map((day) => {
              const count = analytics.heatmap[day] || 0;
              let bg = "bg-zinc-800/50";
              if (count === 1) bg = "bg-purple-900/40 border-purple-800/50";
              if (count === 2) bg = "bg-purple-700/60 border-purple-600/50";
              if (count >= 3)
                bg = "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)] border-purple-400";

              return (
                <div
                  key={day}
                  title={`${day}: ${count} completions`}
                  className={`w-4 h-4 rounded-[3px] border border-transparent ${bg} transition-colors hover:border-zinc-400 cursor-pointer`}
                />
              );
            })}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
