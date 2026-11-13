import { useState, useMemo } from "react";
import {
  Circle,
  CheckCircle2,
  Star,
  MoreHorizontal,
  Calendar as CalendarIcon,
  Clock,
  ListFilter,
  ChevronDown,
} from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { Task } from "@/lib/api";
import clsx from "clsx";

interface TasksListProps {
  selectedTaskId: string | null;
  onSelectTask: (id: string) => void;
}

export function TasksList({ selectedTaskId, onSelectTask }: TasksListProps) {
  const { tasks, isLoading, completeTask } = useTasks({ date: "today" });

  const highPriority = useMemo(
    () => tasks.filter((t) => t.priority === "high" && t.status !== "completed"),
    [tasks],
  );
  const mediumPriority = useMemo(
    () => tasks.filter((t) => t.priority === "medium" && t.status !== "completed"),
    [tasks],
  );
  const lowPriority = useMemo(
    () => tasks.filter((t) => t.priority === "low" && t.status !== "completed"),
    [tasks],
  );
  const completed = useMemo(() => tasks.filter((t) => t.status === "completed"), [tasks]);

  const handleComplete = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    if (task.status !== "completed") {
      completeTask.mutate(task._id);
    }
  };

  const TaskRow = ({ task }: { task: Task }) => (
    <div
      onClick={() => onSelectTask(task._id)}
      className={clsx(
        "group flex flex-col gap-2 rounded-xl border p-4 cursor-pointer transition-colors duration-200",
        selectedTaskId === task._id
          ? "border-primary/50 bg-surface shadow-[0_0_15px_rgba(168,85,247,0.1)]"
          : "border-border bg-surface-elevated hover:border-zinc-700 hover:bg-surface",
        task.status === "completed" && "opacity-60 grayscale-[0.5]",
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <button
            onClick={(e) => handleComplete(e, task)}
            className="mt-0.5 text-text-muted hover:text-primary transition-colors"
          >
            {task.status === "completed" ? (
              <CheckCircle2 className="h-4 w-4 text-success" />
            ) : (
              <Circle className="h-4 w-4" />
            )}
          </button>
          <div className="flex flex-col">
            <span
              className={clsx(
                "text-sm font-medium transition-all duration-300",
                task.status === "completed" ? "text-text-muted line-through" : "text-text-primary",
              )}
            >
              {task.title}
            </span>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {task.projectId && (
                <span className="flex items-center gap-1.5 rounded bg-surface px-2 py-0.5 text-[10px] font-medium text-text-secondary border border-border">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: task.projectId.color || "#A855F7" }}
                  />
                  {task.projectId.name}
                </span>
              )}
              {task.tags?.map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-primary-light border border-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-primary">+{task.xpReward} XP</span>
          <button
            className={clsx(
              "text-text-muted hover:text-warning transition-colors",
              task.isStarred && "text-warning",
            )}
          >
            <Star className={clsx("h-4 w-4", task.isStarred && "fill-warning")} />
          </button>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between pl-7">
        <div className="flex items-center gap-4 text-[10px] font-medium text-text-muted">
          {task.dueDate && (
            <span className="flex items-center gap-1.5">
              <CalendarIcon className="h-3 w-3" />
              {new Date(task.dueDate).toLocaleDateString()}
            </span>
          )}
          {task.estimatedMinutes && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              {task.estimatedMinutes} min
            </span>
          )}
        </div>
        <button className="text-text-secondary hover:text-text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col border-r border-border bg-background p-6 h-full">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-surface-elevated rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-surface-elevated rounded-xl w-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col border-r border-border bg-background p-6 overflow-y-auto custom-scrollbar h-full">
      {/* Header */}
      <div className="mb-6 flex items-end justify-between">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-text-primary">Today</h2>
          <span className="text-xs text-text-secondary mt-1">
            {tasks.filter((t) => t.status !== "completed").length} tasks remaining •{" "}
            {completed.length} completed
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors">
            Sort by: Priority <ChevronDown className="h-3 w-3" />
          </button>
          <div className="h-4 w-px bg-border" />
          <button className="flex h-7 w-7 items-center justify-center rounded bg-surface border border-border text-text-secondary hover:text-text-primary">
            <ListFilter className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-8 pb-10">
        {highPriority.length > 0 && (
          <div className="animate-in slide-in-from-bottom-2 duration-300">
            <div className="mb-3 flex items-center gap-2">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-error">
                High Priority
              </h3>
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-error/10 text-[9px] font-bold text-error">
                {highPriority.length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {highPriority.map((t) => (
                <TaskRow key={t._id} task={t} />
              ))}
            </div>
          </div>
        )}

        {mediumPriority.length > 0 && (
          <div className="animate-in slide-in-from-bottom-3 duration-300">
            <div className="mb-3 flex items-center gap-2">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-warning">
                Medium Priority
              </h3>
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-warning/10 text-[9px] font-bold text-warning">
                {mediumPriority.length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {mediumPriority.map((t) => (
                <TaskRow key={t._id} task={t} />
              ))}
            </div>
          </div>
        )}

        {lowPriority.length > 0 && (
          <div className="animate-in slide-in-from-bottom-4 duration-300">
            <div className="mb-3 flex items-center gap-2">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                Low Priority
              </h3>
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-surface-elevated text-[9px] font-bold text-text-secondary">
                {lowPriority.length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {lowPriority.map((t) => (
                <TaskRow key={t._id} task={t} />
              ))}
            </div>
          </div>
        )}

        {completed.length > 0 && (
          <div className="animate-in fade-in duration-500">
            <div className="mb-3 flex items-center gap-2">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-success">
                Completed
              </h3>
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-success/10 text-[9px] font-bold text-success">
                {completed.length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {completed.map((t) => (
                <TaskRow key={t._id} task={t} />
              ))}
            </div>
          </div>
        )}

        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-surface-elevated border border-border flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-text-muted" />
            </div>
            <h3 className="text-lg font-bold text-text-primary">No tasks for today.</h3>
            <p className="text-sm text-text-secondary mt-1 mb-6">Your schedule is clear.</p>
            <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">
              + Create Task
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
