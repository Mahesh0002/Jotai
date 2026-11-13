import { PersonStanding, Focus, Activity, Target, ChevronDown } from "lucide-react";

export function PerformanceOverview() {
  const metrics = [
    {
      name: "Consistency",
      percent: 84,
      icon: PersonStanding,
      color: "text-emerald-500",
      bg: "bg-emerald-500",
    },
    { name: "Focus", percent: 78, icon: Focus, color: "text-blue-500", bg: "bg-blue-500" },
    { name: "Habits", percent: 91, icon: Activity, color: "text-purple-400", bg: "bg-purple-500" },
    { name: "Execution", percent: 86, icon: Target, color: "text-amber-500", bg: "bg-amber-500" },
  ];

  return (
    <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
            Performance Overview
          </h2>
          <span className="text-[11px] text-zinc-500">Your performance across key areas</span>
        </div>
        <button className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-[10px] font-medium text-zinc-300 hover:bg-zinc-800">
          This Week <ChevronDown className="h-3 w-3 text-zinc-500" />
        </button>
      </div>

      <div className="flex flex-col gap-6">
        {metrics.map((m, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className={`flex items-center gap-2.5 w-28 shrink-0 ${m.color}`}>
              <m.icon className="h-4 w-4" />
              <span className="text-[11px] font-medium text-zinc-300">{m.name}</span>
            </div>

            <div className="flex-1 h-2 rounded-full bg-zinc-900 overflow-hidden shadow-inner">
              <div
                className={`h-full rounded-full ${m.bg}`}
                style={{
                  width: `${m.percent}%`,
                  boxShadow: `0 0 10px var(--tw-colors-${m.bg.split("-")[1]}-${m.bg.split("-")[2]})`,
                }}
              />
            </div>

            <span className="text-xs font-bold text-white w-8 text-right">{m.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
