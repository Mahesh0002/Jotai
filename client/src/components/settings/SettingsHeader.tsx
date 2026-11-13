import { Search, Bell } from "lucide-react";

export function SettingsHeader() {
  return (
    <div className="flex items-center justify-between border-b border-zinc-800/50 pb-6 mb-8 pt-2">
      {/* Title & Subtitle */}
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Settings</h1>
        <p className="text-sm text-zinc-400">Configure how Jōtai works for you.</p>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-6">
        {/* Search */}
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search settings..."
            className="h-9 w-full rounded-lg border border-zinc-800 bg-zinc-900/50 pl-9 pr-10 text-sm text-zinc-300 placeholder:text-zinc-500 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
            ⌘K
          </div>
        </div>

        {/* Icons & Avatar */}
        <div className="flex items-center gap-4 border-l border-zinc-800 pl-6">
          <button className="text-zinc-400 hover:text-white transition-colors relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500 border-2 border-zinc-950"></span>
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white shadow-[0_0_10px_rgba(147,51,234,0.3)]">
            JR
          </div>
        </div>
      </div>
    </div>
  );
}
