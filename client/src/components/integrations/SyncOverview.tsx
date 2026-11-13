import { RefreshCw, ArrowRight } from "lucide-react";

export function SyncOverview() {
  return (
    <div className="flex flex-col mt-4">
      <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 pl-1 mb-4">
        Sync Status Overview
      </h2>

      <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 shadow-sm">
        <div className="flex items-center gap-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <RefreshCw className="h-5 w-5" />
          </div>

          <div className="flex flex-col items-center">
            <span className="text-xl font-bold text-white">5</span>
            <span className="text-[11px] text-zinc-500">Connected</span>
          </div>

          <div className="flex flex-col items-center border-l border-zinc-800/50 pl-8">
            <span className="text-xl font-bold text-white">42</span>
            <span className="text-[11px] text-zinc-500">Items Synced</span>
          </div>

          <div className="flex flex-col items-center border-l border-zinc-800/50 pl-8">
            <span className="text-xl font-bold text-white">2m ago</span>
            <span className="text-[11px] text-zinc-500">Last Sync</span>
          </div>

          <div className="flex flex-col items-center border-l border-zinc-800/50 pl-8">
            <span className="text-xl font-bold text-white">0</span>
            <span className="text-[11px] text-zinc-500">Sync Errors</span>
          </div>
        </div>

        <button className="flex items-center text-[11px] font-medium text-purple-400 hover:text-purple-300 transition-colors">
          View Sync History <ArrowRight className="ml-1.5 h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
