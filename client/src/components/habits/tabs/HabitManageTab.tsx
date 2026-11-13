import React, { useState, useMemo } from "react";
import {
  Search,
  ChevronDown,
  MoreHorizontal,
  Pencil,
  Copy,
  PauseCircle,
  Archive,
  Trash2,
  ChevronLeft,
  ChevronRight,
  PlayCircle,
  RefreshCcw,
} from "lucide-react";
import { Habit } from "@/lib/api";
import clsx from "clsx";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { toast } from "sonner";

type HabitAction = "edit" | "duplicate" | "pause" | "resume" | "archive" | "restore" | "delete";

interface HabitManageTabProps {
  habits: Habit[];
  onEdit: (habit: Habit) => void;
  onDelete: (id: string) => Promise<void>;
  onDuplicate: (habit: Habit) => Promise<void>;
  onUpdateStatus: (id: string, status: "active" | "paused" | "archived") => Promise<void>;
}

export function HabitManageTab({
  habits,
  onEdit,
  onDelete,
  onDuplicate,
  onUpdateStatus,
}: HabitManageTabProps) {
  // Local UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused" | "archived">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("All Categories");
  const [sortBy, setSortBy] = useState<"recent" | "name_asc" | "streak_desc" | "completion_desc">(
    "recent",
  );

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Delete Dialog State
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);

  // Action Locking State
  const [isMutatingId, setIsMutatingId] = useState<string | null>(null);

  // Derived Categories
  const categories = useMemo(() => {
    const cats = new Set(habits.map((h) => h.category));
    return ["All Categories", ...Array.from(cats)];
  }, [habits]);

  // Filtering & Sorting Logic
  const filteredAndSortedHabits = useMemo(() => {
    let result = [...habits];

    // Status Filter
    if (statusFilter !== "all") {
      result = result.filter((h) => h.status === statusFilter);
    } else {
      // By default, if 'all' is selected, maybe hide archived unless explicitly searching for it?
      // Let's show active + paused for 'all', but exclude archived unless statusFilter === 'archived'
      result = result.filter((h) => h.status !== "archived");
    }

    // Category Filter
    if (categoryFilter !== "All Categories") {
      result = result.filter((h) => h.category === categoryFilter);
    }

    // Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (h) => h.name.toLowerCase().includes(q) || h.category.toLowerCase().includes(q),
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "name_asc") return a.name.localeCompare(b.name);
      if (sortBy === "streak_desc") return (b.currentStreak || 0) - (a.currentStreak || 0);
      if (sortBy === "recent")
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return 0; // fallback
    });

    return result;
  }, [habits, statusFilter, categoryFilter, searchQuery, sortBy]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredAndSortedHabits.length / pageSize) || 1;
  // Ensure we don't end up on an empty out-of-bounds page after filtering
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedHabits = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredAndSortedHabits.slice(start, start + pageSize);
  }, [filteredAndSortedHabits, safeCurrentPage, pageSize]);

  // Handlers
  const handleAction = async (action: HabitAction, habit: Habit) => {
    if (isMutatingId) return;

    if (action === "edit") {
      onEdit(habit);
      return;
    }

    if (action === "delete") {
      setHabitToDelete(habit);
      return;
    }

    setIsMutatingId(habit._id);
    try {
      if (action === "duplicate") {
        toast.promise(onDuplicate(habit), {
          loading: "Duplicating...",
          success: "Habit duplicated successfully!",
          error: "Failed to duplicate habit.",
        });
      } else if (action === "pause") {
        await onUpdateStatus(habit._id, "paused");
        toast.success("Habit paused");
      } else if (action === "resume" || action === "restore") {
        await onUpdateStatus(habit._id, "active");
        toast.success(action === "resume" ? "Habit resumed" : "Habit restored");
      } else if (action === "archive") {
        await onUpdateStatus(habit._id, "archived");
        toast.success("Habit archived");
      }
    } catch (e) {
      toast.error("An error occurred during the action");
    } finally {
      setIsMutatingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!habitToDelete) return;
    setIsMutatingId(habitToDelete._id);

    try {
      await onDelete(habitToDelete._id);
      toast.success("Habit deleted permanently");
    } catch (e) {
      toast.error("Failed to delete habit");
    } finally {
      setIsMutatingId(null);
      setHabitToDelete(null);
    }
  };

  return (
    <div className="flex flex-1 flex-col p-4 sm:p-8 overflow-y-auto custom-scrollbar items-center bg-[#0e0e11]">
      <div className="max-w-[1200px] w-full">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            {/* Status Filter */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="flex items-center justify-between w-[140px] px-3 py-2 bg-zinc-900/80 border border-zinc-800 rounded-lg text-xs font-medium text-zinc-300 hover:text-white transition-colors">
                  <span className="capitalize">
                    {statusFilter === "all" ? "Active + Paused" : statusFilter}
                  </span>
                  <ChevronDown className="h-4 w-4 text-zinc-500" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content className="w-[140px] bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                  {["all", "active", "paused", "archived"].map((status) => (
                    <DropdownMenu.Item
                      key={status}
                      onClick={() => {
                        setStatusFilter(status as any);
                        setCurrentPage(1);
                      }}
                      className="px-3 py-2 text-[11px] font-medium text-zinc-300 hover:bg-zinc-800/80 hover:text-white rounded-md cursor-pointer outline-none capitalize"
                    >
                      {status === "all" ? "Active + Paused" : status}
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>

            {/* Category Filter */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="flex items-center justify-between w-[150px] px-3 py-2 bg-zinc-900/80 border border-zinc-800 rounded-lg text-xs font-medium text-zinc-300 hover:text-white transition-colors truncate">
                  <span className="truncate">{categoryFilter}</span>
                  <ChevronDown className="h-4 w-4 text-zinc-500 shrink-0" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content className="w-[150px] max-h-60 overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                  {categories.map((cat) => (
                    <DropdownMenu.Item
                      key={cat}
                      onClick={() => {
                        setCategoryFilter(cat);
                        setCurrentPage(1);
                      }}
                      className="px-3 py-2 text-[11px] font-medium text-zinc-300 hover:bg-zinc-800/80 hover:text-white rounded-md cursor-pointer outline-none truncate"
                    >
                      {cat}
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>

            {/* Sorting Dropdown */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="flex items-center justify-between w-[150px] px-3 py-2 bg-zinc-900/80 border border-zinc-800 rounded-lg text-xs font-medium text-zinc-300 hover:text-white transition-colors truncate">
                  <span className="truncate">
                    Sort:{" "}
                    {sortBy === "recent"
                      ? "Recent"
                      : sortBy === "name_asc"
                        ? "A-Z"
                        : sortBy === "streak_desc"
                          ? "Highest Streak"
                          : "Highest Completion"}
                  </span>
                  <ChevronDown className="h-4 w-4 text-zinc-500 shrink-0" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content className="w-[160px] bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                  {[
                    { val: "recent", label: "Recently Updated" },
                    { val: "name_asc", label: "Name A → Z" },
                    { val: "streak_desc", label: "Highest Streak" },
                  ].map((opt) => (
                    <DropdownMenu.Item
                      key={opt.val}
                      onClick={() => setSortBy(opt.val as any)}
                      className="px-3 py-2 text-[11px] font-medium text-zinc-300 hover:bg-zinc-800/80 hover:text-white rounded-md cursor-pointer outline-none truncate"
                    >
                      {opt.label}
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>

          <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search habits..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full md:w-64 pl-9 pr-4 py-2 bg-zinc-900/80 border border-zinc-800 rounded-lg text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
            />
          </div>
        </div>

        {/* Table / Empty States */}
        {habits.length === 0 ? (
          <div className="p-12 border border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center text-center bg-zinc-900/30">
            <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mb-4 text-2xl">
              🌱
            </div>
            <h3 className="text-zinc-300 font-bold mb-2">No habits yet</h3>
            <p className="text-zinc-500 text-xs mb-6 max-w-sm">
              Build consistency by creating your first habit. It takes time to grow, but the results
              compound.
            </p>
            <button
              onClick={() => onEdit(null as any)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-md text-xs font-bold transition-colors"
            >
              + Create Habit
            </button>
          </div>
        ) : filteredAndSortedHabits.length === 0 ? (
          <div className="p-12 border border-zinc-800/80 rounded-xl flex flex-col items-center justify-center text-center bg-zinc-950/50">
            <Search className="h-8 w-8 text-zinc-600 mb-4" />
            <h3 className="text-zinc-400 font-medium mb-2">No habits found</h3>
            <p className="text-zinc-500 text-xs mb-4">
              Nothing matches "{searchQuery}" in{" "}
              {statusFilter !== "all" ? statusFilter : "active/paused"} habits.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setCategoryFilter("All Categories");
              }}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md text-xs font-medium transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="bg-zinc-950/50 rounded-xl border border-zinc-800/80 overflow-x-auto custom-scrollbar">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="text-[10px] text-zinc-500 font-semibold border-b border-zinc-800/80">
                <tr>
                  <th className="px-4 md:px-6 py-4 font-medium">Habit</th>
                  <th className="px-4 md:px-6 py-4 font-medium hidden sm:table-cell">Schedule</th>
                  <th className="px-4 md:px-6 py-4 font-medium hidden md:table-cell">Streak</th>
                  <th className="px-4 md:px-6 py-4 font-medium hidden lg:table-cell">XP</th>
                  <th className="px-4 md:px-6 py-4 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-xs text-zinc-400">
                {paginatedHabits.map((habit) => (
                  <tr
                    key={habit._id}
                    className={clsx(
                      "border-b border-zinc-800/30 transition-colors group",
                      habit.status === "paused"
                        ? "opacity-60 hover:opacity-100 hover:bg-zinc-900/30"
                        : habit.status === "archived"
                          ? "opacity-40 hover:opacity-100 hover:bg-zinc-900/30"
                          : "hover:bg-zinc-900/30",
                    )}
                  >
                    <td className="px-4 md:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-900 border border-zinc-800/50 text-base">
                          {habit.icon}
                        </div>
                        <div className="flex flex-col">
                          <span
                            className={clsx(
                              "font-bold",
                              habit.status === "archived"
                                ? "text-zinc-400 line-through decoration-zinc-600"
                                : "text-zinc-200",
                            )}
                          >
                            {habit.name}
                            {habit.status === "paused" && (
                              <span className="ml-2 text-[9px] font-bold px-1.5 py-0.5 bg-amber-500/10 text-amber-500 rounded no-underline">
                                PAUSED
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] text-zinc-500 sm:hidden mt-0.5">
                            {habit.category} • {habit.frequencyType}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 md:px-6 py-4 hidden sm:table-cell">
                      <div className="flex flex-col">
                        <span className="text-zinc-300">{habit.category}</span>
                        <span className="text-[10px] text-zinc-500 capitalize">
                          {habit.frequencyType === "every_day" ? "Daily" : habit.frequencyType}{" "}
                          {habit.time ? `· ${habit.time}` : ""}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 md:px-6 py-4 hidden md:table-cell">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-zinc-300">
                          {habit.currentStreak || 0}
                        </span>
                        <span className="text-zinc-500">days</span>
                      </div>
                    </td>

                    <td className="px-4 md:px-6 py-4 hidden lg:table-cell">
                      <span className="text-zinc-400 font-medium">+{habit.xpReward}</span>
                    </td>

                    <td className="px-4 md:px-6 py-4 text-center">
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                          <button
                            disabled={isMutatingId === habit._id}
                            className={clsx(
                              "p-1.5 rounded-md transition-colors border outline-none",
                              isMutatingId === habit._id
                                ? "opacity-50 cursor-wait bg-zinc-800 text-zinc-500 border-zinc-700"
                                : "bg-transparent text-zinc-500 border-transparent hover:bg-zinc-800/50 hover:text-zinc-300 hover:border-zinc-700/50 focus:bg-zinc-800 focus:text-white",
                            )}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal>
                          <DropdownMenu.Content
                            sideOffset={4}
                            align="end"
                            className="w-40 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-100"
                          >
                            <DropdownMenu.Item
                              onClick={() => handleAction("edit", habit)}
                              className="w-full text-left px-4 py-2 text-[11px] font-medium text-zinc-300 hover:bg-zinc-800/80 hover:text-white flex items-center gap-2.5 outline-none cursor-pointer"
                            >
                              <Pencil className="h-3.5 w-3.5 text-zinc-400" /> Edit Habit
                            </DropdownMenu.Item>

                            <DropdownMenu.Item
                              onClick={() => handleAction("duplicate", habit)}
                              className="w-full text-left px-4 py-2 text-[11px] font-medium text-zinc-300 hover:bg-zinc-800/80 hover:text-white flex items-center gap-2.5 outline-none cursor-pointer"
                            >
                              <Copy className="h-3.5 w-3.5 text-zinc-400" /> Duplicate
                            </DropdownMenu.Item>

                            {habit.status === "active" && (
                              <DropdownMenu.Item
                                onClick={() => handleAction("pause", habit)}
                                className="w-full text-left px-4 py-2 text-[11px] font-medium text-zinc-300 hover:bg-zinc-800/80 hover:text-white flex items-center gap-2.5 outline-none cursor-pointer"
                              >
                                <PauseCircle className="h-3.5 w-3.5 text-zinc-400" /> Pause
                              </DropdownMenu.Item>
                            )}

                            {habit.status === "paused" && (
                              <DropdownMenu.Item
                                onClick={() => handleAction("resume", habit)}
                                className="w-full text-left px-4 py-2 text-[11px] font-medium text-amber-400 hover:bg-amber-500/10 flex items-center gap-2.5 outline-none cursor-pointer"
                              >
                                <PlayCircle className="h-3.5 w-3.5" /> Resume
                              </DropdownMenu.Item>
                            )}

                            {habit.status !== "archived" && (
                              <DropdownMenu.Item
                                onClick={() => handleAction("archive", habit)}
                                className="w-full text-left px-4 py-2 text-[11px] font-medium text-zinc-300 hover:bg-zinc-800/80 hover:text-white flex items-center gap-2.5 outline-none cursor-pointer"
                              >
                                <Archive className="h-3.5 w-3.5 text-zinc-400" /> Archive
                              </DropdownMenu.Item>
                            )}

                            {habit.status === "archived" && (
                              <DropdownMenu.Item
                                onClick={() => handleAction("restore", habit)}
                                className="w-full text-left px-4 py-2 text-[11px] font-medium text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-2.5 outline-none cursor-pointer"
                              >
                                <RefreshCcw className="h-3.5 w-3.5" /> Restore
                              </DropdownMenu.Item>
                            )}

                            <DropdownMenu.Separator className="h-[1px] bg-zinc-800/60 my-1" />

                            <DropdownMenu.Item
                              onClick={() => handleAction("delete", habit)}
                              className="w-full text-left px-4 py-2 text-[11px] font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2.5 outline-none cursor-pointer focus:bg-red-500/10 focus:text-red-300"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </DropdownMenu.Item>
                          </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Root>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Pagination */}
        {filteredAndSortedHabits.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
            <span className="text-xs text-zinc-500">
              Showing {(safeCurrentPage - 1) * pageSize + 1} to{" "}
              {Math.min(safeCurrentPage * pageSize, filteredAndSortedHabits.length)} of{" "}
              {filteredAndSortedHabits.length} habits
            </span>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  disabled={safeCurrentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  className="h-7 w-7 flex items-center justify-center rounded bg-zinc-900/50 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {Array.from({ length: totalPages }).map((_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={clsx(
                        "h-7 w-7 flex items-center justify-center rounded text-xs font-medium transition-colors",
                        safeCurrentPage === page
                          ? "bg-purple-600 text-white shadow-glow"
                          : "bg-zinc-900/50 text-zinc-400 hover:text-white hover:bg-zinc-800",
                      )}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  disabled={safeCurrentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  className="h-7 w-7 flex items-center justify-center rounded bg-zinc-900/50 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog.Root
        open={!!habitToDelete}
        onOpenChange={(open) => !open && setHabitToDelete(null)}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 animate-in fade-in" />
          <AlertDialog.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[90vw] max-w-md bg-[#121217] border border-zinc-800 rounded-xl shadow-2xl p-6 z-50 animate-in fade-in zoom-in-95 duration-200">
            <AlertDialog.Title className="text-lg font-bold text-white mb-2">
              Delete habit?
            </AlertDialog.Title>
            <AlertDialog.Description className="text-sm text-zinc-400 mb-6">
              "{habitToDelete?.name}" and all of its historical completion data will be permanently
              deleted. This action cannot be undone.
            </AlertDialog.Description>
            <div className="flex justify-end gap-3">
              <AlertDialog.Cancel asChild>
                <button className="px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-md transition-colors">
                  Cancel
                </button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    confirmDelete();
                  }}
                  className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 rounded-md text-xs font-bold transition-colors"
                >
                  Delete
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
