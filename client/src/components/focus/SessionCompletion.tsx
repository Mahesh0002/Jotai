import { useFocus } from "@/contexts/FocusContext";
import { Check, Trophy, Clock, XCircle } from "lucide-react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";

export function SessionCompletion() {
  const { showCompletionSummary, closeCompletionSummary, lastSessionSummary, currentTask } =
    useFocus();
  const { width, height } = useWindowSize();

  if (!lastSessionSummary) return null;

  const { data, task, xpAwarded } = lastSessionSummary;

  const plannedMinutes = data.durationMinutes;

  const totalDistractionSeconds = (data.distractions || []).reduce(
    (acc: number, d: any) => acc + (d.duration || 0),
    0,
  );
  const focusedSeconds = Math.max(
    0,
    (data.elapsedSeconds || 0) - (data.pausedSeconds || 0) - totalDistractionSeconds,
  );
  const focusedMinutes = Math.floor(focusedSeconds / 60);

  const efficiency =
    plannedMinutes > 0 ? Math.min(100, Math.round((focusedMinutes / plannedMinutes) * 100)) : 100;

  const formatSecs = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  return (
    <AlertDialog.Root
      open={showCompletionSummary}
      onOpenChange={(open) => !open && closeCompletionSummary()}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 animate-in fade-in" />

        <AlertDialog.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[90vw] max-w-lg bg-[#121217] border border-zinc-800 rounded-2xl shadow-2xl p-8 z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            {showCompletionSummary && (
              <Confetti
                width={width}
                height={height}
                recycle={false}
                numberOfPieces={300}
                colors={["#a855f7", "#ec4899", "#3b82f6"]}
              />
            )}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full"></div>
          </div>

          <div className="relative flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-2xl flex items-center justify-center mb-6 shadow-glow">
              <Check className="h-8 w-8 text-white" />
            </div>

            <AlertDialog.Title className="text-2xl font-black text-white tracking-tight mb-2 uppercase">
              Session Complete
            </AlertDialog.Title>

            <AlertDialog.Description className="text-sm font-medium text-zinc-400 mb-8">
              {currentTask?.title || data.title || "Deep Work Session"}
            </AlertDialog.Description>

            <div className="grid grid-cols-2 gap-4 w-full mb-8">
              <div className="flex flex-col items-center justify-center bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-4">
                <Clock className="h-5 w-5 text-purple-400 mb-2" />
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1">
                  Focused Time
                </span>
                <span className="text-xl font-bold text-white">{formatSecs(focusedSeconds)}</span>
                <span className="text-[10px] text-zinc-500 mt-1">Planned: {plannedMinutes}m</span>
              </div>

              <div className="flex flex-col items-center justify-center bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-4">
                <Trophy className="h-5 w-5 text-amber-400 mb-2" />
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1">
                  XP Earned
                </span>
                <span className="text-xl font-bold text-amber-400">+{xpAwarded}</span>
                <span className="text-[10px] text-amber-500/50 mt-1">
                  Efficiency: {efficiency}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between w-full bg-zinc-950/50 border border-zinc-800/50 rounded-lg px-4 py-3 mb-8">
              <div className="flex items-center gap-3">
                <XCircle className="h-4 w-4 text-red-400" />
                <span className="text-xs font-bold text-zinc-300">Distractions</span>
              </div>
              <span className="text-sm font-bold text-white">
                {(data.distractions || []).length}
              </span>
            </div>

            <AlertDialog.Action asChild>
              <button
                onClick={closeCompletionSummary}
                className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] active:scale-[0.98]"
              >
                Done
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
