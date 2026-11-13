import { Sparkles, ShieldCheck, ChevronDown } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";

export function AiAssistantCard() {
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
          <Sparkles className="h-4 w-4 text-purple-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white mb-0.5">AI Assistant</h2>
          <p className="text-[11px] text-zinc-400">Configure your AI experience.</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800/50">
          <span className="text-xs font-medium text-zinc-300">AI Assistant</span>
          <Switch
            checked={settings.aiAssistant}
            onChange={() => updateSetting("aiAssistant", !settings.aiAssistant)}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-300">Personality</span>
          <div className="relative w-28">
            <select
              value={settings.personality}
              onChange={(e) => updateSetting("personality", e.target.value)}
              className="h-7 w-full appearance-none rounded border border-zinc-800 bg-zinc-900/50 pl-3 pr-7 text-[11px] text-zinc-200 focus:border-purple-500/50 focus:outline-none transition-colors"
            >
              <option>Minimal</option>
              <option>Balanced</option>
              <option>Proactive</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-300">Proactive suggestions</span>
          <Switch
            checked={settings.proactiveSuggestions}
            onChange={() => updateSetting("proactiveSuggestions", !settings.proactiveSuggestions)}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-300">Ask before making changes</span>
          <Switch
            checked={settings.askBeforeMakingChanges}
            onChange={() =>
              updateSetting("askBeforeMakingChanges", !settings.askBeforeMakingChanges)
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-300">Use history for personalization</span>
          <Switch
            checked={settings.useHistoryForPersonalization}
            onChange={() =>
              updateSetting("useHistoryForPersonalization", !settings.useHistoryForPersonalization)
            }
          />
        </div>

        <button className="mt-2 flex w-full items-center justify-center gap-2 rounded border border-zinc-800 bg-zinc-900/30 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors">
          <ShieldCheck className="h-3 w-3" /> Manage AI Permissions
        </button>
      </div>
    </div>
  );
}
