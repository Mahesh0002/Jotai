import React from "react";
import { ChevronDown, ArrowUp, Zap, Target } from "lucide-react";

export function HabitAnalyticsTab() {
  // High-fidelity mock data to match the UI perfectly
  const sparkline1 = "0,20 10,15 20,25 30,10 40,30 50,20 60,35 70,25 80,40 90,30 100,45";

  return (
    <div className="flex flex-1 overflow-x-hidden bg-[#0e0e11]">
      <div className="flex-1 flex flex-col p-8 overflow-y-auto custom-scrollbar relative">
        <div className="max-w-6xl w-full mx-auto relative pb-20 overflow-x-hidden">
          {/* Header */}
          <div className="flex justify-end items-center mb-6">
            <button className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-md text-xs font-bold text-zinc-300 hover:text-white transition-colors">
              Last 30 Days <ChevronDown className="h-4 w-4 opacity-50" />
            </button>
          </div>

          {/* AI Coach Banner */}
          <div className="mb-6 bg-gradient-to-r from-[#1c122e]/80 to-[#120a1f]/80 backdrop-blur-xl border border-purple-500/30 rounded-xl p-6 shadow-[0_10px_30px_rgba(168,85,247,0.15)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
             {/* decorative background glow */}
             <div className="absolute -right-20 -top-20 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px] pointer-events-none" />
             
            <div className="flex items-start gap-4 z-10">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h2 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-purple-300 mb-1">
                  <Target className="w-3 h-3" /> AI Habit Coach
                </h2>
                <p className="text-sm text-white font-medium mb-1">
                  You are <span className="text-purple-400 font-bold">24% more productive</span> on days you complete <span className="text-purple-400 font-bold">Morning Planning</span> before 9:30 AM.
                </p>
                <p className="text-xs text-zinc-400">
                  Keep it up! This habit has a huge impact on your daily momentum.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 z-10 w-full md:w-auto">
              <button className="w-full sm:w-auto px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all transform hover:scale-105 active:scale-95">
                View Analysis
              </button>
              <button className="w-full sm:w-auto px-5 py-2.5 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-700/50 text-zinc-300 text-xs font-medium rounded-lg transition-colors">
                Apply to Focus Plan
              </button>
            </div>
          </div>

          {/* Row 1: KPI Cards */}
          <div className="grid grid-cols-4 gap-6 mb-6">
            <div className="bg-[#121217] border border-zinc-800/80 rounded-xl p-5 relative overflow-hidden flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
                Completion Rate
              </span>
              <div className="text-3xl font-bold text-white mb-2">84%</div>
              <div className="text-[10px] font-medium text-emerald-500 mb-4">
                ↑ 12% <span className="text-zinc-600">vs previous 30 days</span>
              </div>
              <svg
                className="w-full h-8 mt-auto absolute bottom-0 left-0 right-0 opacity-80"
                preserveAspectRatio="none"
                viewBox="0 0 100 40"
              >
                <polyline fill="none" stroke="#10b981" strokeWidth="2" vectorEffect="non-scaling-stroke" points={sparkline1} />
                <polyline
                  fill="url(#fade-green)"
                  stroke="none"
                  points={`0,40 ${sparkline1} 100,40`}
                />
                <defs>
                  <linearGradient id="fade-green" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="rgba(16,185,129,0.2)" />
                    <stop offset="100%" stopColor="rgba(16,185,129,0)" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div className="bg-[#121217] border border-zinc-800/80 rounded-xl p-5 relative overflow-hidden flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
                Current Streak
              </span>
              <div className="text-3xl font-bold text-white mb-2 flex items-baseline gap-1">
                12 <span className="text-base text-zinc-500 font-medium">days</span>
              </div>
              <div className="text-[10px] font-medium text-zinc-600 mb-4">Best: 28 days</div>
              <svg
                className="w-full h-8 mt-auto absolute bottom-0 left-0 right-0 opacity-80"
                preserveAspectRatio="none"
                viewBox="0 0 100 40"
              >
                <polyline
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                  points="0,35 20,30 40,35 60,25 80,15 100,20"
                />
              </svg>
            </div>

            <div className="bg-[#121217] border border-zinc-800/80 rounded-xl p-5 relative overflow-hidden flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
                Longest Streak
              </span>
              <div className="text-3xl font-bold text-white mb-2 flex items-baseline gap-1">
                28 <span className="text-base text-zinc-500 font-medium">days</span>
              </div>
              <div className="text-[10px] font-medium text-zinc-600 mb-4">
                Achieved on 15 Jul 2026
              </div>
              <svg
                className="w-full h-8 mt-auto absolute bottom-0 left-0 right-0 opacity-80"
                preserveAspectRatio="none"
                viewBox="0 0 100 40"
              >
                <polyline
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                  points="0,20 20,15 40,25 60,20 80,30 100,10"
                />
              </svg>
            </div>

            <div className="bg-[#121217] border border-zinc-800/80 rounded-xl p-5 relative overflow-hidden flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
                Total Habits
              </span>
              <div className="text-3xl font-bold text-white mb-2">24</div>
              <div className="text-[10px] font-medium text-zinc-600 mb-4">Active habits</div>
              <svg
                className="w-full h-8 mt-auto absolute bottom-0 left-0 right-0 opacity-80"
                preserveAspectRatio="none"
                viewBox="0 0 100 40"
              >
                <polyline
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                  points="0,30 25,30 50,35 75,30 100,25"
                />
              </svg>
            </div>
          </div>

          {/* Row 2: Large Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 mb-6">
            {/* Completion Trend Chart */}
            <div className="bg-[#121217] border border-zinc-800/80 rounded-xl p-6 relative flex flex-col">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  Completion Trend
                </h2>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-md text-xs font-medium text-zinc-300 hover:text-white transition-colors">
                  Last 12 Weeks <ChevronDown className="h-4 w-4 opacity-50" />
                </button>
              </div>

              <div className="relative h-48 w-full mt-2">
                <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[9px] text-zinc-600 font-medium">
                  <span>100%</span>
                  <span>75%</span>
                  <span>50%</span>
                  <span>25%</span>
                  <span>0%</span>
                </div>
                <div className="ml-8 absolute inset-0 bottom-6 flex flex-col justify-between">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-full border-b border-zinc-800/40" />
                  ))}
                </div>
                
                {/* Line and Dots */}
                <div className="ml-8 absolute inset-0 bottom-6">
                   <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <polyline
                      fill="none"
                      stroke="#a855f7"
                      strokeWidth="2"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                      className="drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                      points="0,85 9,67 18,39 27,49 36,44 45,33 54,44 64,22 73,22 82,33 91,39 100,27"
                    />
                  </svg>
                  <div className="absolute inset-0 flex justify-between items-end pb-1" style={{ marginLeft: '-1%', marginRight: '-1%' }}>
                     {/* 12 points aligned with W18-W29 */}
                     {[15, 33, 61, 51, 56, 67, 56, 78, 78, 67, 61, 73].map((val, idx) => (
                       <div key={idx} className="relative flex justify-center items-center h-full w-[8.33%]">
                         <div 
                           className="w-2 h-2 rounded-full bg-[#121217] border-2 border-purple-500 absolute z-10"
                           style={{ bottom: `calc(${val}% - 4px)` }}
                         />
                       </div>
                     ))}
                  </div>
                </div>
                <div className="ml-8 absolute bottom-0 left-0 right-0 flex justify-between text-[9px] text-zinc-600 font-medium translate-y-4">
                  {["W18", "W19", "W20", "W21", "W22", "W23", "W24", "W25", "W26", "W27", "W28", "W29"].map(w => (
                    <span key={w} className="text-center w-[8.33%]">{w}</span>
                  ))}
                </div>
              </div>

              <div className="w-full border-b border-zinc-800/60 my-6 mt-8" />

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 text-2xl font-bold text-white mb-1">
                    <div className="w-4 h-4 rounded-full border-[2px] border-emerald-500 flex items-center justify-center">
                      <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                    </div>
                    86%
                  </div>
                  <div className="text-[10px] font-medium text-zinc-500">This Week</div>
                </div>
                
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 text-2xl font-bold text-white mb-1">
                    <ArrowUp className="w-4 h-4 text-blue-500 rotate-45" />
                    79%
                  </div>
                  <div className="text-[10px] font-medium text-zinc-500">Last Week</div>
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 text-2xl font-bold text-emerald-500 mb-1">
                    <ArrowUp className="w-4 h-4 rotate-45" />
                    +7%
                  </div>
                  <div className="text-[10px] font-medium text-zinc-500">Change</div>
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 text-2xl font-bold text-white mb-1">
                    <Target className="w-4 h-4 text-purple-500" />
                    24
                  </div>
                  <div className="text-[10px] font-medium text-zinc-500">Total Habits</div>
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 text-2xl font-bold text-white mb-1">
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                    1,240
                  </div>
                  <div className="text-[10px] font-medium text-zinc-500">Total XP</div>
                </div>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="bg-[#121217] border border-zinc-800/80 rounded-xl p-6 relative">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-8">
                Completion by Day of Week
              </h2>
              <div className="relative h-48 w-full mt-4">
                <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[9px] text-zinc-600 font-medium">
                  <span>100%</span>
                  <span>75%</span>
                  <span>50%</span>
                  <span>25%</span>
                  <span>0%</span>
                </div>
                <div className="ml-8 absolute inset-0 bottom-6 flex flex-col justify-between">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-full border-b border-zinc-800/40" />
                  ))}
                </div>
                <div className="ml-8 absolute inset-0 bottom-6 flex items-end justify-between px-2">
                  {[80, 85, 82, 78, 85, 80, 70].map((h, i) => (
                    <div
                      key={i}
                      className="w-8 bg-gradient-to-t from-purple-900 to-purple-500 rounded-t-sm shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <div className="ml-8 absolute bottom-0 left-0 right-0 flex justify-between px-2 text-[9px] text-zinc-600 font-medium">
                  <span className="w-8 text-center">Mon</span>
                  <span className="w-8 text-center">Tue</span>
                  <span className="w-8 text-center">Wed</span>
                  <span className="w-8 text-center">Thu</span>
                  <span className="w-8 text-center">Fri</span>
                  <span className="w-8 text-center">Sat</span>
                  <span className="w-8 text-center">Sun</span>
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Smaller Widgets */}
          <div className="grid grid-cols-4 gap-6">
            {/* Donut Chart */}
            <div className="bg-[#121217] border border-zinc-800/80 rounded-xl p-5">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-6">
                Habits by Category
              </h2>
              <div className="flex items-center gap-6">
                <div className="relative w-24 h-24">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#f59e0b"
                      strokeWidth="15"
                      fill="none"
                      strokeDasharray="251"
                      strokeDashoffset="0"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#10b981"
                      strokeWidth="15"
                      fill="none"
                      strokeDasharray="251"
                      strokeDashoffset="25"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#3b82f6"
                      strokeWidth="15"
                      fill="none"
                      strokeDasharray="251"
                      strokeDashoffset="125"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#a855f7"
                      strokeWidth="15"
                      fill="none"
                      strokeDasharray="251"
                      strokeDashoffset="188"
                    />
                  </svg>
                  <div className="absolute inset-0 rounded-full shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] pointer-events-none" />
                </div>
                <div className="flex flex-col gap-2 flex-1 text-[11px] font-medium">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5 text-zinc-300">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" /> Health
                    </div>
                    <span>40%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5 text-zinc-300">
                      <div className="w-2 h-2 rounded-full bg-blue-500" /> Learning
                    </div>
                    <span>25%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5 text-zinc-300">
                      <div className="w-2 h-2 rounded-full bg-purple-500" /> Productivity
                    </div>
                    <span>25%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5 text-zinc-300">
                      <div className="w-2 h-2 rounded-full bg-amber-500" /> Mindset
                    </div>
                    <span>10%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Best Time of Day */}
            <div className="bg-[#121217] border border-zinc-800/80 rounded-xl p-5 relative overflow-hidden">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">
                Best Time of Day
              </h2>
              <div className="text-xl font-bold text-white mb-1">9:00 AM - 11:00 AM</div>
              <div className="text-[10px] text-zinc-500 font-medium">
                Your highest completion rate
              </div>
              <svg
                className="w-full h-16 absolute bottom-0 left-0 right-0 opacity-80"
                preserveAspectRatio="none"
                viewBox="0 0 100 40"
              >
                <path
                  d="M0,20 Q10,10 20,20 T40,20 T60,20 T80,20 T100,20 L100,40 L0,40 Z"
                  fill="rgba(16,185,129,0.1)"
                  stroke="none"
                />
                <path
                  d="M0,20 Q10,10 20,20 T40,20 T60,20 T80,20 T100,20"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  className="drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]"
                />
              </svg>
            </div>

            {/* Most Consistent */}
            <div className="bg-[#121217] border border-zinc-800/80 rounded-xl p-5">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">
                Most Consistent Habits
              </h2>
              <div className="flex flex-col gap-3.5">
                {[
                  { name: "Morning Planning", val: 98, icon: "☕" },
                  { name: "Exercise", val: 94, icon: "🏃‍♂️" },
                  { name: "Reading", val: 88, icon: "📚" },
                ].map((h) => (
                  <div key={h.name} className="flex items-center gap-3">
                    <span className="text-sm opacity-80 w-5 text-center">{h.icon}</span>
                    <span className="text-xs font-bold text-zinc-300 flex-1 truncate">
                      {h.name}
                    </span>
                    <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden shrink-0">
                      <div
                        className="h-full bg-emerald-500 rounded-full shadow-[0_0_5px_rgba(16,185,129,0.5)]"
                        style={{ width: `${h.val}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-500 w-6 text-right">
                      {h.val}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Needs Attention */}
            <div className="bg-[#121217] border border-zinc-800/80 rounded-xl p-5">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">
                Needs Attention
              </h2>
              <div className="flex flex-col gap-3.5">
                {[
                  { name: "Meditation", val: 40, icon: "🧘" },
                  { name: "Journaling", val: 55, icon: "📓" },
                  { name: "Stretching", val: 60, icon: "🤸" },
                ].map((h) => (
                  <div key={h.name} className="flex items-center gap-3">
                    <span className="text-sm opacity-80 w-5 text-center">{h.icon}</span>
                    <span className="text-xs font-bold text-zinc-300 flex-1 truncate">
                      {h.name}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-400">{h.val}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Removed absolute AI Coach Overlay */}
        </div>
      </div>
    </div>
  );
}
