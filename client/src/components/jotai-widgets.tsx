import { Button } from "@/components/ui/button";
import { BACKEND_API_URL, RUNNER_API_URL } from "@/lib/config";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDot,
  CloudSun,
  Flame,
  GripVertical,
  Headphones,
  HeartPulse,
  Menu,
  MoreHorizontal,
  Pause,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Search,
  Settings2,
  Sparkles,
  Target,
  TimerReset,
  TrendingUp,
  Trophy,
  Trash2,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useState, useEffect, type ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { useSettings } from "@/contexts/SettingsContext";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export type Goal = {
  id: string;
  title: string;
  detail: string;
  tag: string;
  complete: boolean;
};

export type Habit = {
  id: string;
  name: string;
  streak: number;
  progress: number;
  color: "purple" | "yellow" | "emerald";
};

type WidgetProps = {
  children: ReactNode;
  title: string;
  eyebrow?: string;
  icon: ReactNode;
  accent?: "purple" | "yellow" | "emerald" | "coral" | "cyan";
  className?: string;
  onRemove?: () => void;
};

export function WidgetShell({
  children,
  title,
  eyebrow,
  icon,
  accent = "purple",
  className = "",
  onRemove,
}: WidgetProps) {
  return (
    <section className={`widget-shell group relative h-full ${className}`}>
      <div className="widget-topbar drag-handle flex shrink-0 items-center justify-between border-b border-border/70 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`icon-badge icon-badge-${accent}`}>{icon}</span>
          <div className="min-w-0">
            {eyebrow && <p className="section-eyebrow truncate">{eyebrow}</p>}
            <h2 className="truncate text-sm font-semibold tracking-tight text-foreground">
              {title}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-70 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground"
            aria-label={`Drag ${title}`}
          >
            <GripVertical className="size-4" />
          </Button>
          {onRemove && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={onRemove}
              aria-label={`Remove ${title}`}
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
    </section>
  );
}

export function UserProfileWidget({
  xp,
  maxXp,
  streak,
}: {
  xp: number;
  maxXp: number;
  streak: number;
}) {
  const { settings } = useSettings();
  const initials = getInitials(settings.displayName || "JR");
  const percentage = Math.round((xp / maxXp) * 100);
  return (
    <section className="profile-banner relative overflow-hidden rounded-xl border border-purple-400/25 bg-surface/90 p-5 shadow-panel">
      <div className="absolute inset-y-0 right-0 w-1/3 bg-grid-fade opacity-40" />
      <div className="relative flex h-full flex-col justify-between gap-5 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <div className="profile-avatar">
            <span>{initials}</span>
            <i />
          </div>
          <div>
            <p className="section-eyebrow text-purple-300">PLAYER PROFILE / ONLINE</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                {settings.displayName}
              </h1>
              <span className="mono-label text-yellow-300">LVL 08</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Focus architect · Tokyo sector</p>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-3 md:max-w-xl">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="section-eyebrow">NEXT LEVEL</p>
              <p className="mt-1 font-mono text-lg tabular-nums tracking-tight text-foreground">
                {xp.toLocaleString()}
                <span className="text-muted-foreground"> / {maxXp.toLocaleString()} XP</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Flame className="size-4 text-yellow-300" />
              <span className="font-mono text-sm tabular-nums text-yellow-300">
                {streak} day streak
              </span>
            </div>
          </div>
          <div className="xp-track">
            <div className="xp-fill" style={{ width: `${percentage}%` }} />
          </div>
          <div className="flex justify-between text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            <span>Current progress</span>
            <span className="font-mono text-purple-300">{percentage}%</span>
          </div>
        </div>
        <div className="hidden h-14 w-px bg-border md:block" />
        <div className="min-w-[104px]">
          <p className="section-eyebrow">TODAY</p>
          <p className="mt-1 font-display text-3xl font-semibold tabular-nums text-foreground">
            04<span className="text-xl text-muted-foreground"> / 07</span>
          </p>
          <p className="text-xs text-muted-foreground">quests cleared</p>
        </div>
      </div>
    </section>
  );
}

export function DailyQuestWidget({
  goals,
  onToggle,
  onDelete,
  onAdd,
}: {
  goals: Goal[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <WidgetShell
      title="Daily quests"
      eyebrow="MISSION CONTROL"
      icon={<Target className="size-4" />}
      accent="coral"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Tuesday, 08 October</p>
          <p className="mt-1 text-sm text-foreground">
            <span className="font-mono tabular-nums text-coral">
              {goals.filter((goal) => goal.complete).length}
            </span>{" "}
            of {goals.length} complete
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-border bg-transparent text-xs"
          onClick={onAdd}
        >
          <Plus className="size-3.5" /> New quest
        </Button>
      </div>
      <div className="space-y-2">
        {goals.map((goal) => (
          <div
            key={goal.id}
            className={`quest-row group/quest ${goal.complete ? "quest-row-complete" : ""}`}
          >
            <button
              className={`quest-check ${goal.complete ? "quest-check-complete" : ""}`}
              onClick={() => onToggle(goal.id)}
              aria-label={`Mark ${goal.title} ${goal.complete ? "incomplete" : "complete"}`}
            >
              <Check className="size-3.5" />
            </button>
            <div className="min-w-0 flex-1">
              <p
                className={`truncate text-sm font-medium ${goal.complete ? "text-muted-foreground line-through" : "text-foreground"}`}
              >
                {goal.title}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{goal.detail}</p>
            </div>
            <span className="hidden rounded border border-border px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground sm:block">
              {goal.tag}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground opacity-0 transition-opacity group-hover/quest:opacity-100"
              onClick={() => onDelete(goal.id)}
              aria-label={`Delete ${goal.title}`}
            >
              <X className="size-3.5" />
            </Button>
          </div>
        ))}
      </div>
      <div className="mt-5 border-t border-border/70 pt-4">
        <div className="flex justify-between text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          <span>Daily completion</span>
          <span className="font-mono text-coral">
            {Math.round((goals.filter((goal) => goal.complete).length / goals.length) * 100)}%
          </span>
        </div>
        <div className="mini-track mt-2">
          <div
            className="mini-fill mini-fill-coral"
            style={{
              width: `${(goals.filter((goal) => goal.complete).length / goals.length) * 100}%`,
            }}
          />
        </div>
      </div>
    </WidgetShell>
  );
}

export function StatsWidget({
  stats,
}: {
  stats: Array<{
    label: string;
    value: string;
    target: string;
    percent: number;
    icon: ReactNode;
    accent: string;
  }>;
}) {
  return (
    <WidgetShell
      title="Player stats"
      eyebrow="BODY / MIND"
      icon={<Activity className="size-4" />}
      accent="emerald"
    >
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-tile">
            <div className={`stat-icon ${stat.accent}`}>{stat.icon}</div>
            <p className="mt-3 text-[11px] text-muted-foreground">{stat.label}</p>
            <p className="mt-1 font-mono text-lg font-medium tabular-nums tracking-tight text-foreground">
              {stat.value}
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">of {stat.target}</p>
            <div className="mini-track mt-3">
              <div className={`mini-fill ${stat.accent}`} style={{ width: `${stat.percent}%` }} />
            </div>
          </div>
        ))}
      </div>
    </WidgetShell>
  );
}

