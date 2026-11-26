import { Calendar, Download, Target, Clock, Flame, Zap, Trophy, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { analyticsApi, AnalyticsKPIs } from "@/lib/api";
import { Period } from "@/routes/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProgressHeaderProps {
  period: Period;
  setPeriod: (p: Period) => void;
  activeTab: string;
  setActiveTab: (t: string) => void;
}

export function ProgressHeader({
  period,
  setPeriod,
  activeTab,
  setActiveTab,
}: ProgressHeaderProps) {
  const tabs = ["Overview", "Focus", "Habits", "Goals"];
  const [kpiData, setKpiData] = useState<AnalyticsKPIs | null>(null);

  useEffect(() => {
    analyticsApi.getKpis({ period }).then(setKpiData).catch(console.error);
  }, [period]);

  const formatHours = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  const kpis = [
    {
      label: "COMPLETION RATE",
      value: kpiData ? `${kpiData.completionRate}%` : "-",
      change: "—",
      vs: "vs last week",
      trend: "neutral",
      icon: Target,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
    },
    {
      label: "FOCUS TIME",
      value: kpiData ? formatHours(kpiData.focusTimeSeconds) : "-",
      change: "—",
      vs: "vs last week",
      trend: "neutral",
      icon: Clock,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      label: "BEST STREAK",
      value: kpiData ? `${kpiData.bestStreak} days` : "-",
      change: "—",
      vs: "vs last week",
      trend: "neutral",
      icon: Flame,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      label: "ACTIVE GOALS",
      value: kpiData ? kpiData.activeGoals.toString() : "-",
      change: "—",
      vs: "same as last week",
      trend: "neutral",
      icon: Zap,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      label: "TOTAL XP",
      value: kpiData ? kpiData.totalXp.toLocaleString() : "-",
      change: "—",
      vs: "vs last week",
      trend: "neutral",
      icon: Trophy,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
      border: "border-purple-400/20",
    },
  ];

  const periodLabel = {
    today: "Today",
    week: "This week",
    month: "This month",
    year: "This year",
  }[period];

  return (
    <div className="flex flex-col border-b border-zinc-800 bg-zinc-950 p-8 shrink-0 pb-0">
      {/* Title & Actions */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white mb-1">Your Progress</h1>
          <p className="text-sm text-zinc-400">Track your performance and improve every day.</p>
        </div>
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-9 border-zinc-800 bg-zinc-900/50 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
              >
                <Calendar className="mr-2 h-3.5 w-3.5 text-zinc-500" /> {periodLabel}{" "}
                <span className="ml-2 text-[10px] text-zinc-600">v</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 bg-zinc-900 border-zinc-800">
              <DropdownMenuItem
                onClick={() => setPeriod("today")}
                className="text-xs text-zinc-300 hover:bg-zinc-800 focus:bg-zinc-800"
              >
                Today
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setPeriod("week")}
                className="text-xs text-zinc-300 hover:bg-zinc-800 focus:bg-zinc-800"
              >
                This week
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setPeriod("month")}
                className="text-xs text-zinc-300 hover:bg-zinc-800 focus:bg-zinc-800"
              >
                This month
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setPeriod("year")}
                className="text-xs text-zinc-300 hover:bg-zinc-800 focus:bg-zinc-800"
              >
                This year
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            className="h-9 border-zinc-800 bg-zinc-900/50 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            <Download className="mr-2 h-3.5 w-3.5 text-zinc-500" /> Export
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-8 mb-6 border-b border-zinc-800/50 px-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === tab ? "text-purple-400" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
            )}
          </button>
        ))}
      </div>

      {/* KPIs Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
        {kpis.map((kpi, i) => (
          <div
            key={i}
            className={`flex items-center gap-4 ${i !== kpis.length - 1 ? "xl:border-r border-zinc-800/50" : ""}`}
          >
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border ${kpi.border} ${kpi.bg}`}
            >
              <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold tracking-wider text-zinc-500 mb-1">
                {kpi.label}
              </span>
              <span className="text-2xl font-light text-white leading-none mb-1">{kpi.value}</span>
              <div className="flex items-center gap-1.5 mt-1">
                {kpi.trend === "up" && <ArrowUp className="h-3 w-3 text-emerald-500" />}
                <span
                  className={`text-[10px] font-bold ${kpi.trend === "up" ? "text-emerald-500" : "text-zinc-500"}`}
                >
                  {kpi.change}
                </span>
                <span className="text-[10px] text-zinc-500">{kpi.vs}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
