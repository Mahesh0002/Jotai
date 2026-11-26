import { Info } from "lucide-react";
import { useEffect, useState } from "react";
import { analyticsApi, TasksAnalytics } from "@/lib/api";
import { Period } from "@/routes/progress";

export function TaskBarChart({ period }: { period: Period }) {
  const [data, setData] = useState<TasksAnalytics | null>(null);

  useEffect(() => {
    analyticsApi.getTasks({ period }).then(setData).catch(console.error);
  }, [period]);

  const displayItems = data ? [data.all, ...data.groups.slice(0, 4)] : [];

  return (
    <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 shadow-sm relative h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Task Completion
          </h2>
          <Info className="h-3.5 w-3.5 text-zinc-600" />
        </div>
      </div>

      {/* Bar Chart */}
      <div className="flex-1 flex items-end justify-between px-4 pb-2">
        {displayItems.length === 0 && (
          <div className="w-full text-center text-xs text-zinc-500 mb-4">No tasks found</div>
        )}

        {displayItems.map((item, i) => (
          <div key={item.label || i} className="flex flex-col items-center gap-3">
            <span className="text-xs font-bold text-white">{item.percent}%</span>

            {/* Bar Container */}
            <div className="relative h-32 w-10 rounded-t-md bg-zinc-900 overflow-hidden">
              <div
                className="absolute bottom-0 left-0 right-0 rounded-t-md bg-gradient-to-t from-purple-900 to-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all duration-500"
                style={{ height: `${item.percent}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20" />
              </div>
            </div>

            {/* Labels */}
            <div className="flex flex-col items-center text-center mt-2">
              <span className="text-[10px] font-medium text-zinc-400 whitespace-pre-line leading-tight h-6 line-clamp-2 w-12 truncate">
                {item.label}
              </span>
              <span className="text-[9px] text-zinc-500 mt-1">
                {item.completed} / {item.total}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
