import React, { useState } from "react";
import { ChevronLeft, ChevronDown, Check } from "lucide-react";
import { Habit } from "@/lib/api";
import clsx from "clsx";

interface HabitCalendarTabProps {
  habits: Habit[];
  currentDate: Date;
}

export function HabitCalendarTab({ habits, currentDate }: HabitCalendarTabProps) {
  const [selectedDay, setSelectedDay] = useState<number>(31);

  // Generating a standard 35-cell calendar grid for visual mockup purposes
  // 5 rows of 7 days.
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);
  const paddingBefore = [27, 28, 29, 30]; // previous month
  const calendarCells = [...paddingBefore, ...daysInMonth];

  // Helper to generate random status dots for realism
  const generateMockStatuses = (dayNum: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return [];

    // Make day 31 match the screenshot (2 complete, 1 hollow)
    if (dayNum === 31) {
      return ["completed", "completed", "not_scheduled", "not_scheduled"];
    }

    const count = Math.floor(Math.random() * 4) + 1;
    const statuses = [];
    for (let i = 0; i < count; i++) {
      const rand = Math.random();
      if (rand < 0.6) statuses.push("completed");
      else if (rand < 0.8)
        statuses.push("partial"); // orange
      else if (rand < 0.9)
        statuses.push("missed"); // red
      else statuses.push("not_scheduled");
    }
    return statuses;
  };

  return (
    <div className="flex flex-1 overflow-hidden bg-[#0e0e11]">
      {/* Main Calendar Area */}
      <div className="flex-1 flex flex-col p-8 overflow-y-auto custom-scrollbar">
        <div className="max-w-5xl w-full mx-auto">
          {/* Header Controls */}
          <div className="flex justify-between items-center mb-6">
            <button className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-md text-xs font-bold text-zinc-300 hover:text-white transition-colors">
              <ChevronLeft className="h-4 w-4" /> August 2026{" "}
              <ChevronDown className="h-4 w-4 ml-1 opacity-50" />
            </button>

            <div className="flex bg-zinc-900/50 border border-zinc-800/80 rounded-md p-1">
              <button className="px-4 py-1 text-xs font-bold text-white bg-purple-600/20 rounded shadow-[inset_0_0_12px_rgba(168,85,247,0.2)]">
                Month
              </button>
              <button className="px-4 py-1 text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors">
                Week
              </button>
              <button className="px-4 py-1 text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors">
                List
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="border border-zinc-800/50 rounded-xl overflow-hidden bg-zinc-950/30">
            {/* Days of week */}
            <div className="grid grid-cols-7 border-b border-zinc-800/50 text-center text-xs font-medium text-zinc-500 py-3">
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
              <div>Sun</div>
            </div>

            {/* Grid Cells */}
            <div className="grid grid-cols-7 grid-rows-5 h-[480px]">
              {calendarCells.map((dayNum, idx) => {
                const isCurrentMonth = idx >= paddingBefore.length;
                const isSelected = isCurrentMonth && dayNum === selectedDay;
                const statuses = generateMockStatuses(dayNum, isCurrentMonth);

                return (
                  <div
                    key={idx}
                    onClick={() => isCurrentMonth && setSelectedDay(dayNum)}
                    className={clsx(
                      "p-3 border-r border-b border-zinc-800/20 transition-all cursor-pointer flex flex-col gap-2",
                      isSelected
                        ? "bg-purple-900/10 border-2 border-purple-500 z-10 scale-[1.02] shadow-2xl rounded-md"
                        : "hover:bg-zinc-900/30",
                    )}
                  >
                    <span
                      className={clsx(
                        "text-sm font-medium",
                        isCurrentMonth ? "text-zinc-300" : "text-zinc-600",
                      )}
                    >
                      {dayNum}
                    </span>

                    <div className="flex flex-wrap gap-1.5 mt-auto">
                      {statuses.map((status, i) => (
                        <div
                          key={i}
                          className={clsx(
                            "w-2.5 h-2.5 rounded-full flex items-center justify-center border",
                            status === "completed" && "bg-emerald-500 border-emerald-500",
                            status === "partial" && "bg-transparent border-amber-500",
                            status === "missed" && "bg-transparent border-red-500",
                            status === "not_scheduled" && "bg-transparent border-zinc-700",
                          )}
                        >
                          {status === "completed" && (
                            <Check className="w-[6px] h-[6px] text-zinc-950 stroke-[4]" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex justify-center items-center gap-6 mt-6 text-[11px] font-medium text-zinc-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 flex items-center justify-center">
                <Check className="w-2 h-2 text-zinc-950 stroke-[4]" />
              </div>{" "}
              Completed
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border border-amber-500" /> Partial
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border border-red-500" /> Missed
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border border-zinc-600" /> Not Scheduled
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Daily Detail */}
      <div className="w-80 border-l border-zinc-900 bg-[#0c0c0f] p-6 flex flex-col shrink-0">
        <h3 className="text-white font-medium mb-8">Monday, {selectedDay} Aug</h3>

        {/* Circular Progress */}
        <div className="flex flex-col items-center mb-8 relative">
          <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" stroke="#27272a" strokeWidth="6" fill="transparent" />
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="#10b981"
              strokeWidth="6"
              fill="transparent"
              strokeDasharray="282.7"
              strokeDashoffset="56.5"
              strokeLinecap="round"
              className="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-2xl font-bold text-white tracking-tight">
              4 <span className="text-zinc-500 font-medium text-lg">/ 5</span>
            </div>
            <div className="text-[10px] text-zinc-400 mt-1">Completed</div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-col gap-1.5 mb-10 text-[11px] font-medium">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <span className="text-emerald-500 font-bold text-xs">80%</span> Completion
          </div>
          <div className="flex items-center gap-1.5 text-zinc-400">
            <span className="text-emerald-500 font-bold text-xs">+45 XP</span> Earned
          </div>
        </div>

        {/* Habits List */}
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">
          Habits For This Day
        </h4>

        <div className="flex flex-col gap-4 flex-1">
          {habits.slice(0, 5).map((habit, i) => {
            const isCompleted = i < 2; // Make first two completed

            return (
              <div key={habit._id} className="flex justify-between items-center group">
                <div className="flex items-center gap-3">
                  <div className="text-base">{habit.icon}</div>
                  <span
                    className={clsx(
                      "text-xs font-bold",
                      isCompleted ? "text-zinc-200" : "text-zinc-400",
                    )}
                  >
                    {habit.name}
                  </span>
                </div>
                <div
                  className={clsx(
                    "w-4 h-4 rounded-full flex items-center justify-center border transition-colors",
                    isCompleted
                      ? "bg-emerald-500 border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                      : "border-zinc-700 bg-transparent",
                  )}
                >
                  {isCompleted && <Check className="w-2.5 h-2.5 text-zinc-950 stroke-[4]" />}
                </div>
              </div>
            );
          })}
        </div>

        <button className="text-[11px] font-medium text-purple-400 hover:text-purple-300 mt-6 text-left">
          Edit Day
        </button>
      </div>
    </div>
  );
}
