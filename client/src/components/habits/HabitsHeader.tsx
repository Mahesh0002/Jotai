import { Plus, Calendar, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HabitsHeader() {
  const tabs = ["Overview", "Calendar", "Analytics", "Manage Habits"];

  return (
    <div className="flex flex-col border-b border-zinc-800 bg-zinc-950 px-8 pt-8 shrink-0 pb-0">
      {/* Title & Actions */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white mb-1">Habits</h1>
          <p className="text-sm text-zinc-400">
            Build consistency. Understand what actually helps you.
          </p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-500 text-white px-4 h-9 shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all">
          <Plus className="mr-2 h-4 w-4" /> Add Habit
        </Button>
      </div>

      {/* Tabs & Controls */}
      <div className="flex items-center justify-between">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-8">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              className={`pb-4 text-sm font-medium transition-colors relative ${i === 0 ? "text-purple-400" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              {tab}
              {i === 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
              )}
            </button>
          ))}
        </div>

        {/* Date Controls */}
        <div className="flex items-center gap-2 pb-3">
          <Button
            variant="outline"
            className="h-8 border-zinc-800 bg-zinc-900/50 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white px-3"
          >
            <Calendar className="mr-2 h-3.5 w-3.5 text-zinc-500" />
            Today, 24 May
            <ChevronDown className="ml-2 h-3.5 w-3.5 text-zinc-500" />
          </Button>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
