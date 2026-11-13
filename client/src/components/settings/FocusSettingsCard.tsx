import { Target, ChevronDown, ExternalLink } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";

export function FocusSettingsCard() {
  const { settings, updateSetting } = useSettings();

  const Switch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${checked ? "bg-purple-600" : "bg-zinc-700"}`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? "translate-x-4" : "translate-x-0"}`}
      />
    </button>
  );

  return (
    <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 shadow-sm">
      <div className="flex items-start gap-3 mb-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20">
          <Target className="h-4 w-4 text-purple-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white mb-0.5">Focus Settings</h2>
          <p className="text-[11px] text-zinc-400">Manage your focus sessions.</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-300">Default session duration</span>
          <div className="relative w-28">
            <select
              value={settings.defaultSessionDuration}
              onChange={(e) => updateSetting("defaultSessionDuration", e.target.value)}
              className="h-7 w-full appearance-none rounded border border-zinc-800 bg-zinc-900/50 pl-3 pr-7 text-[11px] text-zinc-200 focus:border-purple-500/50 focus:outline-none transition-colors"
            >
              <option>15 minutes</option>
              <option>25 minutes</option>
              <option>50 minutes</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-300">Short break duration</span>
          <div className="relative w-28">
            <select
              value={settings.shortBreakDuration}
              onChange={(e) => updateSetting("shortBreakDuration", e.target.value)}
              className="h-7 w-full appearance-none rounded border border-zinc-800 bg-zinc-900/50 pl-3 pr-7 text-[11px] text-zinc-200 focus:border-purple-500/50 focus:outline-none transition-colors"
            >
              <option>5 minutes</option>
              <option>10 minutes</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-300">Long break duration</span>
          <div className="relative w-28">
            <select
              value={settings.longBreakDuration}
              onChange={(e) => updateSetting("longBreakDuration", e.target.value)}
              className="h-7 w-full appearance-none rounded border border-zinc-800 bg-zinc-900/50 pl-3 pr-7 text-[11px] text-zinc-200 focus:border-purple-500/50 focus:outline-none transition-colors"
            >
              <option>15 minutes</option>
              <option>30 minutes</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center justify-between pb-2 border-b border-zinc-800/50">
          <span className="text-xs font-medium text-zinc-300">Sessions before long break</span>
          <div className="relative w-28">
            <select
              value={settings.sessionsBeforeLongBreak}
              onChange={(e) => updateSetting("sessionsBeforeLongBreak", e.target.value)}
              className="h-7 w-full appearance-none rounded border border-zinc-800 bg-zinc-900/50 pl-3 pr-7 text-[11px] text-zinc-200 focus:border-purple-500/50 focus:outline-none transition-colors"
            >
              <option>3 sessions</option>
              <option>4 sessions</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-300">Auto-start breaks</span>
          <Switch
            checked={settings.autoStartBreaks}
            onChange={() => updateSetting("autoStartBreaks", !settings.autoStartBreaks)}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-300">Auto-start next session</span>
          <Switch
            checked={settings.autoStartNextSession}
            onChange={() => updateSetting("autoStartNextSession", !settings.autoStartNextSession)}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-300">Play notification sound</span>
          <Switch
            checked={settings.playNotificationSound}
            onChange={() => updateSetting("playNotificationSound", !settings.playNotificationSound)}
          />
        </div>

        <button className="mt-2 flex w-full items-center justify-center gap-2 rounded border border-zinc-800 bg-zinc-900/30 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors">
          Customize Focus Workspace <ExternalLink className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
