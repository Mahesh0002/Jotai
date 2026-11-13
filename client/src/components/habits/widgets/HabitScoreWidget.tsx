import React from "react";
import { Card } from "@/components/ui/Card";
import { useHabitAnalytics } from "@/hooks/useHabits";
import { TrendingUp, Clock } from "lucide-react";

export function HabitScoreWidget() {
  const { analytics, isLoading } = useHabitAnalytics();

  if (isLoading || !analytics) {
    return (
      <Card className="flex flex-col p-5 bg-[#0e0e11] border-zinc-800/50 animate-pulse h-full">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">
          Habit Score
        </h2>
        <div className="flex-1 flex justify-center items-center">
          <div className="w-32 h-32 rounded-full border-4 border-zinc-800"></div>
        </div>
      </Card>
    );
  }

  const score = analytics.score || 0;

  // SVG Arc Math
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  // 240 degree arc (2/3 of circle)
  const arcLength = (240 / 360) * circumference;
  // Gap is 120 degrees
  const gapLength = circumference - arcLength;
  // Progress length based on score (0-100)
  const progressLength = (score / 100) * arcLength;

  return (
    <Card className="flex flex-col p-5 bg-[#0e0e11] border-zinc-800/50 relative overflow-hidden group h-full shadow-md">
      <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2 z-10">
        Habit Score
      </h2>

      <div className="flex-1 flex flex-col items-center justify-center relative">
        {/* SVG Circular Arc */}
        <div className="relative w-[150px] h-[150px] flex items-center justify-center -mt-2">
          <svg
            className="w-full h-full transform"
            style={{ transform: "rotate(150deg)" }}
            viewBox="0 0 140 140"
          >
            <defs>
              <linearGradient id="score-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" /> {/* purple-500 */}
                <stop offset="100%" stopColor="#3b82f6" /> {/* blue-500 */}
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background track */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              stroke="#27272a" /* zinc-800 */
              strokeWidth="10"
              fill="transparent"
              strokeDasharray={`${arcLength} ${gapLength}`}
              strokeLinecap="round"
            />

            {/* Progress track */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              stroke="url(#score-gradient)"
              strokeWidth="10"
              fill="transparent"
              strokeDasharray={`${progressLength} ${circumference}`}
              strokeLinecap="round"
              filter="url(#glow)"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
            <div className="text-5xl font-black tracking-tighter text-white">{score}</div>
            <div className="text-[11px] font-medium text-zinc-500 mt-0.5">/100</div>
          </div>
        </div>

        {/* Stats Below Ring */}
        <div className="flex flex-col items-center gap-2 z-10 mt-2">
          <div className="flex items-center gap-1.5 text-emerald-500 font-bold text-xs">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>
              {analytics.scoreTrend}% <span className="text-zinc-400 font-medium">this week</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-400 text-xs mt-0.5">
            <Clock className="h-3.5 w-3.5 text-zinc-500" />
            <span>
              {analytics.streaks.length > 0 ? analytics.streaks[0].currentStreak : 0} day
              consistency
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
