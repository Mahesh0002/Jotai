import { Circle, Clock, RefreshCw, ExternalLink } from "lucide-react";

export function SettingsStatusBar() {
  return (
    <div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-950 px-6 py-2 shrink-0">
      {/* Left */}
      <div className="flex items-center gap-6">
        <span className="text-[10px] font-medium text-zinc-400">Jōtai v1.0.0</span>
        <div className="flex items-center gap-2">
          <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500" />
          <span className="text-[10px] text-zinc-400">All Systems Operational</span>
        </div>
      </div>

      {/* Center */}
      <div className="flex items-center gap-6">
        <span className="text-[10px] text-zinc-500">Local Time: 08:42 PM</span>
        <div className="flex items-center gap-1.5">
          <RefreshCw className="h-3 w-3 text-zinc-500" />
          <span className="text-[10px] text-zinc-500">Synced 2 min ago</span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-6">
        <a
          href="#"
          className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          Privacy Policy <ExternalLink className="h-2.5 w-2.5" />
        </a>
        <a
          href="#"
          className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          Terms of Service <ExternalLink className="h-2.5 w-2.5" />
        </a>
      </div>
    </div>
  );
}
