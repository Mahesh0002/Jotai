import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

import { HabitList } from "@/components/habits/HabitList";
import { HabitScoreWidget } from "@/components/habits/widgets/HabitScoreWidget";
import { HabitHeatmapWidget } from "@/components/habits/widgets/HabitHeatmapWidget";
import { TopHabitsWidget } from "@/components/habits/widgets/TopHabitsWidget";
import { HabitImpactWidget } from "@/components/habits/widgets/HabitImpactWidget";
import { CompletionTrendWidget } from "@/components/habits/widgets/CompletionTrendWidget";

import { HabitManageTab } from "@/components/habits/tabs/HabitManageTab";
import { HabitCalendarTab } from "@/components/habits/tabs/HabitCalendarTab";
import { HabitAnalyticsTab } from "@/components/habits/tabs/HabitAnalyticsTab";

import { HabitModal } from "@/components/habits/HabitModal";
import { HabitsSidebar } from "@/components/habits/HabitsSidebar";
import { useHabits } from "@/hooks/useHabits";
import { Habit } from "@/lib/api";

export const Route = createFileRoute("/habits")({
  component: HabitsRoute,
});

type Tab = "overview" | "calendar" | "analytics" | "manage";

function HabitsRoute() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);

  const dateString = currentDate.toLocaleDateString("en-CA");
  const { habits, deleteHabit, duplicateHabit, updateHabitStatus } = useHabits(
    dateString,
    activeTab === "manage" ? "all" : undefined,
  );

  const handlePrevDay = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 1);
      return d;
    });
  };

  const handleNextDay = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 1);
      return d;
    });
  };

  const openEditModal = (habit: Habit) => {
    setSelectedHabit(habit);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setSelectedHabit(null);
    setIsModalOpen(true);
  };

  const isToday = new Date().toLocaleDateString("en-CA") === dateString;
  const displayDate = isToday
    ? `Today, ${currentDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
    : currentDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="flex flex-col h-full w-full bg-zinc-950 overflow-hidden rounded-xl shadow-sm animate-in fade-in duration-200">
      {/* 1. Header & Tabs */}
      <div className="shrink-0 border-b border-zinc-900 bg-[#0e0e11] px-8 py-6 z-10 relative">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Habits</h1>
            <p className="text-[13px] text-zinc-400">
              Build consistency. Understand what actually helps you.
            </p>
          </div>
          <Button
            variant="primary"
            onClick={openCreateModal}
            className="bg-purple-600 hover:bg-purple-500 text-xs h-8 px-4 rounded-md shadow-glow transition-colors font-semibold"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Habit
          </Button>
        </div>

        <div className="flex gap-6 border-b border-zinc-900">
          {(["overview", "calendar", "analytics", "manage habits"] as string[]).map((tab) => {
            const tabKey = tab.split(" ")[0] as Tab;
            return (
              <button
                key={tabKey}
                onClick={() => setActiveTab(tabKey)}
                className={`pb-3 text-[13px] font-bold tracking-wide transition-colors relative capitalize
                  ${activeTab === tabKey ? "text-white" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                {tab}
                {activeTab === tabKey && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-t-full shadow-[0_-2px_10px_rgba(168,85,247,0.5)] animate-in fade-in zoom-in" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Main Content Area */}
      <div className="flex-1 overflow-hidden flex bg-[#0e0e11]">
        {activeTab === "overview" && (
          <>
            <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-8">
              <div className="max-w-[1200px] w-full mx-auto space-y-6 pb-8">
                <div className="flex items-center justify-end gap-3 mb-2">
                  <div className="flex items-center bg-zinc-900/50 rounded-md border border-zinc-800/80 px-2 py-1">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mr-3 pl-2">
                      {displayDate}
                    </span>
                    <button
                      onClick={handlePrevDay}
                      className="p-1 text-zinc-500 hover:text-white transition-colors rounded hover:bg-zinc-800"
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </button>
                    <button
                      onClick={handleNextDay}
                      className="p-1 text-zinc-500 hover:text-white transition-colors rounded hover:bg-zinc-800 ml-1"
                    >
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  <div className="grid grid-cols-[1.2fr_1fr] gap-6">
                    <HabitList date={dateString} onEdit={openEditModal} />
                    <HabitScoreWidget />
                  </div>
                  <div className="grid grid-cols-[1.5fr_1fr_1fr] gap-6">
                    <HabitHeatmapWidget />
                    <TopHabitsWidget />
                    <HabitImpactWidget />
                  </div>
                  <CompletionTrendWidget />
                </div>
              </div>
            </div>
            <HabitsSidebar />
          </>
        )}

        {activeTab === "calendar" && <HabitCalendarTab habits={habits} currentDate={currentDate} />}
        {activeTab === "analytics" && <HabitAnalyticsTab />}
        {activeTab === "manage" && (
          <HabitManageTab
            habits={habits}
            onEdit={openEditModal}
            onDelete={async (id) => {
              await deleteHabit.mutateAsync(id);
            }}
            onDuplicate={async (habit) => {
              await duplicateHabit.mutateAsync(habit);
            }}
            onUpdateStatus={async (id, status) => {
              await updateHabitStatus.mutateAsync({ id, status });
            }}
          />
        )}
      </div>

      <HabitModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        existingHabit={selectedHabit}
      />
    </div>
  );
}
