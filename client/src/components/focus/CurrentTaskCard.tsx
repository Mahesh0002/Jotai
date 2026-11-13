import { useState } from "react";
import {
  CheckCircle2,
  Calendar,
  List,
  Flag,
  Link2,
  MoreHorizontal,
  Check,
  Search,
} from "lucide-react";
import { useFocus } from "@/contexts/FocusContext";
import { useQuery } from "@tanstack/react-query";
import { tasksApi, Task } from "@/lib/api";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

export function CurrentTaskCard() {
  const { currentTask, setCurrentTask, timerState } = useFocus();
  const [search, setSearch] = useState("");

  // Fetch tasks for the selector
  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => tasksApi.getAll(),
  });

  const filteredTasks = tasks.filter(
    (t) => t.status !== "completed" && t.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 shadow-sm min-h-[260px] relative">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
          Current Task
        </h2>

        {/* Task Selector Dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              disabled={timerState === "running" || timerState === "paused"}
              className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed outline-none"
            >
              Change
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              className="w-64 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 p-2 animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-2 max-h-80"
            >
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-md text-xs text-zinc-300 focus:outline-none focus:border-purple-500/50"
                  autoFocus
                />
              </div>

              <div className="overflow-y-auto custom-scrollbar flex-1 -mx-1 px-1">
                {filteredTasks.length === 0 ? (
                  <div className="py-4 text-center text-xs text-zinc-500">No tasks found.</div>
                ) : (
                  filteredTasks.map((task) => (
                    <DropdownMenu.Item
                      key={task._id}
                      onClick={() => {
                        setCurrentTask(task);
                        setSearch("");
                      }}
                      className="px-3 py-2.5 flex flex-col gap-1 rounded-md cursor-pointer outline-none hover:bg-zinc-800/80 group transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-300 group-hover:text-white truncate pr-2">
                          {task.title}
                        </span>
                        {currentTask?._id === task._id && (
                          <Check className="h-3 w-3 text-purple-400 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {task.projectId && (
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: `${task.projectId.color}20`,
                              color: task.projectId.color,
                            }}
                          >
                            {task.projectId.name}
                          </span>
                        )}
                        <span className="text-[10px] text-zinc-500">{task.estimatedMinutes}m</span>
                      </div>
                    </DropdownMenu.Item>
                  ))
                )}
              </div>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      {!currentTask ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center py-4">
          <div className="w-12 h-12 rounded-full border border-dashed border-zinc-700 flex items-center justify-center mb-3">
            <CheckCircle2 className="h-5 w-5 text-zinc-600" />
          </div>
          <p className="text-sm font-bold text-zinc-400 mb-1">No Task Selected</p>
          <p className="text-xs text-zinc-600 max-w-[200px]">
            Select a task to attribute your focus time to it.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-3 mb-4">
            <CheckCircle2 className="h-5 w-5 text-purple-500 mt-0.5" />
            <div className="flex flex-col">
              <h3 className="text-lg font-bold text-zinc-200 mb-2">{currentTask.title}</h3>
              <div className="flex items-center gap-2 flex-wrap">
                {currentTask.projectId && (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${currentTask.projectId.color}20`,
                      color: currentTask.projectId.color,
                    }}
                  >
                    {currentTask.projectId.name}
                  </span>
                )}
                {currentTask.priority === "high" && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-500">
                    High Priority
                  </span>
                )}
                {currentTask.tags?.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
            <div className="flex items-center gap-2">
              <ClockIcon className="h-3.5 w-3.5" />
              <span>Estimated: {currentTask.estimatedMinutes || 25} min</span>
            </div>
          </div>

          <div className="mb-4">
            <div className="h-1.5 w-full rounded-full bg-zinc-900 overflow-hidden border border-zinc-800/50">
              <div className="h-full rounded-full bg-purple-500" style={{ width: "0%" }}></div>
            </div>
            <div className="flex justify-end mt-1">
              <span className="text-[10px] text-zinc-500 font-medium">0%</span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-800/50">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              {currentTask.dueDate ? (
                <>
                  <Calendar className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-amber-500/80">
                    {new Date(currentTask.dueDate).toLocaleDateString()}
                  </span>
                </>
              ) : (
                <>
                  <Calendar className="h-3.5 w-3.5" />
                  <span>No Due Date</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 transition-colors">
                <List className="h-3.5 w-3.5" />
              </button>
              <button className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 transition-colors">
                <Flag className="h-3.5 w-3.5" />
              </button>
              <button className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 transition-colors">
                <Link2 className="h-3.5 w-3.5" />
              </button>
              <button className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 transition-colors">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
