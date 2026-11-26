import React, { useState } from "react";
import { Check, MoreHorizontal, Pencil, Trash } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useHabits } from "@/hooks/useHabits";
import { Habit } from "@/lib/api";
import clsx from "clsx";

interface HabitListProps {
  date: string;
  onEdit?: (habit: Habit) => void;
}

export function HabitList({ date, onEdit }: HabitListProps) {
  const { habits, isLoading, toggleCompletion, deleteHabit } = useHabits(date);
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Card className="flex flex-col gap-4 p-5 bg-zinc-950 border-zinc-800/80 min-h-[300px]">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">
          Today's Habits
        </h2>
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-zinc-900 rounded"></div>
          <div className="h-12 bg-zinc-900 rounded"></div>
        </div>
      </Card>
    );
  }

  const handleToggle = (id: string, currentlyCompleted: boolean) => {
    if (!currentlyCompleted) {
      setAnimatingId(id);
      setTimeout(() => setAnimatingId(null), 1000);
    }
    toggleCompletion.mutate({ id, status: currentlyCompleted ? "incomplete" : "completed" });
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this habit?")) {
      deleteHabit.mutate(id);
    }
    setOpenMenuId(null);
  };

  const handleEditClick = (e: React.MouseEvent, habit: Habit) => {
    e.stopPropagation();
    if (onEdit) onEdit(habit);
    setOpenMenuId(null);
  };

  return (
    <Card className="flex flex-col p-5 bg-zinc-950 border-zinc-800/80 min-h-[300px] h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          Today's Habits
        </h2>
        <button className="text-zinc-500 hover:text-white transition-colors">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {habits.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 text-sm">
          No habits scheduled for this day.
        </div>
      ) : (
        <div className="flex flex-col gap-0.5">
          {habits.map((habit) => {
            const isCompleted = !!habit.isCompletedToday;
            const isAnimating = animatingId === habit._id;
            const isMenuOpen = openMenuId === habit._id;

            return (
              <div
                key={habit._id}
                className="group relative flex items-center justify-between p-3 rounded-lg border border-transparent hover:bg-zinc-900/40 transition-all duration-200 text-left overflow-visible"
              >
                {/* Background Progress Fill (Subtle) */}
                {isCompleted && (
                  <div className="absolute inset-0 bg-purple-500/[0.02] origin-left animate-in slide-in-from-left duration-500 rounded-lg pointer-events-none" />
                )}

                <button
                  onClick={() => handleToggle(habit._id, isCompleted)}
                  className="flex-1 flex items-center gap-4 relative z-10"
                >
                  {/* Icon Box */}
                  <div
                    className={clsx(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-all duration-200 text-lg",
                      isCompleted
                        ? "border-purple-500/30 bg-purple-500/10"
                        : "border-zinc-800/50 bg-zinc-900",
                    )}
                  >
                    <span className={isCompleted ? "opacity-50 grayscale" : ""}>{habit.icon}</span>
                  </div>

                  {/* Text */}
                  <div className="flex flex-col items-start">
                    <span
                      className={clsx(
                        "text-xs font-bold transition-colors duration-200",
                        isCompleted ? "text-zinc-500 line-through" : "text-white",
                      )}
                    >
                      {habit.name}
                    </span>
                    <span className="text-[10px] text-zinc-500 mt-0.5">
                      {habit.time ? `${habit.time} • ` : ""}
                      {habit.targetDurationMinutes} min
                    </span>
                  </div>
                </button>

                <div className="relative flex items-center gap-3 z-20">
                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggle(habit._id, isCompleted)}
                    className={clsx(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all duration-200",
                      isCompleted
                        ? "bg-purple-500 border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.4)]"
                        : "border-zinc-700 bg-transparent hover:border-purple-500/50",
                    )}
                  >
                    <Check
                      className={clsx(
                        "h-3 w-3 text-white transition-all duration-200",
                        isCompleted ? "scale-100 opacity-100" : "scale-50 opacity-0",
                      )}
                      strokeWidth={3}
                    />
                  </button>

                  {/* XP Badge */}
                  <div
                    className={clsx(
                      "px-2 py-0.5 rounded text-[10px] font-bold border transition-all duration-200 w-14 text-center",
                      isCompleted
                        ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
                        : "bg-zinc-900 border-zinc-800 text-purple-500/50 group-hover:text-purple-400",
                    )}
                  >
                    +{habit.xpReward} XP
                  </div>

                  {/* Toast Animation */}
                  {isAnimating && (
                    <div className="absolute right-14 text-purple-400 font-bold text-[10px] animate-[floatUp_1s_ease-out_forwards] pointer-events-none whitespace-nowrap">
                      +{habit.xpReward}
                    </div>
                  )}

                  {/* Actions Dropdown */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(isMenuOpen ? null : habit._id);
                    }}
                    className="p-1 text-zinc-600 hover:text-white rounded opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </button>

                  {isMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(null);
                        }}
                      />
                      <div className="absolute right-0 top-6 w-32 bg-zinc-900 border border-zinc-800 rounded-md shadow-xl z-40 py-1 animate-in zoom-in-95 duration-100">
                        <button
                          onClick={(e) => handleEditClick(e, habit)}
                          className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2"
                        >
                          <Pencil className="h-3 w-3" /> Edit
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, habit._id)}
                          className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2"
                        >
                          <Trash className="h-3 w-3" /> Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes floatUp {
          0% { opacity: 0; transform: translateY(10px) scale(0.9); }
          20% { opacity: 1; transform: translateY(0px) scale(1.1); }
          80% { opacity: 1; transform: translateY(-5px) scale(1); }
          100% { opacity: 0; transform: translateY(-10px) scale(0.9); }
        }
      `}</style>
    </Card>
  );
}
