export function XpSources() {
  const sources = [
    {
      name: "Tasks",
      percent: 42,
      xp: "1,195 XP",
      color: "bg-emerald-500",
      stroke: "#10b981",
      offset: 0,
      length: 42,
    },
    {
      name: "Habits",
      percent: 28,
      xp: "797 XP",
      color: "bg-blue-500",
      stroke: "#3b82f6",
      offset: -42,
      length: 28,
    },
    {
      name: "Focus",
      percent: 21,
      xp: "597 XP",
      color: "bg-purple-500",
      stroke: "#a855f7",
      offset: -70,
      length: 21,
    },
    {
      name: "Quests",
      percent: 9,
      xp: "258 XP",
      color: "bg-amber-500",
      stroke: "#f59e0b",
      offset: -91,
      length: 9,
    },
  ];

  // SVG circle calculations
  const radius = 40;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 shadow-sm">
      <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-6">
        XP Sources
      </h2>

      <div className="flex items-center gap-8">
        {/* Donut Chart */}
        <div className="relative h-24 w-24 shrink-0">
          <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#18181b" // zinc-900
              strokeWidth="12"
            />
            {/* Segments */}
            {sources.map((s, i) => {
              const dashLength = (s.length / 100) * circumference;
              const dashOffset = (s.offset / 100) * circumference;

              return (
                <circle
                  key={i}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke={s.stroke}
                  strokeWidth="12"
                  strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                  strokeDashoffset={dashOffset}
                  className="transition-all duration-1000 ease-out"
                />
              );
            })}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-bold text-white leading-none mb-0.5">2,847</span>
            <span className="text-[9px] text-zinc-500 leading-none">Total XP</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-3 flex-1">
          {sources.map((s, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`h-1.5 w-1.5 rounded-full ${s.color}`} />
                <span className="text-[11px] text-zinc-300 w-12">{s.name}</span>
              </div>
              <span className="text-[11px] text-zinc-400">{s.percent}%</span>
              <span className="text-[11px] font-medium text-zinc-300 w-14 text-right">{s.xp}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
