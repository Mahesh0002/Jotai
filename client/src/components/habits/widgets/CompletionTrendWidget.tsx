import React from "react";
import { Card } from "@/components/ui/Card";
import { ChevronDown, ArrowRight, TrendingUp, CheckCircle2, Zap, Target } from "lucide-react";
import { useHabitAnalytics } from "@/hooks/useHabits";

export function CompletionTrendWidget() {
  const { analytics } = useHabitAnalytics();

  // Mock data for the 12-week chart
  const weeks = [
    "W18",
    "W19",
    "W20",
    "W21",
    "W22",
    "W23",
    "W24",
    "W25",
    "W26",
    "W27",
    "W28",
    "W29",
  ];
  const values = [20, 35, 60, 50, 55, 65, 55, 75, 75, 65, 60, 70]; // Representing percentage heights on SVG

  return (
    <Card className="flex flex-col p-6 bg-zinc-950 border-zinc-800/80 mt-6 relative overflow-hidden">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          Completion Trend
        </h2>
        <button className="flex items-center gap-1 text-[10px] text-zinc-400 bg-zinc-900 px-2 py-1 rounded border border-zinc-800 hover:text-white transition-colors">
          Last 12 Weeks <ChevronDown className="h-3 w-3" />
        </button>
      </div>

      {/* Line Chart Area (CSS/SVG mock) */}
      <div className="relative h-32 w-full mb-8">
        {/* Y-Axis Labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[9px] text-zinc-600 font-medium">
          <span>100%</span>
          <span>75%</span>
          <span>50%</span>
          <span>25%</span>
          <span>0%</span>
        </div>

        {/* Chart SVG */}
        <div className="ml-8 h-full relative">
          {/* Horizontal Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-full border-b border-zinc-800/50 border-dashed" />
            ))}
          </div>

          <svg
            className="absolute inset-0 h-full w-full overflow-visible"
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
          >
            <polyline
              fill="none"
              stroke="#a855f7"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              points={values.map((v, i) => `${(i / 11) * 100},${100 - v}`).join(" ")}
            />
          </svg>
          
          {/* HTML Dots to perfectly preserve circular aspect ratio */}
          <div className="absolute inset-0 pointer-events-none">
            {values.map((v, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-purple-500 z-10 transform -translate-x-1/2 translate-y-1/2"
                style={{ left: `${(i / 11) * 100}%`, bottom: `${v}%` }}
              />
            ))}
          </div>
        </div>

        {/* X-Axis Labels */}
        <div className="ml-8 absolute -bottom-5 left-0 right-0 flex justify-between text-[9px] text-zinc-600 font-medium">
          {weeks.map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="flex justify-between items-center mt-6 pt-6 border-t border-zinc-800/50 flex-wrap gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-white mb-1">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-xl font-bold">86%</span>
          </div>
          <span className="text-[10px] text-zinc-500 ml-5.5">This Week</span>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-white mb-1">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <span className="text-xl font-bold">79%</span>
          </div>
          <span className="text-[10px] text-zinc-500 ml-5.5">Last Week</span>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-emerald-500 mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xl font-bold">+7%</span>
          </div>
          <span className="text-[10px] text-zinc-500 ml-5.5">Change</span>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-white mb-1">
            <Target className="h-4 w-4 text-purple-500" />
            <span className="text-xl font-bold">24</span>
          </div>
          <span className="text-[10px] text-zinc-500 ml-5.5">Total Habits</span>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-white mb-1">
            <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
            <span className="text-xl font-bold">1,240</span>
          </div>
          <span className="text-[10px] text-zinc-500 ml-5.5">Total XP</span>
        </div>
      </div>

      {/* Insight Banner */}
      <div className="mt-8 bg-zinc-900/50 rounded-lg p-4 border border-zinc-800/50 flex justify-between items-center">
        <div className="flex gap-3">
          <div className="h-8 w-8 rounded bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-xs text-zinc-400 font-bold tracking-wide uppercase">
              <span className="text-purple-400">Insight</span> Consistency compounds over time.
            </span>
            <span className="text-[11px] text-zinc-400 mt-0.5">
              You completed 86% of your habits this week. Keep the momentum going! 🔥
            </span>
          </div>
        </div>
        <button className="flex items-center text-[10px] text-white hover:text-purple-300 transition-colors bg-zinc-800/50 px-3 py-1.5 rounded-md border border-zinc-700">
          View All Insights <ArrowRight className="ml-1 h-3 w-3" />
        </button>
      </div>
    </Card>
  );
}
