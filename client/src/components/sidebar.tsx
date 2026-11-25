import { Link, useLocation } from "@tanstack/react-router";
import {
  Zap,
  CheckSquare,
  TrendingUp,
  Lightbulb,
  Inbox,
  Calendar,
  ListTodo,
  Activity,
  Focus,
  FileText,
  Trophy,
  Sparkles,
  Flame,
} from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { useQuery } from "@tanstack/react-query";
import { preferencesApi, proposalsApi, todayApi } from "@/lib/api";
import { isGitHubConnected, isSpotifyConnected } from "@/lib/integrations-store";
import { NowPlayingWidget } from "@/components/NowPlayingWidget";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const mainNav = [
  { name: "Today", path: "/", icon: CheckSquare },
  { name: "Progress", path: "/progress", icon: TrendingUp },
  { name: "Insights", path: "/insights", icon: Lightbulb },
  { name: "Proposals", path: "/proposals", icon: Inbox },
  { name: "Calendar", path: "/calendar", icon: Calendar },
  { name: "Tasks", path: "/tasks", icon: ListTodo },
  { name: "Habits", path: "/habits", icon: Activity },
  { name: "Focus", path: "/focus", icon: Focus },
  { name: "Notes", path: "/notes", icon: FileText },
];

const integrations = [
  { name: "Google Calendar", key: "google", initial: "G", color: "text-blue-400" },
  { name: "Notion", key: "notion", initial: "N", color: "text-zinc-200" },
  { name: "Spotify", key: "spotify", initial: "S", color: "text-emerald-400" },
  { name: "GitHub", key: "github", initial: "G", color: "text-zinc-400" },
  { name: "Trello", key: "trello", initial: "T", color: "text-blue-500" },
] as const;

export function Sidebar({ onOpenIntegrations }: { onOpenIntegrations: () => void }) {
  const location = useLocation();
  const { settings } = useSettings();
  const { data: summary } = useQuery({
    queryKey: ["today-summary"],
    queryFn: todayApi.getSummary,
    staleTime: 60_000,
  });
  const { data: pendingCount } = useQuery({
    queryKey: ["proposals"],
    queryFn: () => proposalsApi.getAll(),
    select: (items) => items.filter((item) => item.status === "pending").length,
    staleTime: 30_000,
  });
  const { data: preference } = useQuery({
    queryKey: ["preferences"],
    queryFn: () => preferencesApi.get(),
    staleTime: 60_000,
  });

  const integrationStatuses = integrations.map((integration) => {
    const stored = Boolean(preference?.integrations?.[integration.key]);
    const local =
      typeof window !== "undefined" &&
      ((integration.key === "spotify" && isSpotifyConnected()) ||
        (integration.key === "github" && isGitHubConnected()));
    return { ...integration, connected: stored || local };
  });

  const initials = getInitials(settings.displayName || "JR");
  const streak = summary?.streak ?? 0;

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-zinc-800 bg-zinc-950 p-4 overflow-y-auto custom-scrollbar">
      {/* Brand */}
      <Link to="/" className="mb-8 flex flex-col gap-1 px-2">
        <div className="flex items-center gap-2 text-foreground">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-purple-500/20 text-purple-400">
            <Zap className="h-4 w-4 fill-current" />
          </div>
          <span className="font-display font-semibold tracking-tight text-lg">Jōtai</span>
        </div>
        <span className="text-[9px] uppercase tracking-[0.2em] text-zinc-500">
          Personal Operating System
        </span>
      </Link>

      {/* Main Nav */}
      <nav className="mb-8 flex flex-col gap-1">
        {mainNav.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-colors ${
              location.pathname === item.path
                ? "bg-purple-500/20 text-purple-300"
                : "text-zinc-400 hover:bg-zinc-900 hover:text-foreground"
            }`}
          >
            <item.icon
              className={`h-4 w-4 ${location.pathname === item.path ? "text-purple-400" : "text-zinc-500"}`}
            />
            {item.name}
            {item.path === "/proposals" && pendingCount ? (
              <span className="ml-auto rounded-full bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-purple-300">
                {pendingCount}
              </span>
            ) : null}
          </Link>
        ))}
      </nav>

      {/* Integrations */}
      <div className="mb-6">
        <h3 className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Integrations
        </h3>
        <div className="flex flex-col gap-1">
          {integrationStatuses.map((integration) => (
            <div
              key={integration.name}
              className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-zinc-300"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-4 w-4 items-center justify-center text-[11px] font-bold ${integration.color}`}
                >
                  {integration.initial}
                </span>
                {integration.name}
              </div>
              <span
                className={`h-1.5 w-1.5 rounded-full ${integration.connected ? "bg-emerald-500" : "bg-zinc-700"}`}
              />
            </div>
          ))}
          <Link
            to="/integrations"
            className="mt-2 px-2 text-left text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            View all
          </Link>
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-3">
        {/* Profile / Runner */}
        <Link
          to="/runner"
          className="block rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 hover:bg-zinc-800/50 hover:border-purple-500/30 transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-500/20 text-xs font-semibold text-purple-300 ring-1 ring-purple-500/30 group-hover:ring-purple-400/50 transition-all">
              {initials}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-foreground group-hover:text-purple-100 transition-colors truncate">
                {settings.displayName}
              </span>
              <span className="text-[10px] text-zinc-500 group-hover:text-zinc-400 flex items-center gap-1">
                <Trophy className="h-2.5 w-2.5" />
                Level 08
              </span>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-[10px] mb-1">
              <span className="font-mono text-zinc-300 tabular-nums">2,847</span>
              <span className="font-mono text-zinc-500 tabular-nums">/ 3,000 XP</span>
            </div>
            <div className="h-1 w-full rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)] group-hover:shadow-[0_0_15px_rgba(168,85,247,0.8)] transition-shadow"
                style={{ width: "90%" }}
              />
            </div>
          </div>
        </Link>

        {/* Streak Widget — live data from useToday */}
        <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/30 p-3">
          <Flame className="h-6 w-6 text-amber-500 fill-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
          <div className="flex flex-col">
            <span className="text-lg font-bold text-white leading-none">{streak}</span>
            <span className="text-[10px] text-zinc-400">Day streak</span>
          </div>
        </div>

        {/* Spotify Now Playing */}
        <NowPlayingWidget />

        {/* AI Assistant */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("open-ai-assistant"))}
          className="flex w-full items-center gap-3 rounded-xl border border-purple-500/20 bg-purple-500/10 p-3 text-sm font-medium text-purple-300 transition-colors hover:bg-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.05)]"
        >
          <Sparkles className="h-4 w-4" />
          AI Assistant
        </button>
      </div>
    </aside>
  );
}
