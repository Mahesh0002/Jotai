import { CheckCircle2, Clock, AlertTriangle, Briefcase, ArrowUp, ArrowDown } from "lucide-react";

export function TasksInsights() {
  return (
    <div className="flex h-24 w-full shrink-0 items-center justify-between border-t border-zinc-800 bg-zinc-950 px-8 py-4">
      {/* KPI 1: Tasks completed */}
      <div className="flex flex-1 items-center gap-4 border-r border-zinc-800 pr-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-medium text-zinc-500">Tasks completed</span>
          <div className="flex items-end gap-2">
            <span className="text-xl font-light text-white leading-none mt-1">12</span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-[10px] font-medium text-emerald-500">
            <ArrowUp className="h-3 w-3" /> 20% <span className="text-zinc-500">vs last week</span>
          </div>
        </div>
      </div>

      {/* KPI 2: Focus time from tasks */}
      <div className="flex flex-1 items-center gap-4 border-r border-zinc-800 px-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-400">
          <Clock className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-medium text-zinc-500">Focus time from tasks</span>
          <div className="flex items-end gap-2">
            <span className="text-xl font-light text-white leading-none mt-1">8h 45m</span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-[10px] font-medium text-emerald-500">
            <ArrowUp className="h-3 w-3" /> 18% <span className="text-zinc-500">vs last week</span>
          </div>
        </div>
      </div>

      {/* KPI 3: Overdue tasks */}
      <div className="flex flex-1 items-center gap-4 border-r border-zinc-800 px-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-500">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-medium text-zinc-500">Overdue tasks</span>
          <div className="flex items-end gap-2">
            <span className="text-xl font-light text-white leading-none mt-1">2</span>
          </div>
          <span className="mt-1 text-[10px] font-medium text-red-500">Needs attention</span>
        </div>
      </div>

      {/* KPI 4: Estimated workload */}
      <div className="flex flex-1 items-center gap-4 border-r border-zinc-800 px-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400">
          <Briefcase className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-medium text-zinc-500">Estimated workload</span>
          <div className="flex items-end gap-2">
            <span className="text-xl font-light text-white leading-none mt-1">2h 15m</span>
          </div>
          <span className="mt-1 text-[10px] font-medium text-amber-500">
            64% <span className="text-zinc-500">of available time</span>
          </span>
        </div>
      </div>

      {/* KPI 5: Weekly completion rate (Donut) */}
      <div className="flex flex-1 items-center gap-4 pl-6">
        <div
          className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
          style={{ background: "conic-gradient(from 0deg, #10b981 0% 84%, #27272a 84% 100%)" }}
        >
          <div className="absolute inset-1.5 flex items-center justify-center rounded-full bg-zinc-950">
            <span className="text-[11px] font-bold text-white">84%</span>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-medium text-zinc-500">Weekly completion rate</span>
          <div className="flex items-center gap-1 mt-1 text-[10px] font-medium text-emerald-500">
            <ArrowUp className="h-3 w-3" /> 14% <span className="text-zinc-500">vs last week</span>
          </div>
        </div>
      </div>
    </div>
  );
}