export function FocusTimerWidget({
  seconds,
  running,
  sessions,
  onToggle,
  onReset,
}: {
  seconds: number;
  running: boolean;
  sessions: number;
  onToggle: () => void;
  onReset: () => void;
}) {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const remaining = String(seconds % 60).padStart(2, "0");
  const progress = Math.max(0, Math.min(1, seconds / (25 * 60)));
  return (
    <WidgetShell
      title="Focus mode"
      eyebrow="DEEP WORK PROTOCOL"
      icon={<TimerReset className="size-4" />}
      accent="purple"
    >
      <div className="flex h-full min-h-[250px] flex-col items-center justify-between py-4 px-2">
        <div className="flex-1 flex flex-col items-center justify-center w-full py-8">
          <div className="timer-ring" style={{ "--timer-progress": progress } as React.CSSProperties}>
            <div className="timer-core">
              <span className="section-eyebrow">{running ? "IN SESSION" : "READY"}</span>
              <span className="mt-1 font-mono text-4xl font-medium tabular-nums tracking-tight text-foreground">
                {minutes}:{remaining}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 mb-6 mt-2">
          <Button
            variant="outline"
            size="icon"
            className="border-border bg-transparent"
            onClick={onReset}
            aria-label="Reset timer"
          >
            <RotateCcw className="size-4" />
          </Button>
          <Button
            variant="default"
            size="lg"
            className="min-w-28 bg-purple-500 text-primary-foreground shadow-glow hover:bg-purple-400"
            onClick={onToggle}
          >
            {running ? <Pause className="size-4" /> : <Play className="size-4" />}
            {running ? "Pause" : "Start"}
          </Button>
        </div>
        <div className="flex w-full items-center justify-between border-t border-border/70 pt-3 text-xs mt-auto">
          <span className="text-muted-foreground">Sessions today</span>
          <span className="font-mono tabular-nums text-purple-300">
            {sessions} <span className="text-muted-foreground">/ 06</span>
          </span>
        </div>
      </div>
    </WidgetShell>
  );
}

