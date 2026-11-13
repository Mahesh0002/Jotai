import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { TasksHeader } from "@/components/tasks/TasksHeader";
import { TasksSidebar } from "@/components/tasks/TasksSidebar";
import { TasksList } from "@/components/tasks/TasksList";
import { TaskDetails } from "@/components/tasks/TaskDetails";
import { TasksInsights } from "@/components/tasks/TasksInsights";
import { NewTaskModal } from "@/components/tasks/NewTaskModal";

export const Route = createFileRoute("/tasks")({
  component: TasksRoute,
});

function TasksRoute() {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "SELECT"
      ) {
        if (e.key === "Escape") {
          // If modal is open, let modal handle it, else let input handle it
          if (isNewTaskModalOpen) {
            setIsNewTaskModalOpen(false);
            (document.activeElement as HTMLElement).blur();
          }
        }
        return;
      }

      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setIsNewTaskModalOpen(true);
      }

      if (e.key === "Escape") {
        setIsNewTaskModalOpen(false);
        setSelectedTaskId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isNewTaskModalOpen]);

  return (
    <>
      <div className="flex h-full w-full flex-col rounded-xl border border-border bg-background shadow-sm overflow-hidden">
        {/* Top Header */}
        <TasksHeader onNewTask={() => setIsNewTaskModalOpen(true)} />

        {/* Main 3-Pane Layout */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Left Sidebar */}
          <TasksSidebar />

          {/* Center Task List */}
          <TasksList selectedTaskId={selectedTaskId} onSelectTask={setSelectedTaskId} />

          {/* Right Task Details */}
          <TaskDetails taskId={selectedTaskId} />
        </div>

        {/* Bottom Insights Bar */}
        <TasksInsights />
      </div>

      <NewTaskModal isOpen={isNewTaskModalOpen} onClose={() => setIsNewTaskModalOpen(false)} />
    </>
  );
}
