"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatFullDate,
  formatMonthYear,
  getDaysInMonth,
  getFirstDayOfMonth,
  addMonths,
  isSameDay,
} from "@/lib/date-utils";

type CalendarSidebarProps = {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
};

export function CalendarSidebar({ currentDate, setCurrentDate }: CalendarSidebarProps) {
  const [calendars, setCalendars] = useState([
    { name: "Jōtai", color: "bg-purple-500", active: true },
    { name: "Google Calendar", color: "bg-blue-500", active: true },
    { name: "Work", color: "bg-emerald-500", active: true },
    { name: "Personal", color: "bg-amber-500", active: true },
  ]);

  const toggleCalendar = (index: number) => {
    setCalendars((current) =>
      current.map((calendar, i) =>
        i === index ? { ...calendar, active: !calendar.active } : calendar,
      ),
    );
  };

  const upcoming = [
    {
      time: "10:00 - 11:00 AM",
      relative: "in 18m",
      title: "NLP Lecture",
      desc: "CS Building, Room 301",
      color: "bg-blue-500",
    },
    {
      time: "12:00 - 1:00 PM",
      relative: "in 2h 18m",
      title: "Lunch Break",
      desc: "",
      color: "bg-amber-500",
    },
    {
      time: "1:30 - 2:30 PM",
      relative: "in 3h 48m",
      title: "Project Meeting",
      desc: "Online",
      color: "bg-purple-500",
    },
  ];

  const handlePrevMonth = () => setCurrentDate(addMonths(currentDate, -1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const daysInPrevMonth = getDaysInMonth(year, month - 1);
  const prevMonthDays = Array.from(
    { length: firstDay },
    (_, i) => daysInPrevMonth - firstDay + i + 1,
  );
  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const nextMonthDays = Array.from({ length: 42 - (firstDay + daysInMonth) }, (_, i) => i + 1);

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-zinc-800 bg-zinc-950 p-6 overflow-y-auto custom-scrollbar h-full">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <CalendarIcon className="h-5 w-5 text-purple-400" />
          <h2 className="text-sm font-semibold">{formatFullDate(currentDate)}</h2>
        </div>
        <button className="text-zinc-500 hover:text-white transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Mini Calendar */}
      <div className="mb-10">
        <div className="mb-4 flex items-center justify-between text-xs font-semibold text-zinc-300">
          <button onClick={handlePrevMonth} className="text-zinc-500 hover:text-white p-1">
            <ChevronLeft className="h-3 w-3" />
          </button>
          <span>{formatMonthYear(currentDate)}</span>
          <button onClick={handleNextMonth} className="text-zinc-500 hover:text-white p-1">
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-y-3 gap-x-1 text-center text-[10px] font-bold text-zinc-500 mb-2">
          <div>M</div>
          <div>T</div>
          <div>W</div>
          <div>T</div>
          <div>F</div>
          <div>S</div>
          <div>S</div>
        </div>
        <div className="grid grid-cols-7 gap-y-3 gap-x-1 text-center text-xs font-medium text-zinc-300">
          {prevMonthDays.map((day) => (
            <div key={`prev-${day}`} className="opacity-30">
              {day}
            </div>
          ))}
          {currentMonthDays.map((day) => {
            const isToday = isSameDay(currentDate, new Date(year, month, day));
            return (
              <div
                key={`cur-${day}`}
                onClick={() => setCurrentDate(new Date(year, month, day))}
                className={`cursor-pointer hover:text-white transition-colors ${isToday ? "flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-white mx-auto shadow-glow" : ""}`}
              >
                {day}
              </div>
            );
          })}
          {nextMonthDays.map((day) => (
            <div key={`next-${day}`} className="opacity-30">
              {day}
            </div>
          ))}
        </div>
      </div>

      {/* Up Next */}
      <div className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Up Next</h3>
          <button className="text-[10px] font-medium text-zinc-400 hover:text-white">
            See all
          </button>
        </div>
        <div className="flex flex-col gap-5">
          {upcoming.map((item, i) => (
            <div key={i} className="flex gap-3">
              <span className={`mt-1 h-2 w-2 shrink-0 rounded-[2px] ${item.color}`} />
              <div className="flex w-full flex-col">
                <span className="text-xs font-semibold text-white">{item.title}</span>
                {item.desc && <span className="text-[11px] text-zinc-400 mt-0.5">{item.desc}</span>}
                <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-500">
                  <span>{item.time}</span>
                  <span className="font-medium text-zinc-400">{item.relative}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Focus Suggestions */}
      <div className="mb-10">
        <h3 className="mb-4 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          Focus Suggestions
        </h3>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-300 mb-4 leading-relaxed">
            You have a <span className="font-semibold text-white">90 min</span> open window from
            3:00 PM to 4:30 PM.
          </p>
          <Button className="w-full bg-purple-600 hover:bg-purple-500 text-xs shadow-glow">
            Schedule a focus block
          </Button>
        </div>
      </div>

      {/* Calendars */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Calendars
          </h3>
          <button className="text-[10px] font-medium text-zinc-400 hover:text-white">Manage</button>
        </div>
        <div className="flex flex-col gap-3">
          {calendars.map((cal, i) => (
            <button
              key={i}
              onClick={() => toggleCalendar(i)}
              className="flex items-center gap-3 text-xs font-medium text-zinc-300 hover:text-white transition-colors"
            >
              <div
                className={`flex h-4 w-4 items-center justify-center rounded-[4px] border ${cal.active ? cal.color.replace("bg-", "border-").replace("500", "500") + " " + cal.color : "border-zinc-700 bg-zinc-900"}`}
              >
                {cal.active && <CheckSquare className="h-3 w-3 text-white" />}
              </div>
              {cal.name}
            </button>
          ))}
          <button className="mt-1 text-left text-[11px] text-zinc-500 hover:text-white transition-colors">
            Show all ⌄
          </button>
        </div>
      </div>
    </aside>
  );
}
