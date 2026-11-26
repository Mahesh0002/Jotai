import { Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AiObservationCard() {
  const xLabels = ["6 AM", "9 AM", "12 PM", "3 PM", "6 PM", "9 PM"];
  const yLabels = ["Low", "Medium", "High"];

  // Data points mimicking the bell curve in the morning
  // Scale 0 to 100 for simplicity
  const data = [20, 30, 85, 95, 80, 50, 40, 60, 45, 30, 25];

  // SVG dimensions
  const width = 400;
  const height = 150;
  const paddingX = 40;
  const paddingY = 20;

  const points = data.map((val, i) => {
    const x = paddingX + (i * (width - 2 * paddingX)) / (data.length - 1);
    const y = height - paddingY - (val / 100) * (height - 2 * paddingY);
    return { x, y };
  });

  // Create smooth bezier curve path
  const linePath = points.reduce((acc, point, i, a) => {
    if (i === 0) return `M ${point.x},${point.y}`;
    const previous = a[i - 1]!;
    const cx1 = previous.x + (point.x - previous.x) / 3;
    const cy1 = previous.y;
    const cx2 = point.x - (point.x - previous.x) / 3;
    const cy2 = point.y;
    return `${acc} C ${cx1},${cy1} ${cx2},${cy2} ${point.x},${point.y}`;
  }, "");

  const lastPoint = points[points.length - 1]!;
  const firstPoint = points[0]!;
  const areaPath = `${linePath} L ${lastPoint.x},${height - paddingY} L ${firstPoint.x},${height - paddingY} Z`;

  // Find the peak for the floating pill
  const peak = points[3] ?? firstPoint;

  return (
    <div className="flex rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 shadow-sm relative h-[280px]">
      {/* Left Text Column */}
      <div className="flex w-1/3 flex-col justify-between pr-6">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              <Sun className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
              AI Observation
            </span>
          </div>

          <h2 className="text-xl font-medium leading-tight text-white mb-3">
            You focus 34% better in the mornings.
          </h2>
          <p className="text-[11px] leading-relaxed text-zinc-400">
            Your deep work quality is highest between 9:30 AM and 12:10 PM.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button className="h-8 bg-purple-600 px-4 text-xs font-medium hover:bg-purple-500 text-white shadow-glow">
            View details
          </Button>
          <Button
            variant="outline"
            className="h-8 border-zinc-700 bg-transparent px-4 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            Apply to schedule
          </Button>
        </div>
      </div>

      {/* Right Chart Column */}
      <div className="flex flex-1 items-center border-l border-zinc-800/50 pl-6">
        {/* SVG Area */}
        <div className="relative flex-1 h-full flex flex-col justify-center">
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            className="overflow-visible"
          >
            <defs>
              <linearGradient id="purpleGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(168, 85, 247, 0.3)" />
                <stop offset="100%" stopColor="rgba(168, 85, 247, 0)" />
              </linearGradient>
              <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Y Axis Labels */}
            {yLabels.map((lbl, i) => {
              const y = height - paddingY - (i * (height - 2 * paddingY)) / 2;
              return (
                <text key={lbl} x="0" y={y + 4} fill="#52525b" fontSize="10" fontWeight="500">
                  {lbl}
                </text>
              );
            })}

            {/* Grid lines */}
            {[0, 1, 2].map((i) => {
              const y = height - paddingY - (i * (height - 2 * paddingY)) / 2;
              return (
                <line
                  key={i}
                  x1={paddingX - 10}
                  y1={y}
                  x2={width}
                  y2={y}
                  stroke="#27272a"
                  strokeWidth="1"
                />
              );
            })}

            {/* Area Fill */}
            <path d={areaPath} fill="url(#purpleGlow)" />

            {/* Neon Line */}
            <path
              d={linePath}
              fill="none"
              stroke="#a855f7"
              strokeWidth="2.5"
              filter="url(#glowEffect)"
            />
            <path d={linePath} fill="none" stroke="#d8b4fe" strokeWidth="1" />

            {/* X Axis Labels */}
            {xLabels.map((lbl, i) => {
              const x = paddingX + (i * (width - 2 * paddingX)) / (xLabels.length - 1);
              return (
                <text
                  key={lbl}
                  x={x}
                  y={height}
                  fill="#52525b"
                  fontSize="10"
                  fontWeight="500"
                  textAnchor="middle"
                >
                  {lbl}
                </text>
              );
            })}

            {/* Highlight Node */}
            <circle cx={peak.x} cy={peak.y} r="6" fill="#a855f7" filter="url(#glowEffect)" />
            <circle cx={peak.x} cy={peak.y} r="3" fill="#ffffff" />

            {/* Range Line */}
            <line
              x1={peak.x - 30}
              y1={peak.y}
              x2={peak.x + 40}
              y2={peak.y}
              stroke="#a855f7"
              strokeWidth="2"
              strokeDasharray="2 2"
            />
          </svg>

          {/* Floating Pill */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 rounded bg-purple-500 px-3 py-1 text-[10px] font-bold text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]">
            9:30 AM — 12:10 PM
          </div>
        </div>

        {/* Right Stat */}
        <div className="flex w-24 flex-col items-end justify-center pl-4">
          <span className="text-[9px] font-medium text-zinc-500 mb-1">Focus Quality</span>
          <span className="text-3xl font-light text-emerald-500 leading-none shadow-glow">
            +34%
          </span>
          <span className="text-[9px] font-medium text-zinc-500 mt-1">vs daily average</span>
        </div>
      </div>
    </div>
  );
}
