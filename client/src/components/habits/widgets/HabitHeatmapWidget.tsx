import React from "react";
import { Card } from "@/components/ui/Card";
import { useHabitAnalytics } from "@/hooks/useHabits";
import { ChevronDown } from "lucide-react";

export function HabitHeatmapWidget() {
  const { analytics, isLoading } = useHabitAnalytics();

  if (isLoading || !analytics) {
    return (
      <Card className="flex flex-col p-5 bg-zinc-950 border-zinc-800/80 animate-pulse h-full">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">
          Habit Activity
        </h2>
        <div className="flex-1 bg-zinc-900/50 rounded-lg"></div>
      </Card>
    );
  }

  // Generate last 30 days for heatmap (approx 4 weeks + a few days)
  const today = new Date();

  // To match the UI closely, we typically want a grid of weeks and days.
  // We'll just generate a flat array of the last 30 days and let it wrap,
  // or build a tiny grid. The image shows a full 12-month style, but we only have 30 days data.
  // The mockup shows "Habit Activity" with dropdown "Last 3 Months".
  // We'll simulate a dense grid.

  const days = Array.from({ length: 90 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (89 - i));
    return d.toLocaleDateString("en-CA");
  });

  return (
    <Card className="flex flex-col p-5 bg-zinc-950 border-zinc-800/80 h-full">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          Habit Activity
        </h2>
        <button className="flex items-center gap-1 text-[10px] text-zinc-400 bg-zinc-900 px-2 py-1 rounded border border-zinc-800 hover:text-white transition-colors">
          Last 3 Months <ChevronDown className="h-3 w-3" />
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-between">
        <div className="flex gap-2 text-[9px] text-zinc-600 mb-2 pl-6">
          <span className="flex-1">May</span>
          <span className="flex-1">Jun</span>
          <span className="flex-1">Jul</span>
          <span className="flex-1">Aug</span>
        </div>

        <div className="flex gap-2">
          {/* Day labels */}
          <div className="flex flex-col justify-between text-[9px] text-zinc-600 font-medium py-1">
            <span>Mon</span>
            <span>Wed</span>
            <span>Fri</span>
            <span>Sun</span>
          </div>

          {/* Heatmap Grid */}
          <div className="flex-1 grid grid-rows-7 grid-flow-col gap-1 overflow-hidden">
            {days.map((day) => {
              const count = analytics.heatmap[day] || 0;
              let bg = "bg-zinc-800/40";
              if (count === 1) bg = "bg-emerald-900/60";
              if (count === 2) bg = "bg-emerald-600/80";
              if (count >= 3) bg = "bg-emerald-400";

              return (
                <div
                  key={day}
                  title={`${day}: ${count} completions`}
                  className={`w-2.5 h-2.5 rounded-[2px] ${bg} transition-colors hover:ring-1 hover:ring-zinc-400 cursor-pointer`}
                />
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 mt-5 text-[9px] text-zinc-500 ml-auto">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-2.5 h-2.5 rounded-[2px] bg-zinc-800/40"></div>
            <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-900/60"></div>
            <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-600/80"></div>
            <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-400"></div>
          </div>
          <span>More</span>
        </div>
      </div>
    </Card>
  );
}
