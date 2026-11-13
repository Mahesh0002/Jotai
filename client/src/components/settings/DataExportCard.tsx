import { Download, ChevronRight, ChevronDown, ExternalLink } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";

export function DataExportCard() {
  const { settings, updateSetting } = useSettings();

  return (
    <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 shadow-sm">
      <div className="flex items-start gap-3 mb-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20">
          <Download className="h-4 w-4 text-purple-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white mb-0.5">Data & Export</h2>
          <p className="text-[11px] text-zinc-400">Back up and export your data.</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <button className="flex items-center justify-between hover:bg-zinc-900/50 -mx-2 px-2 py-1 rounded transition-colors">
          <span className="text-xs font-medium text-zinc-300">Export all data</span>
          <ChevronRight className="h-3.5 w-3.5 text-zinc-500" />
        </button>

        <button className="flex items-center justify-between pb-3 border-b border-zinc-800/50 hover:bg-zinc-900/50 -mx-2 px-2 py-1 rounded transition-colors">
          <span className="text-xs font-medium text-zinc-300">Backup now</span>
          <ChevronRight className="h-3.5 w-3.5 text-zinc-500" />
        </button>

        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-300">Automatic backups</span>
          <div className="relative w-24">
            <select
              value={settings.automaticBackups}
              onChange={(e) => updateSetting("automaticBackups", e.target.value)}
              className="h-7 w-full appearance-none rounded border border-zinc-800 bg-zinc-900/50 pl-3 pr-7 text-[11px] text-zinc-200 focus:border-purple-500/50 focus:outline-none transition-colors"
            >
              <option>Daily</option>
              <option>Weekly</option>
              <option>Never</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-300">Last backup</span>
          <span className="text-[11px] text-zinc-500">Today, 08:42 AM</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-300">Storage used</span>
          <span className="text-[11px] text-zinc-500">1.24 GB / 10 GB</span>
        </div>

        <button className="mt-2 flex w-full items-center justify-center gap-2 rounded border border-zinc-800 bg-zinc-900/30 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors">
          View All Backups <ExternalLink className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
