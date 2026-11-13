import { CheckCircle2, PlayCircle, Circle } from "lucide-react";

export function TodaySessionsCard() {
  return (
    <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 shadow-sm flex-1 min-h-[280px]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
          Today's Sessions
        </h2>
        <button className="text-[10px] font-medium text-purple-400 hover:text-purple-300 transition-colors">
          View All
        </button>
      </div>

      <div className="flex flex-col gap-5 flex-1 overflow-y-auto custom-scrollbar pr-2 mb-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          <span className="text-xs font-bold text-white w-8 shrink-0">25m</span>
          <span className="text-[11px] text-zinc-500 w-16 shrink-0">Deep Work</span>
          <span className="text-[11px] font-medium text-zinc-300 truncate flex-1">
            NLP Assignment
          </span>
          <span className="text-[10px] text-zinc-500 shrink-0">09:00 AM</span>
        </div>

        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          <span className="text-xs font-bold text-white w-8 shrink-0">50m</span>
          <span className="text-[11px] text-zinc-500 w-16 shrink-0">Deep Work</span>
          <span className="text-[11px] font-medium text-zinc-300 truncate flex-1">
            Research Work
          </span>
          <span className="text-[10px] text-zinc-500 shrink-0">10:30 AM</span>
        </div>

        <div className="flex items-center gap-3">
          <PlayCircle className="h-4 w-4 text-purple-400 shrink-0" />
          <span className="text-xs font-bold text-white w-8 shrink-0">25m</span>
          <span className="text-[11px] text-zinc-500 w-16 shrink-0">Deep Work</span>
          <span className="text-[11px] font-medium text-zinc-300 truncate flex-1">
            Project Work
          </span>
          <span className="text-[10px] text-zinc-500 shrink-0">02:00 PM</span>
        </div>

        <div className="flex items-center gap-3 opacity-50">
          <Circle className="h-4 w-4 text-zinc-600 shrink-0" />
          <span className="text-xs font-bold text-zinc-400 w-8 shrink-0">15m</span>
          <span className="text-[11px] text-zinc-500 w-16 shrink-0">Break</span>
          <span className="text-[11px] font-medium text-zinc-400 truncate flex-1">Long Break</span>
          <span className="text-[10px] text-zinc-600 shrink-0">—</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50 mt-auto">
        <span className="text-xs text-zinc-400">Total Focus Time</span>
        <span className="text-lg font-bold text-purple-400">1h 42m</span>
      </div>
    </div>
  );
}
