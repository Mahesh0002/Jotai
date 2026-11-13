import {
  Edit2,
  Shield,
  ArrowRight,
  Zap,
  Flame,
  Star,
  Target,
  Clock,
  TrendingUp,
} from "lucide-react";

export function RunnerProfile() {
  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header Texts */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white mb-1">Jötai Runner</h1>
        <p className="text-sm text-zinc-400">Your consistency, progress and achievements.</p>
      </div>

      {/* Main Profile Banner */}
      <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950/50 p-6 shadow-sm overflow-hidden relative">
        {/* Subtle purple gradient background */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-purple-900/20 to-transparent pointer-events-none" />

        <div className="flex items-center gap-8 relative z-10 w-full max-w-3xl">
          {/* Avatar */}
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-purple-500 bg-zinc-900 text-2xl font-bold text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]">
              JR
            </div>
            <button className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors">
              <Edit2 className="h-3 w-3" />
            </button>
          </div>

          {/* Details & Progress */}
          <div className="flex flex-col flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-white">Jötai Runner</h2>
              <span className="rounded bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-400 border border-purple-500/30">
                Level 08
              </span>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-bold text-white">2,847</span>
              <span className="text-sm text-zinc-500">/ 3,000 XP</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-2 flex-1 rounded-full bg-zinc-800/80 overflow-hidden shadow-inner">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-600 to-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.6)]"
                  style={{ width: "95%" }}
                />
              </div>
              <span className="text-[11px] font-bold text-purple-400">95%</span>
            </div>

            <div className="flex items-center gap-1.5 mt-2">
              <Zap className="h-3 w-3 text-amber-500 fill-amber-500" />
              <span className="text-[11px] font-medium text-zinc-400">153 XP until Level 09</span>
            </div>
          </div>
        </div>

        {/* Shield Badge */}
        <div className="flex flex-col items-center justify-center gap-2 relative z-10 pl-8 border-l border-zinc-800/50">
          <div className="relative flex h-16 w-16 items-center justify-center">
            <Shield className="absolute inset-0 h-16 w-16 text-purple-500/20" strokeWidth={1} />
            <Shield
              className="absolute inset-0 h-16 w-16 text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.3)]"
              strokeWidth={1.5}
            />
            <span className="text-xl font-bold text-white">08</span>
          </div>
          <button className="flex items-center text-[10px] font-medium text-purple-400 hover:text-purple-300 transition-colors">
            View level perks <ArrowRight className="ml-1 h-3 w-3" />
          </button>
        </div>
      </div>

      {/* 4 Metrics Row */}
      <div className="grid grid-cols-4 gap-4">
        {/* Streak */}
        <div className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-950/50 p-5 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-white leading-none mb-1">12</span>
            <span className="text-[11px] text-zinc-400 mb-1">Day Streak</span>
            <span className="text-[10px] font-medium text-emerald-500">Keep it up!</span>
          </div>
        </div>

        {/* XP Earned */}
        <div className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-950/50 p-5 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
            <Star className="h-5 w-5 fill-amber-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-white leading-none mb-1">2,847</span>
            <span className="text-[11px] text-zinc-400 mb-1">XP Earned</span>
            <span className="text-[10px] font-medium text-emerald-500">This week +426 XP</span>
          </div>
        </div>

        {/* Quests */}
        <div className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-950/50 p-5 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
            <Target className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-white leading-none mb-1">64</span>
            <span className="text-[11px] text-zinc-400 mb-1">Quests Completed</span>
            <span className="text-[10px] font-medium text-emerald-500">This week 12</span>
          </div>
        </div>

        {/* Focus Time */}
        <div className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-950/50 p-5 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
            <Clock className="h-5 w-5 fill-blue-500/20" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-white leading-none mb-1">18h 42m</span>
            <span className="text-[11px] text-zinc-400 mb-1">Focus Time</span>
            <span className="text-[10px] font-medium text-emerald-500">This week +3h 21m</span>
          </div>
        </div>
      </div>
    </div>
  );
}
