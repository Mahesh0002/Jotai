import { useQuery } from "@tanstack/react-query";
import { statusApi } from "@/lib/api";

const COLORS = ["#9333ea", "#3b82f6", "#10b981", "#f59e0b", "#3f3f46"];

function hours(value: unknown): number {
  if (typeof value === "number") return value >= 100 ? value / 3600 : value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed >= 100 ? parsed / 3600 : parsed;
  }
  return 0;
}

function formatHours(value: number) {
  const total = Math.round(value * 60);
  return `${Math.floor(total / 60)}h ${String(total % 60).padStart(2, "0")}m`;
}

function firstNumber(source: Record<string, any>, keys: string[]): number {
  for (const key of keys) {
    if (source[key] !== undefined) return hours(source[key]);
  }
  return 0;
}

export function WeeklyOverview() {
  const { data: metrics } = useQuery({
    queryKey: ["status", "weekly"],
    queryFn: statusApi.getWeekly,
  });

  const source = (metrics ?? {}) as Record<string, any>;
  const values = [
    firstNumber(source, ["focus_hours", "focusHours", "focus_seconds", "focusSeconds", "focus"]),
    firstNumber(source, ["meeting_hours", "meetingHours", "meetings"]),
    firstNumber(source, ["personal_hours", "personalHours", "personal"]),
    firstNumber(source, ["break_hours", "breakHours", "breaks"]),
  ];
  const labels = ["Focus", "Meetings", "Personal", "Breaks"];
  const total = values.reduce((sum, value) => sum + value, 0);
  const percentages = values.map((value) => (total > 0 ? (value / total) * 100 : 0));
  let offset = 0;
  const gradient = percentages
    .map((percent, i) => {
      const start = offset;
      offset += percent;
      return `${COLORS[i]} ${start.toFixed(1)}% ${offset.toFixed(1)}%`;
    })
    .join(", ");

  return (
    <div className="flex h-32 shrink-0 items-center border-t border-zinc-800 bg-zinc-950 px-8 py-4">
      <div className="flex flex-1 flex-col">
        <h3 className="mb-4 text-xs font-semibold text-white">Weekly overview</h3>
        {total > 0 ? (
          <div className="grid grid-cols-4 gap-8">
            {labels.map((label, i) => (
              <div key={label} className="flex flex-col">
                <span className="mb-1 text-[11px] font-medium text-zinc-400">{label}</span>
                <span className="mb-1 text-xl font-light text-white">
                  {formatHours(values[i] ?? 0)}
                </span>
                <div className="flex items-center gap-1 text-[10px] font-medium text-zinc-600">
                  {(percentages[i] ?? 0).toFixed(0)}% of tracked time
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-1 items-center text-[11px] text-zinc-500">
            No local activity recorded yet this week.
          </div>
        )}
      </div>

      {total > 0 && (
        <div className="flex items-center gap-6 border-l border-zinc-800 pl-8">
          <div
            className="relative h-16 w-16 rounded-full"
            style={{ background: `conic-gradient(from 0deg, ${gradient})` }}
          >
            <div className="absolute inset-2 rounded-full bg-zinc-950" />
          </div>
          <div className="flex flex-col gap-1.5">
            {labels.map((label, i) => (
              <div
                key={label}
                className="flex items-center justify-between gap-6 text-[10px] font-medium"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: COLORS[i] ?? "#3f3f46" }}
                  />
                  <span className="text-zinc-400">{label}</span>
                </div>
                <span className="text-white">{(percentages[i] ?? 0).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
