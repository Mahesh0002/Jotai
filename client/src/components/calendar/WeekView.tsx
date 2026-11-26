"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Brain, Coffee, Laptop, Users, Calendar as CalendarIcon, Clock3 } from "lucide-react";
import { getStartOfWeek, addDays, formatDayNumber, formatDayName } from "@/lib/date-utils";
import { calendarApi, type CalendarEvent } from "@/lib/api";

type EventType = "deep-work" | "routine" | "project" | "lecture" | "break" | "personal" | "meeting";

type WeekEvent = {
  id: string;
  title: string;
  day: number;
  startH: number;
  endH: number;
  type: EventType;
  description?: string | undefined;
};

const HOURS = Array.from({ length: 15 }, (_, i) => i + 6); // 6 AM to 8 PM

function classify(title: string): EventType {
  const text = title.toLowerCase();
  if (/gym|workout|run|personal/.test(text)) return "personal";
  if (/break|lunch|coffee/.test(text)) return "break";
  if (/lecture|class|study/.test(text)) return "lecture";
  if (/meeting|sync|call/.test(text)) return "meeting";
  if (/project/.test(text)) return "project";
  if (/deep|focus/.test(text)) return "deep-work";
  return "routine";
}

function getEventColors(type: EventType) {
  switch (type) {
    case "deep-work":
    case "project":
    case "meeting":
      return "border-purple-500/50 bg-[#1d0e2e] text-purple-200 border-l-[3px] border-l-purple-500";
    case "routine":
      return "border-emerald-500/50 bg-[#0d2a1b] text-emerald-200 border-l-[3px] border-l-emerald-500";
    case "lecture":
      return "border-blue-500/50 bg-[#0b1c36] text-blue-200 border-l-[3px] border-l-blue-500";
    case "break":
      return "border-amber-500/50 bg-[#31200a] text-amber-200 border-l-[3px] border-l-amber-500";
    case "personal":
      return "border-orange-500/50 bg-[#311c08] text-orange-200 border-l-[3px] border-l-orange-500";
    default:
      return "border-zinc-800 bg-zinc-800 text-white";
  }
}

function getEventIcon(type: EventType) {
  switch (type) {
    case "deep-work":
      return <Brain className="h-2.5 w-2.5 text-purple-400" />;
    case "project":
      return <Laptop className="h-2.5 w-2.5 text-purple-400" />;
    case "meeting":
      return <Users className="h-2.5 w-2.5 text-purple-400" />;
    case "break":
      return <Coffee className="h-2.5 w-2.5 text-amber-400" />;
    case "personal":
      return <Clock3 className="h-2.5 w-2.5 text-orange-400" />;
    default:
      return <CalendarIcon className="h-2.5 w-2.5 text-zinc-400" />;
  }
}

function hourOf(timestamp: number) {
  const date = new Date(timestamp);
  return date.getHours() + date.getMinutes() / 60;
}

type WeekViewProps = { currentDate: Date };

