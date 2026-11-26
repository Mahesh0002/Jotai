import { Card } from "@/components/ui/card";
import { ArrowRight, Activity } from "lucide-react";
import { useHabitAnalytics } from "@/hooks/useHabits";

/** Shows only locally computed habit data; no invented correlations. */
export function HabitImpactWidget() {
  const { analytics } = useHabitAnalytics();
  const streaks = (analytics?.streaks ?? []).slice(0, 5);

  return (
    <Card className="relative flex h-full flex-col border-zinc-800/80 bg-zinc-950 p-5">
      <h2 className="mb-5 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
        Habit momentum
      </h2>
      <div className="flex flex-1 flex-col gap-4">
        {streaks.map((habit) => (
          <div key={habit.habitId} className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="text-sm">{habit.icon}</span>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-xs font-bold text-white">{habit.name}</span>
                <span className="text-[10px] text-zinc-500">Current streak</span>
              </div>
            </div>
            <span className="shrink-0 text-xs font-bold text-emerald-500">
              {habit.currentStreak}d
            </span>
          </div>
        ))}
        {streaks.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <Activity className="size-5 text-zinc-600" />
            <p className="text-[11px] text-zinc-500">
              Complete habits to build local momentum data.
            </p>
          </div>
        )}
      </div>
      <button
        onClick={() =>
          window.dispatchEvent(
            new CustomEvent("open-ai-assistant", {
              detail: "How are my habits affecting my productivity?",
            }),
          )
        }
        className="mt-4 flex w-max items-center border-t border-zinc-800/50 pt-4 text-[10px] text-purple-400 transition-colors hover:text-purple-300"
      >
        Ask the assistant <ArrowRight className="ml-1 size-3" />
      </button>
    </Card>
  );
}
