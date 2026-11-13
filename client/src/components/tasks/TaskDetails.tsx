import {
  Circle,
  CheckCircle2,
  Star,
  MoreHorizontal,
  Calendar as CalendarIcon,
  Clock,
  ChevronDown,
  Tag,
  Plus,
  Play,
  GripVertical,
  Flag,
  X,
  AlignLeft as ProjectIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTasks } from "@/hooks/useTasks";
import { useState } from "react";
import clsx from "clsx";

interface TaskDetailsProps {
  taskId: string | null;
}

export function TaskDetails({ taskId }: TaskDetailsProps) {
  const { tasks, updateTask, toggleSubtask, completeTask } = useTasks({ date: "today" });

  // Find the selected task from the cached list
  const task = tasks.find((t) => t._id === taskId);

  const [newSubtask, setNewSubtask] = useState("");
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);

  if (!task) {
    return (
      <div className="flex w-96 shrink-0 flex-col items-center justify-center bg-background border-r border-border p-6 h-full text-text-muted">
        <p className="text-sm">Select a task to view details</p>
      </div>
    );
  }

  const handleStatusChange = (status: "not_started" | "in_progress" | "blocked" | "completed") => {
    updateTask.mutate({ id: task._id, data: { status } });
  };

  const handlePriorityChange = (priority: "high" | "medium" | "low") => {
    updateTask.mutate({ id: task._id, data: { priority } });
  };

  const handleToggleStar = () => {
    updateTask.mutate({ id: task._id, data: { isStarred: !task.isStarred } });
  };

  const handleCompleteTask = () => {
    completeTask.mutate(task._id);
  };

  const handleToggleSubtask = (subtaskId: string, isCompleted: boolean) => {
    toggleSubtask.mutate({ taskId: task._id, subtaskId, isCompleted });
  };

  // Safe check for subtasks array
  const subtasksList = task.subtasks || [];
  const completedSubtasks = subtasksList.filter((st) => st.isCompleted).length;
  const progressPercent =
    subtasksList.length > 0 ? Math.round((completedSubtasks / subtasksList.length) * 100) : 0;

  return (
    <div className="flex w-[400px] shrink-0 flex-col bg-surface border-r border-border p-6 overflow-y-auto custom-scrollbar h-full animate-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="mb-6 flex items-start gap-4">
        <button
          onClick={handleCompleteTask}
          className="mt-1 text-text-muted hover:text-primary transition-colors"
        >
          {task.status === "completed" ? (
            <CheckCircle2 className="h-5 w-5 text-success" />
          ) : (
            <Circle className="h-5 w-5" />
          )}
        </button>
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-start justify-between">
            <h2
              className={clsx(
                "text-lg font-semibold leading-tight transition-colors",
                task.status === "completed" ? "text-text-muted line-through" : "text-text-primary",
              )}
            >
              {task.title}
            </h2>
            <button
              onClick={handleToggleStar}
              className={clsx(
                "hover:text-warning transition-colors",
                task.isStarred ? "text-warning" : "text-text-muted",
              )}
            >
              <Star className={clsx("h-5 w-5", task.isStarred && "fill-warning")} />
            </button>
          </div>
          <button className="text-left text-xs font-medium text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1">
            <Plus className="h-3 w-3" /> Add description
          </button>
        </div>
      </div>

      {/* Metadata Grid */}
      <div className="mb-8 flex flex-col gap-4">
        {/* Status */}
        <div className="flex items-center">
          <span className="w-32 text-xs font-medium text-text-muted flex items-center gap-2">
            <Circle className="h-3.5 w-3.5" /> Status
          </span>
          <select
            value={task.status}
            onChange={(e) => handleStatusChange(e.target.value as any)}
            className="flex h-7 flex-1 rounded-md border border-border bg-surface-elevated px-2.5 text-xs text-text-primary hover:bg-surface focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer appearance-none"
          >
            <option value="not_started">Not started</option>
            <option value="in_progress">In progress</option>
            <option value="blocked">Blocked</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Priority */}
        <div className="flex items-center">
          <span className="w-32 text-xs font-medium text-text-muted flex items-center gap-2">
            <Flag className="h-3.5 w-3.5" /> Priority
          </span>
          <select
            value={task.priority}
            onChange={(e) => handlePriorityChange(e.target.value as any)}
            className={clsx(
              "flex h-7 flex-1 rounded-md border px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer appearance-none",
              task.priority === "high"
                ? "border-error/30 bg-error/10 text-error hover:bg-error/20"
                : task.priority === "medium"
                  ? "border-warning/30 bg-warning/10 text-warning hover:bg-warning/20"
                  : "border-border bg-surface-elevated text-text-secondary hover:bg-surface",
            )}
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Due Date */}
        <div className="flex items-center">
          <span className="w-32 text-xs font-medium text-text-muted flex items-center gap-2">
            <CalendarIcon className="h-3.5 w-3.5" /> Due date
          </span>
          <button className="flex h-7 flex-1 items-center justify-between rounded-md border border-border bg-surface-elevated px-2.5 text-xs text-text-secondary hover:bg-surface">
            <span className="flex items-center gap-1.5">
              <CalendarIcon className="h-3 w-3" />
              {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "Set Date"}
            </span>
            <ChevronDown className="h-3 w-3 text-text-muted" />
          </button>
        </div>

        {/* Estimated Time */}
        <div className="flex items-center">
          <span className="w-32 text-xs font-medium text-text-muted flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" /> Estimated time
          </span>
          <button className="flex h-7 flex-1 items-center justify-between rounded-md border border-border bg-surface-elevated px-2.5 text-xs text-text-secondary hover:bg-surface">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              {task.estimatedMinutes ? `${task.estimatedMinutes} minutes` : "Set Time"}
            </span>
            <ChevronDown className="h-3 w-3 text-text-muted" />
          </button>
        </div>

        {/* Project */}
        <div className="flex items-center">
          <span className="w-32 text-xs font-medium text-text-muted flex items-center gap-2">
            <ProjectIcon className="h-3.5 w-3.5" /> Project
          </span>
          <button className="flex h-7 flex-1 items-center justify-between rounded-md border border-border bg-surface-elevated px-2.5 text-xs text-text-secondary hover:bg-surface">
            <span className="flex items-center gap-1.5">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: task.projectId?.color || "#A855F7" }}
              />
              {task.projectId?.name || "No Project"}
            </span>
            <ChevronDown className="h-3 w-3 text-text-muted" />
          </button>
        </div>

        {/* Tags */}
        <div className="flex items-start">
          <span className="w-32 pt-1 text-xs font-medium text-text-muted flex items-center gap-2">
            <Tag className="h-3.5 w-3.5" /> Tags
          </span>
          <div className="flex flex-1 flex-wrap gap-1.5">
            {task.tags?.map((tag) => (
              <span
                key={tag}
                className="rounded bg-surface-elevated border border-border px-2 py-1 text-[10px] font-medium text-text-secondary hover:bg-surface cursor-pointer"
              >
                #{tag}
              </span>
            ))}
            <button className="flex h-5 w-5 items-center justify-center rounded border border-dashed border-border text-text-muted hover:bg-surface-elevated hover:text-text-primary transition-colors">
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Subtasks */}
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
              Subtasks
            </h3>
            {subtasksList.length > 0 && (
              <span className="text-[10px] font-medium text-text-secondary">
                {completedSubtasks} / {subtasksList.length}
              </span>
            )}
          </div>
          <button
            onClick={() => setIsAddingSubtask(true)}
            className="text-text-muted hover:text-text-primary transition-colors p-1"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>

        {/* Progress Bar */}
        {subtasksList.length > 0 && (
          <div className="mb-4 flex items-center gap-3">
            <div className="h-1 flex-1 rounded-full bg-surface-elevated overflow-hidden border border-border/50">
              <div
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-text-secondary">{progressPercent}%</span>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {subtasksList.map((st) => (
            <div key={st._id} className="group flex items-center gap-3">
              <button
                onClick={() => handleToggleSubtask(st._id, !st.isCompleted)}
                className="text-text-muted hover:text-primary transition-colors"
              >
                {st.isCompleted ? (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                ) : (
                  <div className="h-4 w-4 rounded border border-text-muted/50 group-hover:border-primary" />
                )}
              </button>
              <span
                className={clsx(
                  "text-xs flex-1 transition-colors",
                  st.isCompleted ? "text-text-muted line-through" : "text-text-primary",
                )}
              >
                {st.title}
              </span>
              <button className="text-text-muted hover:text-text-secondary opacity-0 group-hover:opacity-100 transition-all cursor-grab">
                <GripVertical className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {isAddingSubtask && (
            <div className="flex items-center gap-3 mt-1 animate-in fade-in slide-in-from-top-2">
              <div className="h-4 w-4 rounded border border-text-muted/30" />
              <input
                autoFocus
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newSubtask.trim()) {
                    // TODO: create subtask API
                    setIsAddingSubtask(false);
                    setNewSubtask("");
                  }
                  if (e.key === "Escape") {
                    setIsAddingSubtask(false);
                    setNewSubtask("");
                  }
                }}
                onBlur={() => {
                  setIsAddingSubtask(false);
                  setNewSubtask("");
                }}
                className="flex-1 bg-transparent text-xs text-text-primary outline-none border-b border-primary/50 pb-0.5"
                placeholder="New subtask..."
              />
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-auto flex items-center gap-2 pt-4 border-t border-border/50">
        <Button variant="primary" className="flex-1 text-xs">
          <Play className="mr-2 h-3.5 w-3.5 fill-current" /> Start Focus
        </Button>
        <Button variant="outline" className="flex-1 text-xs">
          <CalendarIcon className="mr-2 h-3.5 w-3.5" /> Schedule
        </Button>
        <Button variant="outline" className="px-3">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
