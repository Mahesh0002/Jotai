import { Info, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { analyticsApi, FocusAnalytics } from "@/lib/api";
import { Period } from "@/routes/progress";

export function FocusDonut({ period }: { period: Period }) {
  const [data, setData] = useState<FocusAnalytics | null>(null);

  useEffect(() => {
    analyticsApi.getFocus({ period }).then(setData).catch(console.error);
  }, [period]);

  const total = data ? data.total : 0;
  
  const getPercent = (val: number) => {
    if (!total) return 0;
    return (val / total) * 100;
  };

  const formatHours = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  const deepWorkPct = getPercent(data?.deepWork || 0);
  const projectWorkPct = getPercent(data?.projectWork || 0);
  const meetingsPct = getPercent(data?.meetings || 0);
  const breaksPct = getPercent(data?.breaks || 0);

  // Gradient stops
  const stop1 = deepWorkPct;
  const stop2 = stop1 + projectWorkPct;
  const stop3 = stop2 + meetingsPct;

  const displayData = [
    { label: "Deep Work", time: data ? formatHours(data.deepWork) : "-", percent: `${deepWorkPct.toFixed(1)}%`, color: "bg-purple-500" },
    { label: "Project Work", time: data ? formatHours(data.projectWork) : "-", percent: `${projectWorkPct.toFixed(1)}%`, color: "bg-teal-500" },
    { label: "Meetings & Admin", time: data ? formatHours(data.meetings) : "-", percent: `${meetingsPct.toFixed(1)}%`, color: "bg-amber-500" },
    { label: "Breaks", time: data ? formatHours(data.breaks) : "-", percent: `${breaksPct.toFixed(1)}%`, color: "bg-blue-500" },
  ];

  return (
    <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 shadow-sm relative h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Focus Distribution
          </h2>
          <Info className="h-3.5 w-3.5 text-zinc-600" />
        </div>
      </div>

      <div className="flex-1 flex flex-col sm:flex-row items-center justify-between px-2 gap-6">
        {/* CSS Donut Chart */}
        <div
          className="relative flex h-36 w-36 sm:h-32 sm:w-32 lg:h-36 lg:w-36 shrink-0 items-center justify-center rounded-full"
          style={{
            background: total > 0 ? 
              `conic-gradient(from 0deg, #a855f7 0% ${stop1}%, #14b8a6 ${stop1}% ${stop2}%, #f59e0b ${stop2}% ${stop3}%, #3b82f6 ${stop3}% 100%)` :
              `#27272a`
          }}
        >
          <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-zinc-950">
            <span className="text-lg font-bold text-white">{data ? formatHours(data.total) : "-"}</span>
            <span className="text-[10px] text-zinc-400">Total</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-3 flex-1 sm:pl-4 lg:pl-6 w-full">
          {displayData.map((item, i) => (
            <div key={i} className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full ${item.color} mt-1`} />
                <span className="text-[11px] font-medium text-zinc-300">{item.label}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[11px] font-medium text-white">{item.time}</span>
                <span className="text-[10px] text-zinc-500">{item.percent}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
