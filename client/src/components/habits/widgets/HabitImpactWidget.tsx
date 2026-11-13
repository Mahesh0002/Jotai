import React from "react";
import { Card } from "@/components/ui/Card";
import { ArrowRight, Activity, CheckSquare, Clock, Brain } from "lucide-react";

export function HabitImpactWidget() {
  // We'll mock this data as the backend doesn't currently correlate habits with tasks/focus in analytics
  const impacts = [
    {
      icon: <Activity className="w-3.5 h-3.5 text-emerald-500" />,
      name: "Exercise",
      metric: "Focus Quality",
      lift: "+18%",
    },
    {
      icon: <CheckSquare className="w-3.5 h-3.5 text-amber-500" />,
      name: "Morning Planning",
      metric: "Task Completion",
      lift: "+24%",
    },
    {
      icon: <Clock className="w-3.5 h-3.5 text-blue-400" />,
      name: "Reading",
      metric: "Focus Duration",
      lift: "+7%",
    },
    {
      icon: <Brain className="w-3.5 h-3.5 text-purple-400" />,
      name: "Meditation",
      metric: "Session Quality",
      lift: "+11%",
    },
  ];

  return (
    <Card className="flex flex-col p-5 bg-zinc-950 border-zinc-800/80 h-full relative">
      <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-5">
        Habit Impact
      </h2>

      <div className="flex flex-col gap-4 flex-1">
        {impacts.map((impact, i) => (
          <div key={i} className="flex justify-between items-center">
            <div className="flex gap-3 items-start">
              <div className="mt-0.5">{impact.icon}</div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">{impact.name}</span>
                <span className="text-[10px] text-zinc-500">{impact.metric}</span>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-500">{impact.lift}</span>
          </div>
        ))}
      </div>

      <button className="flex items-center text-[10px] text-purple-400 hover:text-purple-300 mt-4 pt-4 border-t border-zinc-800/50 transition-colors w-max">
        View full analysis <ArrowRight className="ml-1 h-3 w-3" />
      </button>
    </Card>
  );
}
