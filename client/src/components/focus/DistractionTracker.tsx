import { useState } from "react";
import { Plus, Smartphone, Globe, MessageSquare, Coffee, X } from "lucide-react";
import { useFocus } from "@/contexts/FocusContext";

const DISTRACTION_CATEGORIES = [
  { id: "phone", label: "Phone", icon: Smartphone, color: "text-blue-400" },
  { id: "social", label: "Social Media", icon: Globe, color: "text-pink-400" },
  { id: "message", label: "Message", icon: MessageSquare, color: "text-emerald-400" },
  { id: "break", label: "Break", icon: Coffee, color: "text-amber-400" },
  { id: "other", label: "Other", icon: X, color: "text-zinc-400" },
];

export function DistractionTracker() {
  const { distractions, addDistraction, timerState, pauseTimer } = useFocus();
  const [isOpen, setIsOpen] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  const handleOpen = () => {
    if (timerState === "running") {
      pauseTimer();
    }
    setStartTime(Date.now());
    setIsOpen(true);
  };

  const handleLogDistraction = (category: string) => {
    const duration = startTime ? Math.floor((Date.now() - startTime) / 1000) : 60; // fallback to 60s if quick

    addDistraction({
      timestamp: new Date().toISOString(),
      category,
      duration,
    });

    setIsOpen(false);
    setStartTime(null);
  };

  return (
    <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 shadow-sm min-h-[160px]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
          Distractions
        </h2>
        <span className="text-xs font-bold text-zinc-300">{distractions.length}</span>
      </div>

      {!isOpen ? (
        <div className="flex flex-col items-center justify-center flex-1">
          <button
            onClick={handleOpen}
            disabled={timerState === "idle" || timerState === "completed"}
            className="flex items-center justify-center w-10 h-10 rounded-full border border-dashed border-zinc-700 text-zinc-500 hover:text-white hover:border-zinc-500 hover:bg-zinc-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed mb-2"
          >
            <Plus className="h-5 w-5" />
          </button>
          <span className="text-[10px] font-medium text-zinc-500">Log Interruption</span>
        </div>
      ) : (
        <div className="flex flex-col flex-1 animate-in fade-in zoom-in-95 duration-200">
          <p className="text-xs font-bold text-zinc-300 text-center mb-3">What distracted you?</p>
          <div className="grid grid-cols-2 gap-2 flex-1">
            {DISTRACTION_CATEGORIES.slice(0, 4).map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleLogDistraction(cat.id)}
                className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 transition-colors"
              >
                <cat.icon className={`h-3.5 w-3.5 ${cat.color}`} />
                <span className="text-[10px] font-medium text-zinc-300">{cat.label}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="mt-3 text-[10px] font-bold text-zinc-500 hover:text-white uppercase tracking-wider text-center"
          >
            Cancel
          </button>
        </div>
      )}

      {distractions.length > 0 && !isOpen && (
        <div className="mt-4 pt-4 border-t border-zinc-800/50 flex flex-col gap-2">
          {distractions.slice(-2).map((d, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-400 capitalize">{d.category}</span>
              <span className="text-[10px] text-zinc-600">
                {Math.floor(d.duration / 60)}m {d.duration % 60}s
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
