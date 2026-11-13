import { createFileRoute } from "@tanstack/react-router";
import { IntegrationsHeader } from "@/components/integrations/IntegrationsHeader";
import { ConnectedIntegrations } from "@/components/integrations/ConnectedIntegrations";
import { AvailableIntegrations } from "@/components/integrations/AvailableIntegrations";
import { SyncOverview } from "@/components/integrations/SyncOverview";
import { IntegrationSidebar } from "@/components/integrations/IntegrationSidebar";
import { useState, useEffect } from "react";
import { useSearch } from "@tanstack/react-router";

export const Route = createFileRoute("/integrations")({
  component: IntegrationsRoute,
});

function IntegrationsRoute() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);

  // Auto-open a panel if navigated with ?service=Spotify or ?service=GitHub
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const service = params.get("service");
    if (service) {
      setSelectedIntegration(service);
      // Clean the URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleSelectIntegration = (name: string) => {
    setSelectedIntegration((prev) => (prev === name ? null : name));
  };

  const handleConnectionChange = (service: string, connected: boolean) => {
    // Force re-render by toggling selection so the sidebar reflects new state
    if (connected) setSelectedIntegration(service);
  };

  return (
    <div className="flex h-full w-full bg-zinc-950 overflow-hidden rounded-xl border border-zinc-800 shadow-sm">
      {/* Left Main Column: Dashboard */}
      <div className="flex flex-1 flex-col overflow-hidden relative">
        <IntegrationsHeader activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-8">
            {(activeTab === "Overview" || activeTab === "Connected") && (
              <ConnectedIntegrations
                onSelectIntegration={handleSelectIntegration}
                selectedIntegration={selectedIntegration}
              />
            )}

            {(activeTab === "Overview" || activeTab === "Available") && (
              <AvailableIntegrations />
            )}

            {activeTab === "Sync History" && (
              <div className="flex flex-col mt-4">
                <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 pl-1 mb-4">
                  Sync History
                </h2>
                <div className="text-zinc-500 text-[11px] flex items-center justify-center h-32 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/10">
                  Sync History will appear here.
                </div>
              </div>
            )}

            {(activeTab === "Overview" || activeTab === "Connected") && (
              <div className="mt-auto pt-8">
                <SyncOverview />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Sidebar: Dynamic integration detail panel */}
      <IntegrationSidebar
        selectedIntegration={selectedIntegration}
        onClose={() => setSelectedIntegration(null)}
        onConnectionChange={handleConnectionChange}
      />
    </div>
  );
}
