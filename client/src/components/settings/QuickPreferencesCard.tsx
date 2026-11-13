import { Moon, Palette, SlidersHorizontal, ChevronRight } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";

export function QuickPreferencesCard() {
  const { settings, updateSetting } = useSettings();

  return (
    <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-white mb-1">Quick Preferences</h2>
        <p className="text-[11px] text-zinc-400">Customize your experience quickly.</p>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={() => updateSetting("theme", settings.theme === "Dark" ? "Light" : "Dark")}
          className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-zinc-900 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Moon className="h-4 w-4 text-zinc-400" />
            <span className="text-xs font-medium text-zinc-200">Theme</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-400">{settings.theme}</span>
            <ChevronRight className="h-3 w-3 text-zinc-600" />
          </div>
        </button>

        <button
          onClick={() =>
            updateSetting("accentColor", settings.accentColor === "Purple" ? "Blue" : "Purple")
          }
          className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-zinc-900 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-4 w-4 items-center justify-center rounded-full ${settings.accentColor === "Purple" ? "bg-purple-500" : "bg-blue-500"}`}
            >
              {/* Optional inner dot if we want */}
            </div>
            <span className="text-xs font-medium text-zinc-200">Accent Color</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-400">{settings.accentColor}</span>
            <ChevronRight className="h-3 w-3 text-zinc-600" />
          </div>
        </button>

        <button
          onClick={() =>
            updateSetting(
              "interfaceDensity",
              settings.interfaceDensity === "Comfortable" ? "Compact" : "Comfortable",
            )
          }
          className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-zinc-900 transition-colors"
        >
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="h-4 w-4 text-zinc-400" />
            <span className="text-xs font-medium text-zinc-200">Interface Density</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-400">{settings.interfaceDensity}</span>
            <ChevronRight className="h-3 w-3 text-zinc-600" />
          </div>
        </button>
      </div>
    </div>
  );
}
