import { Info, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { analyticsApi, XpAnalyticsItem } from "@/lib/api";
import { Period } from "@/routes/progress";
import { format, subDays } from "date-fns";

export function WeeklyXPEarned({ period }: { period: Period }) {
  const [data, setData] = useState<XpAnalyticsItem[]>([]);
  const [localPeriod, setLocalPeriod] = useState<"week" | "month">("week");

  useEffect(() => {
    if (period === "month" || period === "year") {
      setLocalPeriod("month");
    } else {
      setLocalPeriod("week");
    }
  }, [period]);

  useEffect(() => {
    analyticsApi.getXp({ period: localPeriod }).then(setData).catch(console.error);
  }, [localPeriod]);

  // Use raw data directly, ensure we have elements
  let displayData = data || [];
  if (displayData.length === 0) {
    const numDays = localPeriod === "week" ? 7 : 30;
    displayData = Array.from({ length: numDays }, (_, i) => {
      const d = subDays(new Date(), numDays - 1 - i);
      return {
        date: d.toISOString().split("T")[0] ?? "",
        day: format(d, "EEE"),
        xp: 0,
      };
    });
  }

  // To fit in a small bar chart, if it's month, maybe we show last 14 days or group by week?
  // Let's just slice last 7 days if there are too many elements, or scale it.
  // The UI is designed for 7 days. If localPeriod === 'month', let's just show last 14 days or just keep 7.
  // The user requested removing mock data.
  const chartData = displayData.slice(-7);
  const maxVal = Math.max(...chartData.map((d) => d.xp), 100); // minimum 100 to avoid div by 0

  const total = data?.reduce((acc, curr) => acc + curr.xp, 0) || 0;

  return (
    <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 shadow-sm relative h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            XP Earned ({localPeriod === "week" ? "This Week" : "Last 30 Days"})
          </h2>
          <Info className="h-3.5 w-3.5 text-zinc-600" />
        </div>
      </div>

      <div className="flex items-end gap-2 mb-8">
        <Sparkles className="h-5 w-5 text-amber-400 mb-1" />
        <span className="text-3xl font-light text-white leading-none">
          {total.toLocaleString()}
        </span>
        <span className="text-xs font-medium text-amber-500 mb-1 tracking-wider">XP</span>
      </div>

      {/* Bar Chart */}
      <div className="flex-1 flex items-end justify-between px-2 pb-2 mt-auto">
        {chartData.map((item, i) => {
          const heightPct = (item.xp / maxVal) * 100;

          return (
            <div key={i} className="flex flex-col items-center gap-2 w-full">
              <span className="text-[10px] font-bold text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
                {item.xp}
              </span>

              {/* Bar */}
              <div className="relative h-24 w-8 sm:w-10 rounded bg-zinc-900 group cursor-pointer">
                <div
                  className="absolute bottom-0 left-0 right-0 rounded bg-amber-500 transition-all duration-500"
                  style={{ height: `${heightPct}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 rounded" />
                </div>
              </div>

              {/* Day Label */}
              <span className="text-[10px] font-medium text-zinc-500 mt-1">{item.day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
