import {
  Flame,
  ArrowRight,
  HeartPulse,
  Settings,
  BrainCircuit,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button"; // ensure casing matches your Button component
import { useHabitAnalytics, useHabits } from "@/hooks/useHabits";
import { useMemo } from "react";

export function HabitsSidebar() {
  const { analytics, isLoading: analyticsLoading } = useHabitAnalytics();
  const { habits, isLoading: habitsLoading } = useHabits(new Date().toLocaleDateString("en-CA"));

  // Compute categories dynamically
  const categories = useMemo(() => {
    if (!habits) return [];
    const catMap = new Map<string, number>();
    habits.forEach((h) => {
      catMap.set(h.category, (catMap.get(h.category) || 0) + 1);
    });

    const iconMap: Record<string, any> = {
      Health: HeartPulse,
      Learning: BookOpen,
      Productivity: Settings,
      Mindset: BrainCircuit,
    };

    const colorMap: Record<string, string> = {
      Health: "text-emerald-500",
      Learning: "text-blue-400",
      Productivity: "text-purple-400",
      Mindset: "text-amber-500",
    };

    return Array.from(catMap.entries()).map(([name, count]) => ({
      name,
      count,
      icon: iconMap[name] || Settings,
      color: colorMap[name] || "text-zinc-400",
    }));
  }, [habits]);

  const upcoming = habits?.filter((h) => !h.isCompletedToday).slice(0, 3) || [];

  if (analyticsLoading || habitsLoading) {
    return (
      <div className="flex w-[320px] shrink-0 flex-col gap-6 p-6 border-l border-zinc-800/50 bg-zinc-950/50 animate-pulse">
        <div className="h-32 bg-zinc-900/50 rounded-xl"></div>
        <div className="h-48 bg-zinc-900/50 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="flex w-[320px] shrink-0 flex-col gap-6 overflow-y-auto custom-scrollbar p-6 border-l border-zinc-800/50 bg-zinc-950/50">
      {/* CURRENT STREAKS */}
      <div className="flex flex-col rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-5">
        <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-5">
          Current Streaks
        </h2>

        <div className="flex flex-col gap-4">
          {analytics?.streaks.slice(0, 5).map((s, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg">{s.icon}</span>
                <span className="text-[11px] font-medium text-zinc-300">{s.name}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-300">
                <Flame className="h-3 w-3 text-amber-500 fill-amber-500" />
                {s.currentStreak} days
              </div>
            </div>
          ))}
          {(!analytics?.streaks || analytics.streaks.length === 0) && (
            <span className="text-xs text-zinc-500">No active streaks.</span>
          )}
        </div>

        <button className="flex items-center text-[10px] text-purple-400 hover:text-purple-300 mt-5 pt-4 border-t border-zinc-800/50 transition-colors">
          View all streaks <ArrowRight className="ml-1 h-3 w-3" />
        </button>
      </div>

      {/* UPCOMING HABITS */}
      <div className="flex flex-col rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-5">
        <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-5">
          Upcoming Habits
        </h2>

        <div className="flex flex-col gap-5">
          {upcoming.map((u, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-zinc-800/50 border border-zinc-700 text-sm">
                {u.icon}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-bold text-zinc-200">{u.name}</span>
                <span className="text-[9px] text-zinc-500">{u.time || "Any time"}</span>
              </div>
            </div>
          ))}
          {upcoming.length === 0 && (
            <span className="text-xs text-zinc-500">All caught up for today!</span>
          )}
        </div>

        <button className="flex items-center text-[10px] text-purple-400 hover:text-purple-300 mt-5 pt-4 border-t border-zinc-800/50 transition-colors">
          View full schedule <ArrowRight className="ml-1 h-3 w-3" />
        </button>
      </div>

      {/* CATEGORIES */}
      <div className="flex flex-col rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-5">
        <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-5">
          Categories
        </h2>

        <div className="flex flex-col gap-4">
          {categories.map((c, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <c.icon className={`h-4 w-4 ${c.color}`} />
                <span className="text-[11px] font-medium text-zinc-300">{c.name}</span>
              </div>
              <span className="text-[10px] text-zinc-500">
                {c.count} {c.count === 1 ? "habit" : "habits"}
              </span>
            </div>
          ))}
          {categories.length === 0 && (
            <span className="text-xs text-zinc-500">No categories found.</span>
          )}
        </div>

        <button className="flex items-center text-[10px] text-purple-400 hover:text-purple-300 mt-5 pt-4 border-t border-zinc-800/50 transition-colors">
          Manage Categories <ArrowRight className="ml-1 h-3 w-3" />
        </button>
      </div>

      {/* AI HABIT COACH */}
      <div className="flex flex-col rounded-xl border border-purple-500/30 bg-purple-900/10 p-5 shadow-[0_0_15px_rgba(168,85,247,0.05)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 bg-purple-500 h-full shadow-[0_0_10px_rgba(168,85,247,0.8)]" />

        <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-4 ml-1">
          AI Habit Coach
        </h2>

        <div className="flex gap-3 mb-6 ml-1">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-purple-500/20 text-purple-400">
            <Sparkles className="h-3 w-3" />
          </div>
          <p className="text-[11px] leading-relaxed text-zinc-300">
            You are <span className="font-bold text-white">24% more productive</span> on days you
            complete Morning Planning before 9:30 AM.
            <br />
            <br />
            Keep it up! This habit has a huge impact on your task completion.
          </p>
        </div>

        <div className="flex flex-col gap-2 w-full pl-1">
          <Button className="w-full h-8 bg-purple-600 text-[10px] font-medium hover:bg-purple-500 text-white shadow-glow">
            View Analysis
          </Button>
          <Button
            variant="ghost"
            className="w-full h-8 text-[10px] font-medium text-purple-400 hover:text-purple-300 hover:bg-transparent"
          >
            Apply to Focus Plan
          </Button>
        </div>
      </div>
    </div>
  );
}
