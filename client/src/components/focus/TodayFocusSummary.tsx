import { Sparkles, Flame } from "lucide-react";

export function TodayFocusSummary() {
  return (
    <div className="flex items-center rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 shadow-sm mb-6 w-full">
      <div className="w-1/4">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
          Today's Focus
        </h2>
      </div>

      <div className="w-3/4 grid grid-cols-4 gap-8">
        <div className="flex flex-col border-l border-zinc-800/50 pl-8">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="h-4 w-4 text-purple-400 opacity-50" />
            <span className="text-xl font-bold text-white">3</span>
          </div>
          <span className="text-[10px] text-zinc-500 font-medium">Sessions Planned</span>
        </div>

        <div className="flex flex-col border-l border-zinc-800/50 pl-8">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xl font-bold text-white">2</span>
          </div>
          <span className="text-[10px] text-zinc-500 font-medium">Completed</span>
        </div>

        <div className="flex flex-col border-l border-zinc-800/50 pl-8">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xl font-bold text-white">1h 42m</span>
          </div>
          <span className="text-[10px] text-zinc-500 font-medium">Total Focus Time</span>
        </div>

        <div className="flex flex-col border-l border-zinc-800/50 pl-8">
          <div className="flex items-center gap-1.5 mb-1">
            <Flame className="h-4 w-4 text-amber-500" />
            <span className="text-xl font-bold text-white">7</span>
          </div>
          <span className="text-[10px] text-zinc-500 font-medium">Day Streak</span>
        </div>
      </div>
    </div>
  );
}
