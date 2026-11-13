import { Search, Plus, Sparkles, Command } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TasksHeaderProps {
  onNewTask?: () => void;
}

export function TasksHeader({ onNewTask }: TasksHeaderProps) {
  return (
    <div className="flex w-full items-center justify-between border-b border-zinc-800 bg-zinc-950 p-6 shrink-0">
      <div className="flex flex-col">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Tasks</h1>
        <p className="text-xs text-zinc-400 mt-1">Everything you need to get done.</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search tasks..."
            className="h-10 w-64 rounded-md border border-zinc-800 bg-zinc-900/50 pl-9 pr-10 text-sm text-white placeholder:text-zinc-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all"
          />
          <div className="absolute right-2 flex items-center gap-0.5 text-zinc-500">
            <Command className="h-3 w-3" />
            <span className="text-[10px] font-medium">K</span>
          </div>
        </div>

        <Button
          onClick={onNewTask}
          className="h-10 gap-2 rounded-md bg-purple-600 px-4 text-sm font-medium text-white hover:bg-purple-500 shadow-glow"
        >
          <Plus className="h-4 w-4" /> New task
        </Button>

        <Button className="h-10 gap-2 rounded-md border border-purple-500/30 bg-purple-500/10 px-4 text-sm font-medium text-purple-300 hover:bg-purple-500/20">
          <Sparkles className="h-4 w-4" /> AI Organize
        </Button>
      </div>
    </div>
  );
}
