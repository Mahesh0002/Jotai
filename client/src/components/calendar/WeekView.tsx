"use client";

import { useMemo } from "react";
import { Brain, Coffee, Laptop, Users, Calendar as CalendarIcon, Clock3 } from "lucide-react";
import { getStartOfWeek, addDays, formatDayNumber, formatDayName } from "@/lib/date-utils";

type EventType = "deep-work" | "routine" | "project" | "lecture" | "break" | "personal" | "meeting";

interface CalendarEvent {
  id: string;
  title: string;
  day: number;
  startH: number;
  endH: number;
  type: EventType;
  description?: string;
}

const MOCK_EVENTS: CalendarEvent[] = [
  // Mon
  {
    id: "1",
    title: "Deep Work",
    day: 0,
    startH: 9,
    endH: 9.75,
    type: "deep-work",
    description: "NLP Assignment\n9:00 - 9:45 AM",
  },
  {
    id: "2",
    title: "NLP Lecture",
    day: 0,
    startH: 11,
    endH: 12,
    type: "lecture",
    description: "CS Building, Rm 301\n11:00 - 12:00 PM",
  },
  {
    id: "3",
    title: "Project Work",
    day: 0,
    startH: 13,
    endH: 15,
    type: "project",
    description: "Traffic Classifier\n1:00 - 3:00 PM",
  },
  {
    id: "4",
    title: "Gym",
    day: 0,
    startH: 16,
    endH: 17,
    type: "personal",
    description: "Downtown Fitness\n4:00 - 5:00 PM",
  },
  {
    id: "5",
    title: "Assignment Review",
    day: 0,
    startH: 19,
    endH: 20,
    type: "lecture",
    description: "7:00 - 8:00 PM",
  },

  // Tue
  {
    id: "6",
    title: "Morning Routine",
    day: 1,
    startH: 8,
    endH: 9,
    type: "routine",
    description: "8:00 - 9:00 AM",
  },
  {
    id: "7",
    title: "NLP Lecture",
    day: 1,
    startH: 10,
    endH: 11,
    type: "lecture",
    description: "CS Building, Rm 301\n10:00 - 11:00 AM",
  },
  {
    id: "8",
    title: "Lunch Break",
    day: 1,
    startH: 12,
    endH: 13,
    type: "break",
    description: "12:00 - 1:00 PM",
  },
  {
    id: "9",
    title: "Project Meeting",
    day: 1,
    startH: 13.5,
    endH: 14.5,
    type: "meeting",
    description: "Online\n1:30 - 2:30 PM",
  },
  {
    id: "10",
    title: "Deep Work",
    day: 1,
    startH: 15,
    endH: 16.5,
    type: "deep-work",
    description: "Research\n3:00 - 4:30 PM",
  },
  {
    id: "11",
    title: "Dinner",
    day: 1,
    startH: 18,
    endH: 19,
    type: "break",
    description: "6:00 - 7:00 PM",
  },

  // Wed
  {
    id: "12",
    title: "Deep Work",
    day: 2,
    startH: 9,
    endH: 10,
    type: "deep-work",
    description: "NLP Assignment\n9:00 - 10:00 AM",
  },
  {
    id: "13",
    title: "Project Work",
    day: 2,
    startH: 13,
    endH: 15,
    type: "project",
    description: "Traffic Classifier\n1:00 - 3:00 PM",
  },
  {
    id: "14",
    title: "Gym",
    day: 2,
    startH: 16,
    endH: 17,
    type: "personal",
    description: "4:00 - 5:00 PM",
  },

  // Thu
  {
    id: "15",
    title: "Morning Pages",
    day: 3,
    startH: 8,
    endH: 8.5,
    type: "routine",
    description: "8:00 - 8:30 AM",
  },
  {
    id: "16",
    title: "Project Meeting",
    day: 3,
    startH: 10,
    endH: 11,
    type: "meeting",
    description: "Online\n10:00 - 11:00 AM",
  },
  {
    id: "17",
    title: "Lunch Break",
    day: 3,
    startH: 12,
    endH: 13,
    type: "break",
    description: "12:00 - 1:00 PM",
  },
  {
    id: "18",
    title: "Deep Work",
    day: 3,
    startH: 14,
    endH: 16,
    type: "deep-work",
    description: "Research\n2:00 - 4:00 PM",
  },
  {
    id: "19",
    title: "Study",
    day: 3,
    startH: 19,
    endH: 20,
    type: "lecture",
    description: "7:00 - 8:00 PM",
  },

  // Fri
  {
    id: "20",
    title: "Deep Work",
    day: 4,
    startH: 9,
    endH: 10.5,
    type: "deep-work",
    description: "Project\n9:00 - 10:30 AM",
  },
  {
    id: "21",
    title: "NLP Lecture",
    day: 4,
    startH: 11,
    endH: 12,
    type: "lecture",
    description: "11:00 - 12:00 PM",
  },
  {
    id: "22",
    title: "Project Work",
    day: 4,
    startH: 13,
    endH: 15,
    type: "project",
    description: "Traffic Classifier\n1:00 - 3:00 PM",
  },
  {
    id: "23",
    title: "Team Sync",
    day: 4,
    startH: 15.5,
    endH: 16.5,
    type: "meeting",
    description: "3:30 - 4:00 PM",
  },

  // Sat
  {
    id: "24",
    title: "Personal Time",
    day: 5,
    startH: 9,
    endH: 17,
    type: "lecture",
    description: "9:00 AM - 5:00 PM",
  },

  // Sun
  {
    id: "25",
    title: "Review & Plan",
    day: 6,
    startH: 10,
    endH: 12,
    type: "routine",
    description: "10:00 AM - 12:00 PM",
  },
];

