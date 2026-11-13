import { Info, Award } from "lucide-react";

export function FocusQualityCard() {
  // SVG Ring for Quality Score
  const radius = 35;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const score = 92;
  const progress = score / 100;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-1.5">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            Focus Quality
          </h2>
          <Info className="h-3 w-3 text-zinc-600" />
        </div>
        <button className="text-[10px] font-medium text-purple-400 hover:text-purple-300 transition-colors">
          Details
        </button>
      </div>

      <div className="flex items-center gap-6 flex-1">
        {/* Score Ring */}
        <div className="relative flex items-center justify-center w-24 h-24 shrink-0">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 86 86">
            <circle
              cx="43"
              cy="43"
              r={radius}
              className="stroke-zinc-800 fill-transparent"
              strokeWidth={strokeWidth}
            />
            <circle
              cx="43"
              cy="43"
              r={radius}
              className="stroke-purple-500 fill-transparent"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-bold text-white leading-none tracking-tighter">
              {score}
            </span>
            <span className="text-[9px] text-zinc-500 font-medium">/100</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-col gap-3 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Award className="h-4 w-4 text-purple-400" />
            <span className="text-xs font-bold text-white">Excellent Focus Session</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-400">Interruptions</span>
            <span className="text-[11px] font-bold text-white">1</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-400">Distractions</span>
            <span className="text-[11px] font-bold text-white">0</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-400">Task Completion</span>
            <span className="text-[11px] font-bold text-white">55%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