export function HabitTrackerWidget({
  habits,
  onCheckIn,
}: {
  habits: Habit[];
  onCheckIn: (id: string) => void;
}) {
  return (
    <WidgetShell
      title="Habit loop"
      eyebrow="CONSISTENCY ENGINE"
      icon={<CircleDot className="size-4" />}
      accent="yellow"
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Your weekly rhythm</p>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground"
          aria-label="Habit settings"
        >
          <Settings2 className="size-4" />
        </Button>
      </div>
      <div className="space-y-4">
        {habits.map((habit) => (
          <div key={habit.id}>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`status-dot ${habit.color}`} />
                <span className="text-sm text-foreground">{habit.name}</span>
              </div>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {habit.streak}d streak
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="mini-track flex-1">
                <div
                  className={`mini-fill mini-fill-${habit.color}`}
                  style={{ width: `${habit.progress}%` }}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 border-border bg-transparent px-2 text-[10px]"
                onClick={() => onCheckIn(habit.id)}
              >
                <Check className="size-3" /> Check in
              </Button>
            </div>
          </div>
        ))}
      </div>
    </WidgetShell>
  );
}

export function NewsWidget() {
  const [news, setNews] = useState<{
    title: string;
    description: string;
    date: string;
    category: string;
  }>({
    title: "The quiet power of designing a life around your attention",
    description:
      "A new generation of tools is treating focus as a finite resource — and making space for better work.",
    date: "08",
    category: "Productivity / Culture",
  });

  useEffect(() => {
    fetch(`${BACKEND_API_URL}/news`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data.length > 0) {
          const article = data.data[0];
          setNews({
            title: article.title,
            description: article.description,
            date: new Date(article.publishedAt).getDate().toString().padStart(2, "0"),
            category: "LATEST / TECH",
          });
        }
      })
      .catch(console.error);
  }, []);

  return (
    <WidgetShell
      title="News dispatch"
      eyebrow="SIGNAL FEED / 09:41"
      icon={<Sparkles className="size-4" />}
      accent="cyan"
    >
      <div className="news-art">
        <div className="news-art-lines" />
        <span className="news-art-label">
          FIELD
          <br />
          NOTES
          <br />
          <b>{news.date}</b>
        </span>
        <ArrowUpRight className="absolute right-3 top-3 size-4 text-cyan-200" />
      </div>
      <p className="mt-4 text-[10px] uppercase tracking-[0.16em] text-cyan-300">{news.category}</p>
      <h3 className="mt-2 text-base font-medium leading-snug text-foreground">{news.title}</h3>
      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
        {news.description}
      </p>
    </WidgetShell>
  );
}

