import { ChevronDown } from "lucide-react";

export function LevelProgression() {
  const data = [2, 2.5, 3.2, 4.1, 4.8, 5.2, 6.1, 6.7, 7.2, 7.8, 8.0];
  const max = 10;

  const generatePath = () => {
    const width = 800;
    const height = 150;
    const step = width / (data.length - 1);

    let path = `M 0 ${height - (data[0] / max) * height}`;
    for (let i = 1; i < data.length; i++) {
      path += ` L ${i * step} ${height - (data[i] / max) * height}`;
    }
    return path;
  };

  const generateFill = () => {
    const path = generatePath();
    return `${path} L 800 150 L 0 150 Z`;
  };

  return (
    <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 shadow-sm">
      <div className="flex items-start justify-between mb-8">
        <div className="flex flex-col">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
            Level Progression
          </h2>
          <span className="text-[11px] text-zinc-500">Your journey over time</span>
        </div>
        <button className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-[10px] font-medium text-zinc-300 hover:bg-zinc-800">
          Last 90 Days <ChevronDown className="h-3 w-3 text-zinc-500" />
        </button>
      </div>

      <div className="flex mb-4">
        {/* Y-axis */}
        <div className="flex flex-col justify-between items-end h-[150px] pb-[20px] pr-4 text-[9px] font-medium text-zinc-500 shrink-0">
          <span>Level 10</span>
          <span>Level 8</span>
          <span>Level 6</span>
          <span>Level 4</span>
          <span>Level 2</span>
        </div>

        {/* Line Chart */}
        <div className="flex-1 relative h-[170px]">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pb-[20px] pointer-events-none z-0">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="border-t border-zinc-800/30 w-full border-dashed" />
            ))}
          </div>

          <div className="absolute inset-0 pb-[20px] z-10 w-full overflow-visible">
            <svg
              viewBox="0 0 800 150"
              preserveAspectRatio="none"
              className="w-full h-full overflow-visible"
            >
              <defs>
                <linearGradient id="progressionFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(168,85,247,0.3)" />
                  <stop offset="100%" stopColor="rgba(168,85,247,0)" />
                </linearGradient>
                <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              <path d={generateFill()} fill="url(#progressionFill)" className="opacity-50" />

              <path
                d={generatePath()}
                fill="none"
                stroke="#a855f7" // purple-500
                strokeWidth="2.5"
                filter="url(#lineGlow)"
              />

              {data.map((val, i) => (
                <circle
                  key={i}
                  cx={(i * 800) / (data.length - 1)}
                  cy={150 - (val / max) * 150}
                  r={i === data.length - 1 ? "6" : "4"}
                  fill={i === data.length - 1 ? "#d8b4fe" : "#c084fc"} // purple-300 vs purple-400
                  stroke="#18181b" // zinc-900
                  strokeWidth="2"
                />
              ))}
            </svg>

            {/* Tooltip for the last point */}
            <div className="absolute right-0 top-0 -mt-2 bg-zinc-900 border border-zinc-700 rounded-lg p-2 shadow-lg z-20 flex flex-col items-center">
              <span className="text-[10px] font-bold text-white">Level 08</span>
              <span className="text-[9px] text-zinc-400">Aug 24, 2026</span>
            </div>
          </div>

          {/* X-axis */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[9px] font-medium text-zinc-500 z-0 pl-4 pr-4">
            <span>Jun 1</span>
            <span>Jun 15</span>
            <span>Jul 1</span>
            <span>Jul 15</span>
            <span>Aug 1</span>
            <span>Aug 15</span>
          </div>
        </div>
      </div>
    </div>
  );
}
