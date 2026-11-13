import { Keyboard, ChevronRight, ExternalLink } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";

export function KeyboardShortcutsCard() {
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
          <Keyboard className="h-4 w-4 text-purple-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white mb-0.5">Keyboard Shortcuts</h2>
          <p className="text-[11px] text-zinc-400">Boost your productivity.</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <button className="flex items-center justify-between hover:bg-zinc-900/50 -mx-2 px-2 py-1 rounded transition-colors">
          <span className="text-xs font-medium text-zinc-300">View all shortcuts</span>
          <ChevronRight className="h-3.5 w-3.5 text-zinc-500" />
        </button>

        <button className="flex items-center justify-between pb-3 border-b border-zinc-800/50 hover:bg-zinc-900/50 -mx-2 px-2 py-1 rounded transition-colors">
          <span className="text-xs font-medium text-zinc-300">Customize shortcuts</span>
          <ChevronRight className="h-3.5 w-3.5 text-zinc-500" />
        </button>

        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-300">Enable Vim mode</span>
          <Switch
            checked={settings.enableVimMode}
            onChange={() => updateSetting("enableVimMode", !settings.enableVimMode)}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-300">Enable command palette</span>
          <Switch
            checked={settings.enableCommandPalette}
            onChange={() => updateSetting("enableCommandPalette", !settings.enableCommandPalette)}
          />
        </div>

        <button className="mt-2 flex w-full items-center justify-center gap-2 rounded border border-zinc-800 bg-zinc-900/30 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors">
          View Cheat Sheet <ExternalLink className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
