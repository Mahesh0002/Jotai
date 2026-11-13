import {
  Music,
  CloudRain,
  ShieldCheck,
  Pause,
  FastForward,
  Volume2,
  Settings2,
  ChevronRight,
} from "lucide-react";

export function FocusEnvironmentCard() {
  return (
    <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
          Focus Environment
        </h2>
      </div>

      <div className="flex flex-col gap-5 flex-1">
        {/* Music */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white">Music</span>
              <span className="text-[10px] text-zinc-500">Spotify Connected</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-medium text-zinc-300">Lo-fi Beats</span>
            <div className="flex items-center gap-1 bg-zinc-900 rounded-full border border-zinc-800 p-0.5">
              <button className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-zinc-800 text-white transition-colors">
                <Pause className="h-3 w-3" />
              </button>
              <button className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-zinc-800 text-white transition-colors">
                <FastForward className="h-3 w-3 fill-current" />
              </button>
            </div>
          </div>
        </div>

        {/* Ambient */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-zinc-400">
              <CloudRain className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white">Ambient Sound</span>
              <span className="text-[10px] text-zinc-500">Rain</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-zinc-300 mr-2">Soft Rain</span>
            <div className="h-1 w-16 bg-purple-900/50 rounded-full relative">
              <div className="absolute top-0 left-0 h-full w-2/3 bg-purple-500 rounded-full"></div>
              <div className="absolute top-1/2 left-2/3 -translate-y-1/2 h-2.5 w-2.5 bg-white rounded-full shadow"></div>
            </div>
            <Volume2 className="h-3.5 w-3.5 text-zinc-500 ml-1" />
          </div>
        </div>

        {/* Distractions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-zinc-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white">Distractions</span>
              <span className="text-[10px] text-zinc-500">Blocking Enabled</span>
            </div>
          </div>
          <div className="flex items-center gap-1 cursor-pointer group">
            <span className="text-[11px] font-medium text-zinc-300 group-hover:text-white transition-colors">
              4 apps blocked
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-500 group-hover:text-white transition-colors" />
          </div>
        </div>
      </div>

      <button className="mt-6 flex w-full items-center justify-center gap-2 rounded border border-purple-500/20 bg-purple-900/20 py-2 text-[11px] font-medium text-purple-400 hover:bg-purple-900/40 transition-colors">
        Customize Environment <Settings2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
