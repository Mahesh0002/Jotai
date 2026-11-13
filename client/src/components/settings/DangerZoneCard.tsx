import { RefreshCcw, Trash2, Download, UserX } from "lucide-react";

export function DangerZoneCard() {
  return (
    <div className="flex flex-col rounded-xl border border-red-900/50 bg-red-950/10 p-6 shadow-sm mt-8">
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-red-400 mb-1">Danger Zone</h2>
        <p className="text-[11px] text-zinc-400">Irreversible and sensitive actions.</p>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="flex flex-col">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded border border-red-900/50 bg-red-950/30 text-red-400">
              <RefreshCcw className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <h3 className="text-[11px] font-semibold text-white mb-0.5">Reset Preferences</h3>
              <p className="text-[10px] text-zinc-500 leading-snug">
                Reset all settings to default values.
              </p>
            </div>
          </div>
          <button className="mt-auto flex w-full items-center justify-center rounded border border-red-900/50 bg-red-950/20 py-2 text-[11px] font-medium text-red-400 hover:bg-red-950/50 transition-colors">
            Reset
          </button>
        </div>

        <div className="flex flex-col">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded border border-red-900/50 bg-red-950/30 text-red-400">
              <Trash2 className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <h3 className="text-[11px] font-semibold text-white mb-0.5">Clear Local Data</h3>
              <p className="text-[10px] text-zinc-500 leading-snug">
                Clear all locally stored application data.
              </p>
            </div>
          </div>
          <button className="mt-auto flex w-full items-center justify-center rounded border border-red-900/50 bg-red-950/20 py-2 text-[11px] font-medium text-red-400 hover:bg-red-950/50 transition-colors">
            Clear Data
          </button>
        </div>

        <div className="flex flex-col">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded border border-red-900/50 bg-red-950/30 text-red-400">
              <Download className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <h3 className="text-[11px] font-semibold text-white mb-0.5">Export Everything</h3>
              <p className="text-[10px] text-zinc-500 leading-snug">
                Export everything before making changes.
              </p>
            </div>
          </div>
          <button className="mt-auto flex w-full items-center justify-center rounded border border-red-900/50 bg-red-950/20 py-2 text-[11px] font-medium text-red-400 hover:bg-red-950/50 transition-colors">
            Export All
          </button>
        </div>

        <div className="flex flex-col">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded border border-red-900/50 bg-red-950/30 text-red-400">
              <UserX className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <h3 className="text-[11px] font-semibold text-white mb-0.5">Delete Account</h3>
              <p className="text-[10px] text-zinc-500 leading-snug">
                Permanently delete your account and all data.
              </p>
            </div>
          </div>
          <button className="mt-auto flex w-full items-center justify-center rounded border border-red-900/50 bg-red-600/20 py-2 text-[11px] font-medium text-red-400 hover:bg-red-600/30 transition-colors">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