export function WeekView({ currentDate }: WeekViewProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const startOfWeek = useMemo(() => getStartOfWeek(currentDate), [currentDate]);
  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(startOfWeek, i)),
    [startOfWeek],
  );

  const { data: remoteEvents = [] } = useQuery({
    queryKey: ["calendar", "week", startOfWeek.toISOString().slice(0, 10)],
    queryFn: () => calendarApi.getEvents(startOfWeek, addDays(startOfWeek, 7)),
  });

  const events = useMemo<WeekEvent[]>(() => {
    const dayKeys = weekDates.map((d) => d.toDateString());
    return remoteEvents.map((event: CalendarEvent, index: number) => {
      const start = new Date(event.start);
      const end = event.end ? new Date(event.end) : new Date(start.getTime() + 30 * 60_000);
      return {
        id: event._id ?? String(index),
        title: event.title,
        day: Math.max(0, dayKeys.indexOf(start.toDateString())),
        startH: hourOf(start.getTime()),
        endH: hourOf(end.getTime()),
        type: classify(event.title),
        description: event.source,
      };
    });
  }, [remoteEvents, weekDates]);

  const currentDayIndex = currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1;
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const showNow =
    currentDate.toDateString() === now.toDateString() && currentHour >= 6 && currentHour <= 21;

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-zinc-950">
      <div className="flex border-b border-zinc-800/50 bg-zinc-950">
        <div className="flex w-16 shrink-0 items-center justify-center border-r border-zinc-800/50">
          <span className="text-[9px] font-bold text-zinc-500">LOCAL</span>
        </div>
        <div className="grid flex-1 grid-cols-7">
          {weekDates.map((date, i) => (
            <div
              key={i}
              className={`flex flex-col items-center justify-center py-4 ${i !== 6 ? "border-r border-zinc-800/50" : ""}`}
            >
              <span
                className={`mb-1 text-xs ${i === currentDayIndex ? "font-semibold text-purple-400" : "font-medium text-zinc-400"}`}
              >
                {formatDayName(date)}
              </span>
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${i === currentDayIndex ? "bg-purple-600 text-white shadow-glow" : "text-white"}`}
              >
                {formatDayNumber(date)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative flex flex-1 overflow-y-auto custom-scrollbar">
        <div className="w-16 shrink-0 border-r border-zinc-800/50 bg-zinc-950">
          <div className="relative h-[900px]">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute w-full pr-3 text-right text-[10px] font-medium text-zinc-500"
                style={{ top: `${(hour - 6) * 60}px`, transform: "translateY(-50%)" }}
              >
                {hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
              </div>
            ))}
          </div>
        </div>

        <div className="relative h-[900px] flex-1 bg-zinc-950">
          <div className="pointer-events-none absolute inset-0">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute w-full border-t border-zinc-800/30"
                style={{ top: `${(hour - 6) * 60}px` }}
              />
            ))}
            <div className="absolute inset-0 grid h-full grid-cols-7">
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className={`h-full ${i !== 6 ? "border-r border-zinc-800/30" : ""}`} />
              ))}
            </div>
          </div>

          {showNow && (
            <div
              className="pointer-events-none absolute left-0 right-0 z-20"
              style={{ top: `${(currentHour - 6) * 60}px` }}
            >
              <div
                className="absolute -left-16 flex w-16 items-center justify-end pr-2"
                style={{ transform: "translateY(-50%)" }}
              >
                <span className="text-[10px] font-bold text-purple-400">
                  {now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                </span>
              </div>
              <div className="relative h-[2px] w-full bg-purple-500/70 shadow-[0_0_10px_rgba(168,85,247,0.5)]">
                <div className="absolute -left-1.5 -top-[3.5px] h-2.5 w-2.5 rounded-full border-2 border-zinc-950 bg-purple-500" />
              </div>
            </div>
          )}

          <div className="absolute inset-0 grid h-full grid-cols-7">
            {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => (
              <div key={dayIdx} className="relative h-full">
                {events
                  .filter((e) => e.day === dayIdx)
                  .map((event) => {
                    const top = (event.startH - 6) * 60;
                    const height = Math.max(20, (event.endH - event.startH) * 60);
                    return (
                      <div
                        key={event.id}
                        className={`absolute left-[3px] right-[3px] cursor-pointer overflow-hidden rounded-[4px] border p-2 backdrop-blur-md transition-transform hover:scale-[1.01] ${getEventColors(event.type)}`}
                        style={{ top: `${top}px`, height: `${height - 2}px` }}
                      >
                        <div className="flex h-full flex-col overflow-hidden">
                          <div className="mb-1 flex items-center gap-1.5">
                            {getEventIcon(event.type)}
                            <span className="text-[10px] font-bold leading-none">
                              {event.title}
                            </span>
                          </div>
                          {event.description && height > 45 && (
                            <div className="mt-1 text-[10px] font-medium leading-[1.3] opacity-80">
                              {event.description}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
