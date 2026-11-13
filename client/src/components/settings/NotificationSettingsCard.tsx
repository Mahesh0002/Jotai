import { Bell, Clock, RefreshCcw, Calendar, Target, Sparkles, LayoutList } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";

export function NotificationSettingsCard() {
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
          <Bell className="h-4 w-4 text-purple-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white mb-0.5">Notification Settings</h2>
          <p className="text-[11px] text-zinc-400">Control what and when you're notified.</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="h-3.5 w-3.5 text-zinc-500" />
            <span className="text-xs font-medium text-zinc-300">Task due & overdue</span>
          </div>
          <Switch
            checked={settings.taskDue}
            onChange={() => updateSetting("taskDue", !settings.taskDue)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RefreshCcw className="h-3.5 w-3.5 text-zinc-500" />
            <span className="text-xs font-medium text-zinc-300">Habit reminders</span>
          </div>
          <Switch
            checked={settings.habitReminders}
            onChange={() => updateSetting("habitReminders", !settings.habitReminders)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-3.5 w-3.5 text-zinc-500" />
            <span className="text-xs font-medium text-zinc-300">Calendar events</span>
          </div>
          <Switch
            checked={settings.calendarEvents}
            onChange={() => updateSetting("calendarEvents", !settings.calendarEvents)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="h-3.5 w-3.5 text-zinc-500" />
            <span className="text-xs font-medium text-zinc-300">Focus session completed</span>
          </div>
          <Switch
            checked={settings.focusSessionCompleted}
            onChange={() => updateSetting("focusSessionCompleted", !settings.focusSessionCompleted)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-3.5 w-3.5 text-zinc-500" />
            <span className="text-xs font-medium text-zinc-300">AI insights & suggestions</span>
          </div>
          <Switch
            checked={settings.aiInsights}
            onChange={() => updateSetting("aiInsights", !settings.aiInsights)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LayoutList className="h-3.5 w-3.5 text-zinc-500" />
            <span className="text-xs font-medium text-zinc-300">Weekly summary</span>
          </div>
          <Switch
            checked={settings.weeklySummary}
            onChange={() => updateSetting("weeklySummary", !settings.weeklySummary)}
          />
        </div>

        <button className="mt-2 flex w-full items-center justify-center gap-2 rounded border border-zinc-800 bg-zinc-900/30 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors">
          <Clock className="h-3 w-3" /> Manage Quiet Hours
        </button>
      </div>
    </div>
  );
}
