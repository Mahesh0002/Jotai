import {
  ChevronDown,
  Star,
  ClipboardCheck,
  Clock,
  Flower2,
  Trophy,
  Flame,
  ArrowUp,
} from "lucide-react";

export function WeeklySummary() {
  const summary = [
    {
      name: "XP Earned",
      val: "+426",
      change: "18%",
      icon: Star,
      color: "text-amber-500",
      bg: "bg-amber-500/10 border-amber-500/20",
    },
    {
      name: "Tasks Completed",
      val: "28",
      change: "12%",
      icon: ClipboardCheck,
      color: "text-zinc-400",
      bg: "bg-zinc-800/50 border-zinc-700",
    },
    {
      name: "Focus Time",
      val: "11h 24m",
      change: "22%",
      icon: Clock,
      color: "text-blue-500",
      bg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      name: "Habits Completed",
      val: "36",
      change: "16%",
      icon: Flower2,
      color: "text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/20",
    },
    {
      name: "Quests Completed",
      val: "12",
      change: "33%",
      icon: Trophy,
      color: "text-amber-400",
      bg: "bg-amber-400/10 border-amber-400/20",
    },
    {
      name: "Current Streak",
      val: "12 days",
      change: "2 days",
      icon: Flame,
      color: "text-red-500",
      bg: "bg-red-500/10 border-red-500/20",
      unit: "days",
    },
  ];

  return (
    <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 shadow-sm h-full">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
          Weekly Summary
        </h2>
        <button className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-[10px] font-medium text-zinc-300 hover:bg-zinc-800">
          This Week <ChevronDown className="h-3 w-3 text-zinc-500" />
        </button>
      </div>

      <div className="flex flex-col gap-6 flex-1">
        {summary.map((s, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full border ${s.bg}`}
              >
                <s.icon
                  className={`h-3.5 w-3.5 ${s.color} ${s.name === "XP Earned" ? "fill-amber-500" : ""}`}
                />
              </div>
              <span className="text-xs font-medium text-zinc-300">{s.name}</span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-white w-16 text-right">{s.val}</span>
              <div className="flex items-center gap-1 w-20 justify-end">
                <ArrowUp className="h-3 w-3 text-emerald-500" />
                <span className="text-[10px] font-bold text-emerald-500">{s.change}</span>
                <span className="text-[10px] text-zinc-500">vs last week</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