export function MarketWidget() {
  const [markets, setMarkets] = useState([
    { symbol: "NIKKEI", value: "39,332", change: "+1.12%", positive: true },
    { symbol: "BTC/USD", value: "62,418", change: "+0.84%", positive: true },
    { symbol: "ETH/USD", value: "3,421", change: "−0.26%", positive: false },
  ]);

  useEffect(() => {
    fetch(`${BACKEND_API_URL}/stocks?symbol=BTC/USD`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          const btc = data.data;
          setMarkets((current) =>
            current.map((m) =>
              m.symbol === "BTC/USD"
                ? {
                    ...m,
                    value: parseFloat(btc.price).toLocaleString(),
                    change: `${parseFloat(btc.change) > 0 ? "+" : ""}${btc.percent_change}%`,
                    positive: parseFloat(btc.change) >= 0,
                  }
                : m,
            ),
          );
        }
      })
      .catch(console.error);
  }, []);

  return (
    <WidgetShell
      title="Market watch"
      eyebrow="LIVE MARKETS"
      icon={<TrendingUp className="size-4" />}
      accent="yellow"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Tracked instruments</p>
        <span className="live-indicator">
          <i /> live
        </span>
      </div>
      <div className="space-y-1">
        {markets.map((market) => (
          <div key={market.symbol} className="market-row">
            <span className="font-mono text-[11px] text-muted-foreground">{market.symbol}</span>
            <span className="ml-auto font-mono text-xs tabular-nums text-foreground">
              {market.value}
            </span>
            <span
              className={`ml-3 w-14 text-right font-mono text-[11px] tabular-nums ${market.positive ? "text-emerald-300" : "text-coral"}`}
            >
              {market.change}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 border-t border-border/70 pt-3 text-[10px] text-muted-foreground">
        <TrendingUp className="size-3 text-yellow-300" /> Global sentiment{" "}
        <span className="font-mono text-yellow-300">+68</span>
      </div>
    </WidgetShell>
  );
}

export function WeatherWidget() {
  const [weather, setWeather] = useState({
    temp: 18,
    condition: "Partly cloudy",
    feels_like: 17,
    humidity: 62,
    wind: 12,
  });

  useEffect(() => {
    fetch(`${BACKEND_API_URL}/weather?city=Tokyo`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          const w = data.data;
          setWeather({
            temp: Math.round(w.current.temp_c),
            condition: w.current.condition.text,
            feels_like: Math.round(w.current.feelslike_c),
            humidity: w.current.humidity,
            wind: Math.round(w.current.wind_kph),
          });
        }
      })
      .catch(console.error);
  }, []);

  return (
    <WidgetShell
      title="Weather radar"
      eyebrow="TOKYO / 35.68° N"
      icon={<CloudSun className="size-4" />}
      accent="cyan"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-display text-4xl font-semibold tracking-tight text-foreground">
            {weather.temp}°
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{weather.condition}</p>
        </div>
        <CloudSun className="size-12 stroke-[1.25] text-cyan-300" />
      </div>
      <div className="weather-line mt-5">
        <span>
          Feels like <b>{weather.feels_like}°</b>
        </span>
        <span>
          Humidity <b>{weather.humidity}%</b>
        </span>
        <span>
          Wind <b>{weather.wind} km/h</b>
        </span>
      </div>
      <div className="mt-5 grid grid-cols-4 gap-2">
        {["NOW", "13:00", "16:00", "19:00"].map((time, index) => (
          <div key={time} className="text-center">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{time}</p>
            <CloudSun
              className={`mx-auto my-2 size-4 ${index === 2 ? "text-yellow-300" : "text-cyan-300"}`}
            />
            <p className="font-mono text-xs tabular-nums text-foreground">
              {[weather.temp, weather.temp + 2, weather.temp + 1, weather.temp - 2][index]}°
            </p>
          </div>
        ))}
      </div>
    </WidgetShell>
  );
}

