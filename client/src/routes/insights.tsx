import { createFileRoute } from "@tanstack/react-router";
import { InsightsHeader } from "@/components/insights/InsightsHeader";
import { LiveInsights } from "@/components/insights/LiveInsights";
import { ExternalSignalsSidebar } from "@/components/insights/ExternalSignalsSidebar";

export const Route = createFileRoute("/insights")({
  component: InsightsRoute,
});

function InsightsRoute() {
  return (
    <div className="flex h-full w-full bg-zinc-950 overflow-hidden rounded-xl border border-zinc-800 shadow-sm">
      {/* Left Main Column: AI Insights */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <InsightsHeader />

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <LiveInsights />
          </div>
        </div>
      </div>

      {/* Right Sidebar: External Signals */}
      <ExternalSignalsSidebar />
    </div>
  );
}
