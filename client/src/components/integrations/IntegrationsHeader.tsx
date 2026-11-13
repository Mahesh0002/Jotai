import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type IntegrationsHeaderProps = {
  activeTab: string;
  onTabChange: (tab: string) => void;
};

export function IntegrationsHeader({ activeTab, onTabChange }: IntegrationsHeaderProps) {
  const tabs = [
    { name: "Overview" },
    { name: "Connected", badge: "5" },
    { name: "Available", badge: "7" },
    { name: "Sync History" },
  ];

  return (
    <div className="flex flex-col border-b border-zinc-800 bg-zinc-950 px-8 pt-8 shrink-0 pb-0">
      {/* Title & Actions */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white mb-1">Integrations</h1>
          <p className="text-sm text-zinc-400">Connect Jötai to the tools you already use.</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-500 text-white px-4 h-9 shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all">
          <Plus className="mr-2 h-4 w-4" /> Add Integration
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 pb-3">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.name;
          return (
            <button
              key={tab.name}
              onClick={() => onTabChange(tab.name)}
              className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-zinc-800/80 border border-zinc-700 text-white"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50"
              }`}
            >
              {tab.name}
              {tab.badge && (
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] ${
                    isActive ? "bg-zinc-700 text-zinc-300" : "bg-zinc-800 text-zinc-500"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
