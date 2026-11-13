import { ClipboardCheck, Clock, Flower2, Flame, Trophy, Dumbbell, ArrowRight } from "lucide-react";

export function RecentXpActivity() {
  const activities = [
    {
      time: "Today, 10:32 AM",
      title: "Completed NLP Assignment",
      xp: "+40 XP",
      icon: ClipboardCheck,
      color: "text-zinc-400",
    },
    {
      time: "Today, 09:15 AM",
      title: "Finished Deep Work session (90 min)",
      xp: "+30 XP",
      icon: Clock,
      color: "text-blue-500",
    },
    {
      time: "Yesterday, 08:40 PM",
      title: "Completed Morning Pages habit",
      xp: "+20 XP",
      icon: Flower2,
      color: "text-purple-400",
    },
    {
      time: "Yesterday, 07:20 PM",
      title: "Maintained 12-day streak",
      xp: "+50 XP",
      icon: Flame,
      color: "text-amber-500",
    },
    {
      time: "Yesterday, 05:10 PM",
      title: "Completed Daily Quest: Focus 2 sessions",
      xp: "+20 XP",
      icon: Trophy,
      color: "text-amber-400",
    },
    {
      time: "Aug 22, 08:30 AM",
      title: "Completed Gym habit",
      xp: "+20 XP",
      icon: Dumbbell,
      color: "text-blue-400",
    },
  ];

  return (
    <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 shadow-sm h-full">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
          Recent XP Activity
        </h2>
        <button className="flex items-center text-[10px] text-purple-400 hover:text-purple-300 transition-colors">
          View all <ArrowRight className="ml-1 h-3 w-3" />
        </button>
      </div>

      <div className="flex flex-col gap-6 flex-1">
        {activities.map((a, i) => (
          <div key={i} className="flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-4">
              <a.icon className={`h-4 w-4 ${a.color}`} />
              <div className="flex flex-col">
                <span className="text-[11px] text-zinc-500">{a.time}</span>
                <span className="text-xs font-medium text-zinc-300 group-hover:text-white transition-colors">
                  {a.title}
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-400">{a.xp}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
