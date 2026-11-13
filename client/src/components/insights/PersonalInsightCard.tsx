import { TrendingUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PersonalInsightCard() {
  return (
    <div className="flex rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 shadow-sm h-[180px]">
      {/* Left Column */}
      <div className="flex w-1/2 flex-col justify-between pr-6 border-r border-zinc-800/50">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
              Personal Insight
            </span>
          </div>
          <h3 className="text-sm font-medium leading-tight text-white mb-2">
            You complete more tasks when your first focus session starts before 9:30 AM.
          </h3>
          <p className="text-[11px] leading-relaxed text-zinc-400">
            On these days, your completion rate increases by{" "}
            <span className="text-emerald-400 font-medium">23%</span>.
          </p>
        </div>
      </div>

      {/* Center Column: Bars */}
      <div className="flex w-[30%] flex-col justify-center px-6 border-r border-zinc-800/50 gap-5">
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-medium text-zinc-400">Days with early start</span>
            <span className="text-sm font-bold text-white">84.6%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
              style={{ width: "84.6%" }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-medium text-zinc-400">Days with late start</span>
            <span className="text-sm font-bold text-white">61.3%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
            <div className="h-full bg-emerald-500/50" style={{ width: "61.3%" }} />
          </div>
        </div>
      </div>

      {/* Right Column: Tip */}
      <div className="flex flex-1 flex-col justify-center pl-6">
        <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/30 p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="h-3 w-3 text-purple-400" />
            <span className="text-[9px] font-bold tracking-wider text-purple-400 uppercase">
              Jōtai Tip
            </span>
          </div>
          <p className="text-[10px] leading-relaxed text-zinc-300 mb-3">
            Try starting tomorrow with your highest priority task.
          </p>
          <Button
            variant="outline"
            className="h-7 w-full border-zinc-700 bg-transparent text-[10px] text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            Add to routine
          </Button>
        </div>
      </div>
    </div>
  );
}
