import { Star, Flame, Sun, Lock, ArrowRight, Hexagon } from "lucide-react";

export function Achievements() {
  const unlocked = [
    {
      name: "Deep Worker",
      desc: "Complete 10 deep-work sessions",
      unlocked: "Unlocked on Aug 18, 2026",
      icon: Star,
      color: "text-amber-500",
      hexFill: "fill-amber-500/20",
    },
    {
      name: "7 Day Streak",
      desc: "Maintain a 7-day activity streak",
      unlocked: "Unlocked on Aug 14, 2026",
      icon: Flame,
      color: "text-emerald-500",
      hexFill: "fill-emerald-500/20",
    },
    {
      name: "Early Starter",
      desc: "Complete morning focus 7 days",
      unlocked: "Unlocked on Aug 10, 2026",
      icon: Sun,
      color: "text-blue-500",
      hexFill: "fill-blue-500/20",
    },
  ];

  const locked = [
    {
      name: "Marathon",
      desc: "Complete a 2-hour focus session",
      progress: 84,
      progressText: "84%",
    },
    {
      name: "Iron Routine",
      desc: "Maintain a 30-day habit streak",
      progress: 40,
      progressText: "12 / 30 days",
    },
  ];

  return (
    <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
          Achievements
        </h2>
        <button className="flex items-center text-[10px] text-purple-400 hover:text-purple-300 transition-colors">
          View all <ArrowRight className="ml-1 h-3 w-3" />
        </button>
      </div>

      <div className="flex flex-col gap-6">
        {/* Unlocked */}
        {unlocked.map((a, i) => (
          <div key={i} className="flex gap-4 group cursor-pointer">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
              <Hexagon
                className={`absolute inset-0 h-10 w-10 ${a.color} ${a.hexFill}`}
                strokeWidth={1.5}
              />
              <a.icon className={`h-4 w-4 ${a.color} fill-current`} />
            </div>
            <div className="flex flex-col flex-1 pt-1">
              <span className="text-[11px] font-bold text-white group-hover:text-purple-400 transition-colors">
                {a.name}
              </span>
              <span className="text-[10px] text-zinc-400 mb-1">{a.desc}</span>
              <span className="text-[9px] font-medium text-emerald-500">{a.unlocked}</span>
            </div>
          </div>
        ))}

        {/* Locked */}
        {locked.map((a, i) => (
          <div key={i} className="flex gap-4">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
              <Hexagon
                className="absolute inset-0 h-10 w-10 text-zinc-700 fill-zinc-800/50"
                strokeWidth={1.5}
              />
              <Lock className="h-4 w-4 text-zinc-500" />
            </div>
            <div className="flex flex-col flex-1 pt-1">
              <div className="flex items-start justify-between">
                <span className="text-[11px] font-bold text-zinc-300">{a.name}</span>
                <span className="text-[9px] text-zinc-500">{a.progressText}</span>
              </div>
              <span className="text-[10px] text-zinc-500 mb-2">{a.desc}</span>

              <div className="h-1.5 w-full rounded-full bg-zinc-900 overflow-hidden shadow-inner">
                <div
                  className="h-full rounded-full bg-purple-600"
                  style={{ width: `${a.progress}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
