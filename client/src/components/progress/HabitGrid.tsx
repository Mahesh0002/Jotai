import { Info, Flame, ChevronDown } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { habitsApi, HabitConsistency } from "@/lib/api";
import { Period } from "@/routes/progress";
import { format, subDays } from "date-fns";

export function HabitGrid({ period }: { period: Period }) {
  const [data, setData] = useState<HabitConsistency[]>([]);
  const [localPeriod, setLocalPeriod] = useState<"week" | "month">("week");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If global period is 'month' or 'year', use month view for the grid
    if (period === "month" || period === "year") {
      setLocalPeriod("month");
    } else {
      setLocalPeriod("week");
    }
  }, [period]);

  useEffect(() => {
    habitsApi.getConsistency({ period: localPeriod }).then(setData).catch(console.error);
  }, [localPeriod]);

  const numDays = localPeriod === "week" ? 7 : 30;

  // Generate date labels
  const dateLabels = Array.from({ length: numDays }, (_, i) => {
    const d = subDays(new Date(), numDays - 1 - i);
    return localPeriod === "week" ? format(d, "EEE") : format(d, "dd");
  });

  return (
    <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 shadow-sm relative h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Habit Consistency
          </h2>
          <Info className="h-3.5 w-3.5 text-zinc-600" />
        </div>
        <div className="flex rounded-md border border-zinc-800 bg-zinc-900/50 p-0.5">
          <button
            onClick={() => setLocalPeriod("week")}
            className={`rounded px-3 py-1 text-[10px] font-bold transition-colors ${localPeriod === "week" ? "text-white bg-zinc-800 shadow-sm" : "text-zinc-500 hover:text-white"}`}
          >
            Weekly
          </button>
          <button
            onClick={() => setLocalPeriod("month")}
            className={`rounded px-3 py-1 text-[10px] font-bold transition-colors ${localPeriod === "month" ? "text-white bg-zinc-800 shadow-sm" : "text-zinc-500 hover:text-white"}`}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex-1 overflow-x-auto custom-scrollbar" ref={scrollRef}>
        <div className="min-w-max">
          {/* Day Labels */}
          <div className="flex mb-3 pl-[140px]">
            {dateLabels.map((label, i) => (
              <div
                key={i}
                className="w-[18px] shrink-0 text-center text-[10px] font-medium text-zinc-500 mx-[2px]"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Habits Rows */}
          <div className="flex flex-col gap-3">
            {data.length === 0 && (
              <div className="pl-[140px] text-xs text-zinc-500">
                No habits tracked in this period.
              </div>
            )}
            {data.map((habit) => (
              <div key={habit.id} className="flex items-center">
                <div className="w-[140px] shrink-0 flex items-center justify-between pr-4 sticky left-0 bg-zinc-950/90 z-10">
                  <span className="text-[11px] font-medium text-zinc-300 truncate">
                    {habit.name}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-amber-500 shrink-0 pl-2">
                    <Flame className="h-3 w-3 fill-amber-500" /> {habit.streak}
                  </div>
                </div>
                <div className="flex items-center">
                  {habit.days.map((completed, i) => (
                    <div
                      key={i}
                      className={`h-[14px] w-[14px] mx-[2px] shrink-0 rounded-sm transition-all ${
                        completed
                          ? "bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.3)] border border-emerald-400/50"
                          : "bg-zinc-900 border border-zinc-800/50"
                      }`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Legend */}
      <div className="mt-6 flex items-center justify-between pt-4 border-t border-zinc-800/50">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-zinc-500">Less</span>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-sm bg-zinc-900 border border-zinc-800" />
            <div className="h-3 w-3 rounded-sm bg-emerald-900 border border-emerald-800" />
            <div className="h-3 w-3 rounded-sm bg-emerald-700 border border-emerald-600" />
            <div className="h-3 w-3 rounded-sm bg-emerald-500 border border-emerald-400 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
            <div className="h-3 w-3 rounded-sm bg-emerald-400 border border-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          </div>
          <span className="text-[10px] font-medium text-zinc-500">More</span>
        </div>

        <button className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-[10px] font-medium text-zinc-300 hover:bg-zinc-800">
          Current streaks <ChevronDown className="h-3 w-3 text-zinc-500" />
        </button>
      </div>
    </div>
  );
}
