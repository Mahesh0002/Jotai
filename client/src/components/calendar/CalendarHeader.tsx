"use client";

import { ChevronLeft, ChevronRight, Search, Plus, Sparkles, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addDays, addWeeks, addMonths, formatMonthYear } from "@/lib/date-utils";

type CalendarHeaderProps = {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  activeView: "Day" | "Week" | "Month";
  setActiveView: (view: "Day" | "Week" | "Month") => void;
};

export function CalendarHeader({
  currentDate,
  setCurrentDate,
  activeView,
  setActiveView,
}: CalendarHeaderProps) {
  const handlePrevious = () => {
    if (activeView === "Day") setCurrentDate(addDays(currentDate, -1));
    else if (activeView === "Week") setCurrentDate(addWeeks(currentDate, -1));
    else setCurrentDate(addMonths(currentDate, -1));
  };

  const handleNext = () => {
    if (activeView === "Day") setCurrentDate(addDays(currentDate, 1));
    else if (activeView === "Week") setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="flex w-full flex-col bg-zinc-950 px-6 py-4">
      {/* Title */}
      <h1 className="mb-4 text-2xl font-semibold tracking-tight text-white">Calendar</h1>

      {/* Toolbar */}
      <div className="flex w-full items-center justify-between">
        {/* Left Navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleToday}
            className="h-9 rounded-md border-zinc-800 bg-zinc-900 px-4 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            Today
          </Button>

          <div className="flex h-9 items-center rounded-md border border-zinc-800 bg-zinc-900 overflow-hidden">
            <button
              onClick={handlePrevious}
              className="flex h-full px-2.5 items-center justify-center text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors border-r border-zinc-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNext}
              className="flex h-full px-2.5 items-center justify-center text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button className="ml-2 flex h-9 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-zinc-300 hover:text-white">
            {formatMonthYear(currentDate)}
            <ChevronRight className="h-3.5 w-3.5 rotate-90 text-zinc-500" />
          </button>
        </div>

        {/* Center Actions */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search events, tasks..."
              className="h-9 w-64 rounded-md border border-zinc-800 bg-zinc-900/50 pl-9 pr-10 text-sm text-white placeholder:text-zinc-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all"
            />
            <div className="absolute right-2 flex items-center gap-0.5 text-zinc-500">
              <Command className="h-3 w-3" />
              <span className="text-[10px] font-medium">K</span>
            </div>
          </div>

          <Button 
            className="h-9 gap-2 rounded-md bg-purple-600 px-4 text-sm font-medium text-white hover:bg-purple-500 shadow-glow"
            onClick={() => alert("New Event modal coming soon!")}
          >
            <Plus className="h-4 w-4" /> New event
          </Button>

          <Button 
            className="h-9 gap-2 rounded-md border border-purple-500/30 bg-purple-500/10 px-4 text-sm font-medium text-purple-300 hover:bg-purple-500/20"
            onClick={() => alert("AI Schedule feature coming soon!")}
          >
            <Sparkles className="h-4 w-4" /> AI Schedule
          </Button>
        </div>

        {/* Right View Switcher */}
        <div className="flex h-9 items-center rounded-md border border-zinc-800 bg-zinc-900/50 p-1">
          {(["Day", "Week", "Month"] as const).map((view) => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={`rounded px-4 py-1.5 text-xs font-medium transition-colors ${
                activeView === view
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {view}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
