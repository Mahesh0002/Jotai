import { createFileRoute } from "@tanstack/react-router";
import { RunnerProfile } from "@/components/runner/RunnerProfile";
import { PerformanceOverview } from "@/components/runner/PerformanceOverview";
import { RecentXpActivity } from "@/components/runner/RecentXpActivity";
import { LevelProgression } from "@/components/runner/LevelProgression";
import { WeeklySummary } from "@/components/runner/WeeklySummary";
import { Achievements } from "@/components/runner/Achievements";
import { XpSources } from "@/components/runner/XpSources";
import { AiRunnerInsight } from "@/components/runner/AiRunnerInsight";

export const Route = createFileRoute("/runner")({
  component: RunnerRoute,
});

function RunnerRoute() {
  return (
    <div className="flex h-full w-full bg-zinc-950 overflow-y-auto custom-scrollbar rounded-xl border border-zinc-800 shadow-sm p-8">
      <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
        {/* Top Profile Section */}
        <RunnerProfile />

        {/* 3-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Column 1 */}
          <div className="flex flex-col gap-6">
            <PerformanceOverview />
            <div className="flex-1">
              <RecentXpActivity />
            </div>
          </div>

          {/* Column 2 */}
          <div className="flex flex-col gap-6">
            <LevelProgression />
            <div className="flex-1">
              <WeeklySummary />
            </div>
          </div>

          {/* Column 3 */}
          <div className="flex flex-col gap-6">
            <Achievements />
            <XpSources />
            <AiRunnerInsight />
          </div>
        </div>
      </div>
    </div>
  );
}
