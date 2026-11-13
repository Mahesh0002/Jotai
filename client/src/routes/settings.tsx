import { createFileRoute } from "@tanstack/react-router";
import { SettingsSidebar } from "@/components/settings/SettingsSidebar";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { ProfileCard } from "@/components/settings/ProfileCard";
import { QuickPreferencesCard } from "@/components/settings/QuickPreferencesCard";
import { FocusSettingsCard } from "@/components/settings/FocusSettingsCard";
import { NotificationSettingsCard } from "@/components/settings/NotificationSettingsCard";
import { AiAssistantCard } from "@/components/settings/AiAssistantCard";
import { IntegrationsSettingsCard } from "@/components/settings/IntegrationsSettingsCard";
import { DataExportCard } from "@/components/settings/DataExportCard";
import { KeyboardShortcutsCard } from "@/components/settings/KeyboardShortcutsCard";
import { DangerZoneCard } from "@/components/settings/DangerZoneCard";
import { SettingsStatusBar } from "@/components/settings/SettingsStatusBar";

export const Route = createFileRoute("/settings")({
  component: Settings,
});

function Settings() {
  return (
    <div className="flex h-screen w-full bg-zinc-950 font-sans text-zinc-200 overflow-hidden">
      {/* Dedicated Settings Sidebar */}
      <SettingsSidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col h-full relative">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <SettingsHeader />

          {/* Cards Grid */}
          <div className="flex flex-col gap-8 pb-10">
            {/* Top Row: Profile (spanning 2) & Quick Preferences */}
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2">
                <ProfileCard />
              </div>
              <div className="col-span-1">
                <QuickPreferencesCard />
              </div>
            </div>

            {/* Grid of feature settings */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              <FocusSettingsCard />
              <NotificationSettingsCard />
              <AiAssistantCard />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              <IntegrationsSettingsCard />
              <DataExportCard />
              <KeyboardShortcutsCard />
            </div>

            {/* Danger Zone takes full width */}
            <DangerZoneCard />
          </div>
        </div>

        {/* Fixed Status Bar at the bottom */}
        <SettingsStatusBar />
      </div>
    </div>
  );
}