export function AnalyticsWidget({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  const tabs = ["Overview", "Focus", "Habits"];
  const metrics = [
    {
      label: "Completion rate",
      value: "84.6%",
      change: "+12.4%",
      icon: <Target className="size-4" />,
    },
    {
      label: "Active streak",
      value: "12 days",
      change: "+3 days",
      icon: <Flame className="size-4" />,
    },
    {
      label: "Active goals",
      value: "07",
      change: "+2 this week",
      icon: <Zap className="size-4" />,
    },
    {
      label: "Focus time",
      value: "18h 42m",
      change: "+4h 12m",
      icon: <Headphones className="size-4" />,
    },
  ];
  return (
    <WidgetShell
      title="Analytics center"
      eyebrow="PERFORMANCE TELEMETRY"
      icon={<BarChart3 className="size-4" />}
      accent="purple"
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="segmented-control">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={activeTab === tab ? "active" : ""}
              onClick={() => onTabChange(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground"
          aria-label="Analytics options"
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="metric-card">
            <div className="flex items-center justify-between text-muted-foreground">
              {metric.icon}
              <span className="font-mono text-[10px] text-emerald-300">{metric.change}</span>
            </div>
            <p className="mt-4 text-[10px] uppercase tracking-wider text-muted-foreground">
              {metric.label}
            </p>
            <p className="mt-1 font-mono text-xl font-medium tabular-nums tracking-tight text-foreground">
              {metric.value}
            </p>
          </div>
        ))}
      </div>
      <div className="chart-area mt-4">
        <div className="chart-grid-lines" />{" "}
        <div className="chart-labels">
          <span>20h</span>
          <span>15h</span>
          <span>10h</span>
          <span>05h</span>
          <span>00h</span>
        </div>
        <svg
          viewBox="0 0 700 140"
          preserveAspectRatio="none"
          className="relative z-10 h-full w-full"
        >
          <defs>
            <linearGradient id="areaFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="var(--chart-glow)" stopOpacity="0.34" />
              <stop offset="1" stopColor="var(--chart-glow)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0 114 C65 102, 78 82, 138 92 S205 54, 260 72 S330 89, 388 50 S450 68, 510 42 S580 56, 630 22 S675 43, 700 12 L700 140 L0 140 Z"
            fill="url(#areaFill)"
          />
          <path
            d="M0 114 C65 102, 78 82, 138 92 S205 54, 260 72 S330 89, 388 50 S450 68, 510 42 S580 56, 630 22 S675 43, 700 12"
            fill="none"
            stroke="var(--chart-glow)"
            strokeWidth="2"
          />
        </svg>
        <div className="chart-axis">
          <span>MON</span>
          <span>TUE</span>
          <span>WED</span>
          <span>THU</span>
          <span>FRI</span>
          <span>SAT</span>
          <span>SUN</span>
        </div>
      </div>
    </WidgetShell>
  );
}

