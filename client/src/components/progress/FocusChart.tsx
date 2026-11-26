import { Info, ChevronDown, ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { analyticsApi, FocusAnalytics } from "@/lib/api";
import { Period } from "@/routes/progress";
import { format, subDays } from "date-fns";

export function FocusChart({ period }: { period: Period }) {
  const [data, setData] = useState<FocusAnalytics | null>(null);

  useEffect(() => {
    analyticsApi.getFocus({ period }).then(setData).catch(console.error);
  }, [period]);

  const numDays = period === "month" || period === "year" ? 30 : 7; // simplified view

  let displayData = data?.focusByDay || [];

  if (displayData.length === 0) {
    displayData = Array.from({ length: numDays }, (_, i) => {
      const d = subDays(new Date(), numDays - 1 - i);
      return {
        date: d.toISOString().split("T")[0] ?? "",
        day: format(d, "EEE"),
        focusSeconds: 0,
      };
    });
  }

  // Truncate to last 7 days for the UI
  const chartData = displayData.slice(-7);

  const rawVals = chartData.map((d) => d.focusSeconds / 3600); // in hours
  const maxVal = Math.max(...rawVals, 5); // at least 5 hours max to look good

  // SVG dimensions
  const width = 800;
  const height = 200;
  const paddingX = 40;
  const paddingY = 20;

  const points = rawVals.map((val, i) => {
    const x = paddingX + (i * (width - 2 * paddingX)) / (chartData.length - 1 || 1);
    const y = height - paddingY - (val / maxVal) * (height - 2 * paddingY);
    return { x, y, val };
  });

  const linePath = `M ${points.map((p) => `${p.x},${p.y}`).join(" L ")}`;
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1]!.x},${height - paddingY} L ${points[0]!.x},${height - paddingY} Z`
      : "";

  const formatHours = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  const totalTimeStr = data ? formatHours(data.total) : "0m";

  return (
    <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 shadow-sm relative h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 z-10">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Focus Time</h2>
          <Info className="h-3.5 w-3.5 text-zinc-600" />
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative flex-1 -mx-2 mt-4">
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="overflow-visible"
        >
          <defs>
            <linearGradient id="neonGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(168, 85, 247, 0.4)" />
              <stop offset="100%" stopColor="rgba(168, 85, 247, 0)" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Y Axis Grid Lines */}
          {[0, 1, 2, 3, 4, 5].map((val) => {
            const y = height - paddingY - (val / 5) * (height - 2 * paddingY);
            return (
              <g key={val}>
                <text x="0" y={y + 4} fill="#52525b" fontSize="11" fontWeight="500">
                  {val === 5 ? `${Math.ceil(maxVal)}h` : `${Math.round(val * (maxVal / 5))}h`}
                </text>
                <line
                  x1={paddingX - 10}
                  y1={y}
                  x2={width}
                  y2={y}
                  stroke="#27272a"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              </g>
            );
          })}

          {/* Area Fill */}
          <path d={areaPath} fill="url(#neonGlow)" />

          {/* Neon Line */}
          <path d={linePath} fill="none" stroke="#a855f7" strokeWidth="3" filter="url(#glow)" />
          <path d={linePath} fill="none" stroke="#d8b4fe" strokeWidth="1.5" />

          {/* Data Points */}
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="6" fill="#a855f7" filter="url(#glow)" />
              <circle cx={p.x} cy={p.y} r="4" fill="#ffffff" stroke="#a855f7" strokeWidth="2" />
              <text
                x={p.x}
                y={p.y - 15}
                fill="#d4d4d8"
                fontSize="11"
                fontWeight="600"
                textAnchor="middle"
              >
                {Math.floor(p.val)}h {Math.round((p.val % 1) * 60)}m
              </text>
            </g>
          ))}

          {/* X Axis Labels */}
          {chartData.map((d, i) => (
            <text
              key={i}
              x={points[i]?.x ?? 0}
              y={height}
              fill="#71717a"
              fontSize="11"
              fontWeight="500"
              textAnchor="middle"
            >
              {d.day}
            </text>
          ))}
        </svg>
      </div>

      {/* Footer Metrics */}
      <div className="mt-4 grid grid-cols-4 gap-4 border-t border-zinc-800/50 pt-4">
        <div className="flex flex-col">
          <span className="text-[10px] text-zinc-500">Total</span>
          <span className="text-lg font-bold text-white mt-0.5">{totalTimeStr}</span>
        </div>
        <div className="flex flex-col border-l border-zinc-800/50 pl-4">
          <span className="text-[10px] text-zinc-500">Average / day</span>
          <span className="text-lg font-bold text-white mt-0.5">
            {data ? formatHours(data.total / chartData.length) : "-"}
          </span>
        </div>
        <div className="flex flex-col border-l border-zinc-800/50 pl-4">
          <span className="text-[10px] text-zinc-500">Longest session</span>
          <span className="text-lg font-bold text-white mt-0.5">-</span>
        </div>
        <div className="flex flex-col border-l border-zinc-800/50 pl-4">
          <span className="text-[10px] text-zinc-500">Focus quality</span>
          <span className="text-lg font-bold text-white mt-0.5">-</span>
        </div>
      </div>
    </div>
  );
}
