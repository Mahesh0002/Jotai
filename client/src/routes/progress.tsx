import { createFileRoute } from "@tanstack/react-router";
import { ProgressHeader } from "@/components/progress/ProgressHeader";
import { HabitGrid } from "@/components/progress/HabitGrid";
import { FocusChart } from "@/components/progress/FocusChart";
import { TaskBarChart } from "@/components/progress/TaskBarChart";
import { WeeklyXPEarned } from "@/components/progress/WeeklyXPEarned";
import { FocusDonut } from "@/components/progress/FocusDonut";
import { GoalsPanel } from "@/components/goals/GoalsPanel";
import { useState } from "react";

export const Route = createFileRoute("/progress")({
  component: ProgressRoute,
});

export type Period = "week" | "month" | "year" | "today";

function ProgressRoute() {
  const [period, setPeriod] = useState<Period>("week");
  const [activeTab, setActiveTab] = useState("Overview");

  return (
    <div className="flex h-full w-full flex-col bg-zinc-950 overflow-hidden rounded-xl border border-zinc-800 shadow-sm">
      {/* Top Section: Header & KPIs */}
      <ProgressHeader
        period={period}
        setPeriod={setPeriod}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Grid Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        {activeTab === "Overview" && (
          <>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
              <HabitGrid period={period} />
              <FocusChart period={period} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-6">
              <TaskBarChart period={period} />
              <WeeklyXPEarned period={period} />
              <FocusDonut period={period} />
            </div>
          </>
        )}

        {activeTab === "Focus" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FocusChart period={period} />
            <FocusDonut period={period} />
          </div>
        )}

        {activeTab === "Habits" && (
          <div className="grid grid-cols-1 gap-6">
            <HabitGrid period={period} />
          </div>
        )}

        {activeTab === "Goals" && <GoalsPanel />}
      </div>
    </div>
  );
}
