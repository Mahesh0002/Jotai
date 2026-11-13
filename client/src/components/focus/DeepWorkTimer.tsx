import { Brain, Pause, Play, Check, AlertCircle } from "lucide-react";
import { useFocus } from "@/contexts/FocusContext";
import { FocusWaveform } from "@/components/focus/FocusWaveform";

export function DeepWorkTimer() {
  const { timerState, timeLeft, progress, startTimer, pauseTimer, resumeTimer, finishSession } =
    useFocus();

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // SVG Circular properties
  const radius = 140;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-950/50 p-8 shadow-sm flex-1 relative overflow-hidden items-center justify-center min-h-[450px]">
      {/* Background elements for aesthetic */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-zinc-950/0 to-zinc-950/0 pointer-events-none"></div>

      {/* Timer Header */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 text-purple-400 font-bold tracking-widest text-xs uppercase z-10">
        <Brain className="h-4 w-4" />
        Deep Work
      </div>

      {/* SVG Ring Timer */}
      <div className="relative flex items-center justify-center w-80 h-80 z-10 mt-4">
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full shadow-[0_0_80px_rgba(147,51,234,0.15)] pointer-events-none"></div>

        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 320 320">
          {/* Background circle */}
          <circle
            cx="160"
            cy="160"
            r={radius}
            className="stroke-zinc-800/50 fill-transparent"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx="160"
            cy="160"
            r={radius}
            className="stroke-purple-500 fill-transparent transition-all duration-1000 ease-linear"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>

        {/* Text Content inside circle */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-6xl font-bold text-white tracking-tight mb-2 drop-shadow-lg font-mono">
            {formatTime(timeLeft)}
          </span>

          {timerState === "paused" && (
            <div className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 mt-1 text-amber-500 animate-pulse">
              <Pause className="h-3 w-3" />
              <span className="text-[10px] font-bold">PAUSED</span>
            </div>
          )}

          {timerState === "completed" && (
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 mt-1 text-emerald-500">
              <Check className="h-3 w-3" />
              <span className="text-[10px] font-bold">DONE</span>
            </div>
          )}
        </div>
      </div>

      {/* Canvas Audio Waveform */}
      <div className="absolute bottom-28 left-1/2 -translate-x-1/2 w-80 h-16 pointer-events-none">
        <FocusWaveform progress={progress} isPlaying={timerState === "running"} />
      </div>

      {/* Controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 z-10 w-full max-w-sm px-6">
        {timerState === "idle" && (
          <button
            onClick={() => startTimer(45)} // Default to 45 mins, can be made dynamic
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-purple-600 py-3.5 text-sm font-bold text-white hover:bg-purple-500 transition-colors shadow-[0_0_20px_rgba(147,51,234,0.3)]"
          >
            <Play className="h-4 w-4" /> Start Focus (45m)
          </button>
        )}

        {timerState === "running" && (
          <>
            <button
              onClick={pauseTimer}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900/80 py-3 text-sm font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <Pause className="h-4 w-4" /> Pause
            </button>
            <button
              onClick={() => finishSession(false)}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-zinc-700 py-3 text-sm font-bold text-white hover:bg-zinc-600 transition-colors"
            >
              Finish Early
            </button>
          </>
        )}

        {timerState === "paused" && (
          <>
            <button
              onClick={resumeTimer}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-amber-600 py-3 text-sm font-bold text-white hover:bg-amber-500 transition-colors shadow-[0_0_20px_rgba(217,119,6,0.3)]"
            >
              <Play className="h-4 w-4" /> Resume
            </button>
            <button
              onClick={() => finishSession(false)}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-zinc-800 py-3 text-sm font-semibold text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-colors"
            >
              Finish
            </button>
          </>
        )}

        {timerState === "completed" && (
          <button
            onClick={() => finishSession(true)}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3.5 text-sm font-bold text-white hover:bg-emerald-500 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            <Check className="h-4 w-4" /> Save & Continue
          </button>
        )}
      </div>
    </div>
  );
}