const HOURS = Array.from({ length: 15 }, (_, i) => i + 6); // 6 AM to 8 PM

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
    case "routine":
      return <CalendarIcon className="h-2.5 w-2.5 text-emerald-400" />;
    case "lecture":
      return <CalendarIcon className="h-2.5 w-2.5 text-blue-400" />;
    case "break":
      return <Coffee className="h-2.5 w-2.5 text-amber-400" />;
    case "personal":
      return <Clock3 className="h-2.5 w-2.5 text-orange-400" />;
    default:
      return null;
  }
}

type WeekViewProps = {
  currentDate: Date;
};

export function WeekView({ currentDate }: WeekViewProps) {
  const currentHour = 10.5; // Keeping this mocked to show the current time indicator visually
  
  const startOfWeek = getStartOfWeek(currentDate);
  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(startOfWeek, i)), [startOfWeek]);
  
  // Calculate which day of the week it is (0 = Mon, 6 = Sun)
  const currentDayIndex = currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1;

  return (
    <div className="flex flex-1 flex-col bg-zinc-950 overflow-hidden relative">
      {/* Header Row (Days) */}
      <div className="flex border-b border-zinc-800/50 bg-zinc-950">
        <div className="w-16 shrink-0 flex items-center justify-center border-r border-zinc-800/50">
          <span className="text-[9px] font-bold text-zinc-500">GMT+5:30</span>
        </div>
        <div className="grid flex-1 grid-cols-7">
          {weekDates.map((date, i) => (
            <div
              key={i}
              className={`flex flex-col items-center justify-center py-4 ${i !== 6 ? "border-r border-zinc-800/50" : ""}`}
            >
              <span
                className={`text-xs mb-1 ${i === currentDayIndex ? "text-purple-400 font-semibold" : "text-zinc-400 font-medium"}`}
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

      {/* Grid */}
      <div className="relative flex flex-1 overflow-y-auto custom-scrollbar">
        {/* Time Labels */}
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

        {/* Calendar Body */}
        <div className="relative flex-1 bg-zinc-950 h-[900px]">
          {/* Grid Lines */}
          <div className="absolute inset-0 pointer-events-none">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute w-full border-t border-zinc-800/30"
                style={{ top: `${(hour - 6) * 60}px` }}
              />
            ))}
            <div className="absolute inset-0 grid grid-cols-7 h-full">
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className={`h-full ${i !== 6 ? "border-r border-zinc-800/30" : ""}`} />
              ))}
            </div>
          </div>

          {/* Current Time Indicator */}
          <div
            className="absolute left-0 right-0 z-20 pointer-events-none"
            style={{ top: `${(currentHour - 6) * 60}px` }}
          >
            <div
              className="absolute -left-16 flex w-16 items-center justify-end pr-2"
              style={{ transform: "translateY(-50%)" }}
            >
              <span className="text-[10px] font-bold text-purple-400">10:30 AM</span>
            </div>
            <div className="h-[2px] w-full bg-purple-500/70 shadow-[0_0_10px_rgba(168,85,247,0.5)] relative">
              <div className="absolute -left-1.5 -top-[3.5px] h-2.5 w-2.5 rounded-full bg-purple-500 border-2 border-zinc-950" />
            </div>
          </div>

          {/* Events */}
          <div className="absolute inset-0 grid grid-cols-7 h-full">
            {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => (
              <div key={dayIdx} className="relative h-full">
                {MOCK_EVENTS.filter((e) => e.day === dayIdx).map((event) => {
                  const top = (event.startH - 6) * 60;
                  const height = (event.endH - event.startH) * 60;
                  return (
                    <div
                      key={event.id}
                      className={`absolute left-[3px] right-[3px] overflow-hidden rounded-[4px] border p-2 backdrop-blur-md transition-transform hover:scale-[1.01] cursor-pointer ${getEventColors(event.type)}`}
                      style={{ top: `${top}px`, height: `${height - 2}px` }}
                    >
                      <div className="flex flex-col h-full overflow-hidden">
                        <div className="flex items-center gap-1.5 mb-1">
                          {getEventIcon(event.type)}
                          <span className={`text-[10px] font-bold leading-none`}>
                            {event.title}
                          </span>
                        </div>
                        {event.description && height > 45 && (
                          <div className="text-[10px] opacity-80 leading-[1.3] whitespace-pre-line mt-1 font-medium">
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
