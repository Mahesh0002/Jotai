import { useState, useEffect } from "react";
import { RefreshCw, Calendar, Music, Github, FileText, Trello, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  isSpotifyConnected,
  isGitHubConnected,
  getGitHubConnection,
  getSpotifyTokens,
} from "@/lib/integrations-store";

type ServiceCard = {
  id: string;
  name: string;
  icon: React.ReactNode;
  isConnected: boolean;
  syncTime: string;
  stats: string[];
};

type Props = {
  onSelectIntegration: (name: string) => void;
  selectedIntegration: string | null;
};

export function ConnectedIntegrations({ onSelectIntegration, selectedIntegration }: Props) {
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [githubConnected, setGitHubConnected] = useState(false);
  const [githubLogin, setGitHubLogin] = useState("");

  // Re-check connection state on mount and after tab focus
  const refresh = () => {
    setSpotifyConnected(isSpotifyConnected());
    const gh = isGitHubConnected();
    setGitHubConnected(gh);
    if (gh) setGitHubLogin(getGitHubConnection()?.login || "");
  };

  useEffect(() => {
    refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);

  const services: ServiceCard[] = [
    {
      id: "Google Calendar",
      name: "Google Calendar",
      icon: (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
          <Calendar className="h-5 w-5" />
        </div>
      ),
      isConnected: true, // Static for now; real auth TBD
      syncTime: "2 minutes ago",
      stats: ["24 events imported", "3 calendars"],
    },
    {
      id: "Spotify",
      name: "Spotify",
      icon: (
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
            spotifyConnected
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-zinc-800/50 border-zinc-700 text-zinc-500"
          }`}
        >
          <Music className="h-5 w-5" />
        </div>
      ),
      isConnected: spotifyConnected,
      syncTime: spotifyConnected ? "Live" : "—",
      stats: spotifyConnected
        ? ["Playback control enabled", "Focus playlists active"]
        : ["Not connected", "Click to connect"],
    },
    {
      id: "GitHub",
      name: "GitHub",
      icon: (
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
            githubConnected
              ? "bg-zinc-100/10 border-zinc-100/20 text-zinc-200"
              : "bg-zinc-800/50 border-zinc-700 text-zinc-500"
          }`}
        >
          <Github className="h-5 w-5" />
        </div>
      ),
      isConnected: githubConnected,
      syncTime: githubConnected ? "Live" : "—",
      stats: githubConnected
        ? [`@${githubLogin}`, "Commits & PRs synced"]
        : ["Not connected", "Click to connect"],
    },
    {
      id: "Notion",
      name: "Notion",
      icon: (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100/10 border border-zinc-100/20 text-zinc-200">
          <FileText className="h-5 w-5" />
        </div>
      ),
      isConnected: false,
      syncTime: "—",
      stats: ["Not connected", "Click to connect"],
    },
    {
      id: "Trello",
      name: "Trello",
      icon: (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
          <Trello className="h-5 w-5" />
        </div>
      ),
      isConnected: false,
      syncTime: "—",
      stats: ["Not connected", "Click to connect"],
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 pl-1">
        Services
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((item) => {
          const isSelected = selectedIntegration === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectIntegration(item.id)}
              className={`flex flex-col rounded-xl border p-5 shadow-sm transition-all text-left ${
                isSelected
                  ? "border-purple-500/40 bg-purple-500/5"
                  : item.isConnected
                    ? "border-zinc-700 bg-zinc-900/30 hover:bg-zinc-900/50 hover:border-zinc-600"
                    : "border-zinc-800 bg-zinc-900/20 hover:bg-zinc-900/40 hover:border-zinc-700"
              }`}
            >
              <div className="flex justify-between mb-4">
                <div className="flex gap-3">
                  {item.icon}
                  <div className="flex flex-col">
                    <h3 className="text-sm font-semibold text-white">{item.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div
                        className={`h-1.5 w-1.5 rounded-full ${
                          item.isConnected
                            ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                            : "bg-zinc-600"
                        }`}
                      />
                      <span
                        className={`text-[10px] font-medium ${item.isConnected ? "text-emerald-500" : "text-zinc-500"}`}
                      >
                        {item.isConnected ? "Connected" : "Not connected"}
                      </span>
                    </div>
                    {item.isConnected && (
                      <div className="flex items-center gap-1 mt-0.5 text-[10px] text-zinc-500">
                        <RefreshCw className="h-3 w-3" />
                        <span>Synced {item.syncTime}</span>
                      </div>
                    )}
                  </div>
                </div>
                <ChevronRight
                  className={`h-4 w-4 text-zinc-600 transition-transform ${isSelected ? "rotate-90 text-purple-400" : ""}`}
                />
              </div>

              <div className="flex flex-col gap-1 mb-4 flex-1 text-[11px] text-zinc-400">
                {item.stats.map((stat, idx) => (
                  <span key={idx}>{stat}</span>
                ))}
              </div>

              <div className="flex items-center gap-2 mt-auto">
                {item.isConnected ? (
                  <>
                    <div className="flex-1 h-7 rounded border border-zinc-700 bg-zinc-800/50 flex items-center justify-center text-[10px] font-medium text-zinc-300">
                      <RefreshCw className="mr-1.5 h-3 w-3" /> Synced Live
                    </div>
                    <Button
                      variant="outline"
                      className="h-7 border-zinc-700 bg-transparent text-[10px] font-medium text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 px-3"
                    >
                      Manage
                    </Button>
                  </>
                ) : (
                  <div className="flex-1 h-7 rounded border border-purple-500/30 bg-purple-500/10 flex items-center justify-center text-[10px] font-semibold text-purple-400">
                    Connect →
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
