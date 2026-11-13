import React from "react";
import { Card } from "@/components/ui/Card";
import { useHabitAnalytics } from "@/hooks/useHabits";
import { ArrowRight } from "lucide-react";

export function TopHabitsWidget() {
  const { analytics, isLoading } = useHabitAnalytics();

  if (isLoading || !analytics) {
    return (
      <Card className="flex flex-col p-5 bg-zinc-950 border-zinc-800/80 animate-pulse h-full">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">
          Top Habits
        </h2>
      </Card>
    );
  }

  // The backend already returns `topHabits` in the analytics payload with a mock completionRate
  const topHabits = analytics.topHabits || [];

  return (
    <Card className="flex flex-col p-5 bg-zinc-950 border-zinc-800/80 h-full relative">
      <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-5">
        Top Habits
      </h2>

      <div className="flex flex-col gap-4 flex-1">
        {topHabits.map((habit: any) => (
          <div key={habit.habitId} className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs font-bold text-white">
              <span>{habit.name}</span>
              <span>{habit.completionRate}%</span>
            </div>
            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${habit.completionRate}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <button className="flex items-center text-[10px] text-purple-400 hover:text-purple-300 mt-4 pt-4 border-t border-zinc-800/50 transition-colors w-max">
        View all habits <ArrowRight className="ml-1 h-3 w-3" />
      </button>
    </Card>
  );
}
