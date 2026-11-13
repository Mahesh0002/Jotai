import { Camera, ChevronDown } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ProfileCard() {
  const { settings, updateSetting } = useSettings();
  const initials = getInitials(settings.displayName || "JR");

  return (
    <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-white mb-1">Profile</h2>
        <p className="text-[11px] text-zinc-400">Your basic Jōtai identity and preferences.</p>
      </div>

      <div className="flex gap-8">
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-4 shrink-0">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-purple-600 text-3xl font-bold text-white shadow-[0_0_15px_rgba(147,51,234,0.3)]">
              {initials}
            </div>
            <button className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-zinc-300 hover:text-white transition-colors">
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>
          <button className="rounded bg-purple-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-purple-500 transition-colors w-full">
            Edit Profile
          </button>
        </div>

        {/* Inputs Section */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 flex-1">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-zinc-400">Display Name</label>
            <input
              type="text"
              value={settings.displayName}
              onChange={(e) => updateSetting("displayName", e.target.value)}
              className="h-9 w-full rounded border border-zinc-800 bg-zinc-900/50 px-3 text-sm text-zinc-200 focus:border-purple-500/50 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-zinc-400">Timezone</label>
            <div className="relative">
              <select
                value={settings.timezone}
                onChange={(e) => updateSetting("timezone", e.target.value)}
                className="h-9 w-full appearance-none rounded border border-zinc-800 bg-zinc-900/50 pl-3 pr-8 text-sm text-zinc-200 focus:border-purple-500/50 focus:outline-none transition-colors"
              >
                <option>Asia/Kolkata (GMT +5:30)</option>
                <option>America/New_York (GMT -5:00)</option>
                <option>Europe/London (GMT +0:00)</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-zinc-400">Username</label>
            <input
              type="text"
              value={settings.username}
              onChange={(e) => updateSetting("username", e.target.value)}
              className="h-9 w-full rounded border border-zinc-800 bg-zinc-900/50 px-3 text-sm text-zinc-200 focus:border-purple-500/50 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-zinc-400">Week starts on</label>
            <div className="relative">
              <select
                value={settings.weekStartsOn}
                onChange={(e) => updateSetting("weekStartsOn", e.target.value)}
                className="h-9 w-full appearance-none rounded border border-zinc-800 bg-zinc-900/50 pl-3 pr-8 text-sm text-zinc-200 focus:border-purple-500/50 focus:outline-none transition-colors"
              >
                <option>Monday</option>
                <option>Sunday</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

