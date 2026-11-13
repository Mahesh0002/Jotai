import { ArrowUp, ArrowDown } from "lucide-react";

export function WeeklyOverview() {
  const metrics = [
    { label: "Focus time", value: "15h 30m", change: "+12%", trend: "up", vs: "vs last week" },
    { label: "Meetings", value: "6h 30m", change: "-5%", trend: "down", vs: "vs last week" },
    { label: "Personal", value: "7h 00m", change: "+8%", trend: "up", vs: "vs last week" },
    { label: "Breaks", value: "5h 00m", change: "-3%", trend: "down", vs: "vs last week" },
  ];

  return (
    <div className="flex h-32 shrink-0 items-center border-t border-zinc-800 bg-zinc-950 px-8 py-4">
      {/* Metrics Section */}
      <div className="flex flex-1 flex-col">
        <h3 className="mb-4 text-xs font-semibold text-white">Weekly overview</h3>
        <div className="grid grid-cols-4 gap-8">
          {metrics.map((m, i) => (
            <div key={i} className="flex flex-col">
              <span className="text-[11px] font-medium text-zinc-400 mb-1">{m.label}</span>
              <span className="text-xl font-light text-white mb-1">{m.value}</span>
              <div
                className={`flex items-center gap-1 text-[10px] font-medium ${m.trend === "up" ? "text-emerald-500" : "text-rose-500"}`}
              >
                {m.trend === "up" ? (
                  <ArrowUp className="h-3 w-3" />
                ) : (
                  <ArrowDown className="h-3 w-3" />
                )}
                <span>{m.change.replace("+", "").replace("-", "")}</span>
                <span className="text-zinc-500">{m.vs}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart Section */}
      <div className="flex items-center gap-6 border-l border-zinc-800 pl-8">
        {/* Simple CSS Donut Chart Mock */}
        <div
          className="relative h-16 w-16 rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, #9333ea 0% 42%, #3b82f6 42% 60%, #10b981 60% 80%, #f59e0b 80% 93%, #3f3f46 93% 100%)",
          }}
        >
          <div className="absolute inset-2 rounded-full bg-zinc-950" />
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-6 text-[10px] font-medium">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />{" "}
              <span className="text-zinc-400">Focus</span>
            </div>
            <span className="text-white">42%</span>
          </div>
          <div className="flex items-center justify-between gap-6 text-[10px] font-medium">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />{" "}
              <span className="text-zinc-400">Meetings</span>
            </div>
            <span className="text-white">18%</span>
          </div>
          <div className="flex items-center justify-between gap-6 text-[10px] font-medium">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{" "}
              <span className="text-zinc-400">Personal</span>
            </div>
            <span className="text-white">20%</span>
          </div>
          <div className="flex items-center justify-between gap-6 text-[10px] font-medium">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />{" "}
              <span className="text-zinc-400">Breaks</span>
            </div>
            <span className="text-white">13%</span>
          </div>
          <div className="flex items-center justify-between gap-6 text-[10px] font-medium">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />{" "}
              <span className="text-zinc-400">Other</span>
            </div>
            <span className="text-white">7%</span>
          </div>
        </div>

        <button className="ml-4 self-end text-[10px] text-zinc-500 hover:text-white transition-colors">
          View full analytics →
        </button>
      </div>
    </div>
  );
}
