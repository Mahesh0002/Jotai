"use client";

import { createFileRoute } from "@tanstack/react-router";
import { CalendarHeader } from "@/components/calendar/CalendarHeader";
import { CalendarSidebar } from "@/components/calendar/CalendarSidebar";
import { WeekView } from "@/components/calendar/WeekView";
import { WeeklyOverview } from "@/components/calendar/WeeklyOverview";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/calendar")({
  component: CalendarRoute,
});

function CalendarRoute() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeView, setActiveView] = useState<"Day" | "Week" | "Month">("Week");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="flex h-full w-full flex-col bg-zinc-950 overflow-hidden items-center justify-center text-zinc-500 text-sm">
        Loading calendar...
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col bg-zinc-950 overflow-hidden">
      <CalendarHeader
        currentDate={currentDate}
        setCurrentDate={setCurrentDate}
        activeView={activeView}
        setActiveView={setActiveView}
      />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden border-t border-zinc-800">
          <WeekView currentDate={currentDate} />
          <WeeklyOverview />
        </div>
        <CalendarSidebar currentDate={currentDate} setCurrentDate={setCurrentDate} />
      </div>
    </div>
  );
}
