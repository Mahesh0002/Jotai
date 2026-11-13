import { Sun, Clock, TrendingUp, ChevronRight } from "lucide-react";

export function SessionInsightsCard() {
  return (
    <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
          Session Insights
        </h2>
      </div>

      <div className="flex flex-col gap-4 flex-1">
        <div className="flex items-start gap-3">
          <Sun className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-zinc-300 leading-snug">
            You're most productive in the morning
          </p>
        </div>

        <div className="flex items-start gap-3">
          <Clock className="h-4 w-4 text-zinc-500 mt-0.5 shrink-0" />
          <p className="text-xs text-zinc-300 leading-snug">Longest sessions happen before 12 PM</p>
        </div>

        <div className="flex items-start gap-3">
          <TrendingUp className="h-4 w-4 text-zinc-500 mt-0.5 shrink-0" />
          <p className="text-xs text-zinc-300 leading-snug">
            Try scheduling hard tasks in this window
          </p>
        </div>
      </div>

      <button className="mt-4 flex w-full items-center justify-center gap-1.5 rounded bg-zinc-900 py-2 text-[11px] font-medium text-purple-400 hover:bg-zinc-800 transition-colors">
        View Full Insights <ChevronRight className="h-3 w-3" />
      </button>
    </div>
  );
}
