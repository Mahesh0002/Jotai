import { useState } from "react";
import { Check } from "lucide-react";
import clsx from "clsx";
import { Habit } from "@/lib/api";
import { useHabitAnalytics } from "@/hooks/useHabits";

interface HabitCalendarTabProps {
  habits: Habit[];
  currentDate: Date;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function isoDay(date: Date) {
  return date.toLocaleDateString("en-CA");
}

export function HabitCalendarTab({ habits, currentDate }: HabitCalendarTabProps) {
  const [selectedDay, setSelectedDay] = useState(() => new Date().getDate());
  const { analytics } = useHabitAnalytics();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // Mon = 0
  const cells: Array<{ day: number; date: Date; inMonth: boolean }> = [];
  for (let i = 0; i < firstWeekday; i++) {
    const date = new Date(year, month, i - firstWeekday + 1);
    cells.push({ day: date.getDate(), date, inMonth: false });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ day, date: new Date(year, month, day), inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    const date = new Date(year, month, cells.length - firstWeekday + 1);
    cells.push({ day: date.getDate(), date, inMonth: false });
  }

  const monthLabel = currentDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const maxPerDay = Math.max(1, habits.length);
  const selectedDate = new Date(year, month, selectedDay);
  const selectedCount = analytics?.heatmap?.[isoDay(selectedDate)] ?? 0;

  return (
    <div className="flex flex-1 overflow-hidden bg-[#0e0e11]">
      <div className="mx-auto w-full max-w-5xl flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="mb-6 flex items-center justify-between">
          <span className="rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-xs font-bold text-zinc-300">
            {monthLabel}
          </span>
          <span className="text-[10px] text-zinc-500">Counts from local habit completions</span>
        </div>

        <div className="overflow-hidden rounded-xl border border-zinc-800/50 bg-zinc-950/30">
          <div className="grid grid-cols-7 border-b border-zinc-800/50">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="py-2 text-center text-[10px] font-bold uppercase tracking-wider text-zinc-500"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map(({ day, date, inMonth }, index) => {
              const key = isoDay(date);
              const count = inMonth ? (analytics?.heatmap?.[key] ?? 0) : 0;
              const isToday = key === isoDay(new Date());
              const isSelected = inMonth && day === selectedDay;
              return (
                <button
                  key={`${key}-${index}`}
                  onClick={() => inMonth && setSelectedDay(day)}
                  className={clsx(
                    "flex min-h-20 flex-col items-start gap-2 border-b border-r border-zinc-800/40 p-2 text-left transition-colors",
                    inMonth ? "hover:bg-zinc-900/40" : "opacity-30",
                    isSelected && "bg-purple-500/10",
                  )}
                >
                  <span
                    className={clsx(
                      "flex size-5 items-center justify-center rounded-full text-[11px] font-medium",
                      isToday ? "bg-purple-600 text-white" : "text-zinc-400",
                    )}
                  >
                    {day}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {inMonth && count > 0 ? (
                      Array.from({ length: Math.min(count, maxPerDay) }, (_, i) => (
                        <span
                          key={i}
                          className="size-2 rounded-full border border-emerald-400 bg-emerald-500"
                          title="Completed"
                        />
                      ))
                    ) : inMonth ? (
                      <span
                        className="size-2 rounded-full border border-zinc-600"
                        title="No completions"
                      />
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 text-xs text-zinc-400">
          <Check className="size-4 text-emerald-500" />
          {monthLabel} day {selectedDay}: {selectedCount} habit
          {selectedCount === 1 ? "" : "s"} completed locally.
        </div>
      </div>
    </div>
  );
}