export function IntegrationsModal({
  open,
  integrations,
  onToggle,
  onClose,
}: {
  open: boolean;
  integrations: Record<string, boolean>;
  onToggle: (id: string) => void;
  onClose: () => void;
}) {
  if (!open) return null;
  const services = [
    {
      id: "calendar",
      name: "Google Calendar",
      detail: "Sync events and deadlines",
      mark: "G",
      tone: "google",
    },
    { id: "notion", name: "Notion", detail: "Import tasks and notes", mark: "N", tone: "notion" },
    {
      id: "spotify",
      name: "Spotify",
      detail: "Control focus playlists",
      mark: "S",
      tone: "spotify",
    },
    { id: "github", name: "GitHub", detail: "Track project activity", mark: "⌘", tone: "github" },
    { id: "trello", name: "Trello", detail: "Sync boards and cards", mark: "▦", tone: "trello" },
  ];
  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="integrations-title"
    >
      <div className="modal-panel">
        <div className="flex items-start justify-between border-b border-border/70 px-5 py-4">
          <div>
            <p className="section-eyebrow text-purple-300">SYSTEM EXTENSIONS</p>
            <h2
              id="integrations-title"
              className="mt-1 text-lg font-semibold tracking-tight text-foreground"
            >
              Integrations
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Connect the tools that keep your flow moving.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground"
            onClick={onClose}
            aria-label="Close integrations"
          >
            <X className="size-4" />
          </Button>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2">
          {services.map((service) => {
            const connected = integrations[service.id];
            return (
              <div key={service.id} className="integration-card">
                <div className={`service-mark ${service.tone}`}>{service.mark}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{service.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{service.detail}</p>
                </div>
                <Button
                  variant={connected ? "secondary" : "outline"}
                  size="sm"
                  className="h-8 shrink-0 border-border bg-transparent text-xs"
                  onClick={() => onToggle(service.id)}
                >
                  {connected ? (
                    <>
                      <Check className="size-3" /> On
                    </>
                  ) : (
                    "Connect"
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function DashboardHeader({ onOpenIntegrations }: { onOpenIntegrations: () => void }) {
  const location = useLocation();
  const navItems = [
    { name: "Today", path: "/" },
    { name: "Progress", path: "/progress" },
    { name: "Insights", path: "/insights" },
  ];

  return (
    <header className="dashboard-header">
      <div className="flex items-center gap-3">
        <div className="brand-mark">
          <Zap className="size-4 fill-current" />
        </div>
        <span className="font-display text-lg font-semibold tracking-tight text-foreground">
          Jōtai
        </span>
        <span className="hidden border-l border-border pl-3 text-[10px] uppercase tracking-[0.16em] text-muted-foreground sm:block">
          Personal operating system
        </span>
      </div>
      <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-md h-8 px-3 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${location.pathname === item.path ? "bg-secondary text-foreground" : "text-muted-foreground"}`}
          >
            {item.name}
          </Link>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-2">
        <div className="quick-stat">
          <span className="status-dot emerald" /> <span className="hidden sm:inline">SYSTEM</span>{" "}
          <b>98%</b>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 border-border bg-transparent"
          onClick={onOpenIntegrations}
          aria-label="Open integrations"
        >
          <Settings2 className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </Button>
        <div className="header-avatar">JR</div>
      </div>
    </header>
  );
}

export type Note = {
  id: string;
  text: string;
};

export function NotepadWidget() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [inputText, setInputText] = useState("");

  const handleAddNote = () => {
    if (inputText.trim()) {
      setNotes((current) => [
        ...current,
        { id: Math.random().toString(36).substring(7), text: inputText },
      ]);
      setInputText("");
    }
  };

  const handleRemoveNote = (id: string) => {
    setNotes((current) => current.filter((note) => note.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddNote();
    }
  };

  return (
    <WidgetShell title="Quick Notes" icon={<Pencil className="size-4" />}>
      <div className="flex h-full flex-col gap-3 pt-2">
        <div className="relative">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your notes..."
            className="w-full resize-none rounded-lg border border-border bg-surface p-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-purple-500/50 focus:outline-none"
            rows={2}
          />
          <button
            onClick={handleAddNote}
            disabled={!inputText.trim()}
            className="absolute bottom-3 right-3 flex size-6 items-center justify-center rounded-md bg-purple-500 text-white disabled:opacity-50"
          >
            <Plus className="size-3" strokeWidth={3} />
          </button>
        </div>
        <ul className="custom-scrollbar flex max-h-[140px] flex-col gap-2 overflow-y-auto">
          {notes.map((note) => (
            <li
              key={note.id}
              className="group flex items-start justify-between gap-2 rounded-lg border border-border bg-surface/50 p-2 text-sm transition-colors hover:border-border/80"
            >
              <span className="whitespace-pre-wrap break-words">{note.text}</span>
              <button
                onClick={() => handleRemoveNote(note.id)}
                className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400"
              >
                <Trash2 className="size-3" />
              </button>
            </li>
          ))}
          {notes.length === 0 && (
            <li className="mt-2 text-center text-xs italic text-muted-foreground">
              No notes yet. Start typing above!
            </li>
          )}
        </ul>
      </div>
    </WidgetShell>
  );
}
