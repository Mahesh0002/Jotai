import { Calendar, Check, Minus, RefreshCw, Trash2, X, ChevronRight, Music, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SpotifyPanel } from "./SpotifyPanel";
import { GitHubPanel } from "./GitHubPanel";

type Props = {
  selectedIntegration: string | null;
  onClose: () => void;
  onConnectionChange?: (service: string, connected: boolean) => void;
};

const CALENDAR_PERMISSIONS = [
  { name: "Read events", state: "allow" },
  { name: "Create events", state: "allow" },
  { name: "Modify events", state: "allow" },
  { name: "Delete events", state: "deny" },
  { name: "Availability (free/busy)", state: "allow" },
];
const CALENDAR_SETTINGS = [
  { name: "Calendars", val: "3 selected" },
  { name: "Sync interval", val: "5 minutes" },
  { name: "Sync events", val: "Past 30 days, Future 365 days" },
];

function CalendarPanel() {
  return (
    <>
      <div className="flex items-center gap-4 mb-8">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
          <Calendar className="h-6 w-6" />
        </div>
        <div className="flex flex-col">
          <h3 className="text-sm font-semibold text-white">Google Calendar</h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-[10px] font-medium text-emerald-500">Connected</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-8 pb-8 border-b border-zinc-800/50">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-zinc-500">Connected account</span>
          <span className="text-[11px] font-medium text-zinc-200">mahesh@example.com</span>
        </div>
        <Button variant="outline" className="h-7 border-zinc-700 bg-transparent text-[10px] font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white px-3">
          Change
        </Button>
      </div>

      <div className="flex flex-col mb-8 pb-8 border-b border-zinc-800/50">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-4">Permissions</h4>
        <div className="flex flex-col gap-3">
          {CALENDAR_PERMISSIONS.map((p, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-[11px] text-zinc-300">{p.name}</span>
              {p.state === "allow" ? <Check className="h-3.5 w-3.5 text-emerald-500 stroke-[3]" /> : <Minus className="h-3.5 w-3.5 text-zinc-500 stroke-[3]" />}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col mb-8 pb-8 border-b border-zinc-800/50">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-4">Sync Settings</h4>
        <div className="flex flex-col gap-3">
          {CALENDAR_SETTINGS.map((s, i) => (
            <div key={i} className="flex items-center justify-between cursor-pointer group">
              <span className="text-[11px] text-zinc-300">{s.name}</span>
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-zinc-400 group-hover:text-zinc-300">{s.val}</span>
                <ChevronRight className="h-3 w-3 text-zinc-600 group-hover:text-zinc-400" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col mb-8">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-4">Status</h4>
        <div className="flex flex-col gap-3 mb-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-400">Last synced</span>
            <span className="text-[11px] font-medium text-zinc-200">2 minutes ago</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-400">Next sync</span>
            <span className="text-[11px] font-medium text-zinc-200">In 3 minutes</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-400">Status</span>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-medium text-emerald-500">Healthy</span>
            </div>
          </div>
        </div>
        <Button variant="outline" className="w-full h-8 border-zinc-700 bg-zinc-800/50 text-[11px] font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white">
          <RefreshCw className="mr-2 h-3.5 w-3.5" /> Sync Now
        </Button>
      </div>

      <div className="mt-auto">
        <div className="flex flex-col rounded-lg border border-red-500/20 bg-red-500/5 p-4 cursor-pointer hover:bg-red-500/10 transition-colors">
          <div className="flex items-center gap-2 mb-1">
            <Trash2 className="h-3.5 w-3.5 text-red-500" />
            <span className="text-[11px] font-semibold text-red-500">Disconnect Integration</span>
          </div>
          <span className="text-[10px] text-zinc-500 pl-5.5">This will stop syncing data from Google Calendar.</span>
        </div>
      </div>
    </>
  );
}

export function IntegrationSidebar({ selectedIntegration, onClose, onConnectionChange }: Props) {
  if (!selectedIntegration) return null;

  const title =
    selectedIntegration === "Spotify" ? "Spotify" :
    selectedIntegration === "GitHub" ? "GitHub" :
    selectedIntegration;

  const icon =
    selectedIntegration === "Spotify" ? <Music className="h-5 w-5 text-emerald-400" /> :
    selectedIntegration === "GitHub" ? <Github className="h-5 w-5 text-zinc-200" /> :
    <Calendar className="h-5 w-5 text-blue-400" />;

  return (
    <div className="flex w-[360px] shrink-0 flex-col overflow-y-auto custom-scrollbar p-6 border-l border-zinc-800/50 bg-zinc-950/70">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-sm font-semibold text-white">{title}</h2>
        </div>
        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Dynamic panel content */}
      {selectedIntegration === "Spotify" && (
        <SpotifyPanel onConnectionChange={(c) => onConnectionChange?.("Spotify", c)} />
      )}
      {selectedIntegration === "GitHub" && (
        <GitHubPanel onConnectionChange={(c) => onConnectionChange?.("GitHub", c)} />
      )}
      {selectedIntegration === "Google Calendar" && <CalendarPanel />}
      {!["Spotify", "GitHub", "Google Calendar"].includes(selectedIntegration) && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <p className="text-sm text-zinc-500">{selectedIntegration}</p>
          <p className="text-[11px] text-zinc-600">Integration settings coming soon.</p>
        </div>
      )}
    </div>
  );
}
