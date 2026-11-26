import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { FocusBlock, Task, Distraction, focusApi } from "@/lib/api";
import { toast } from "sonner";

export type TimerState = "idle" | "running" | "paused" | "completed";

export interface FocusContextValue {
  session: FocusBlock | null;
  timerState: TimerState;
  timeLeft: number;
  totalDuration: number;
  progress: number;

  currentTask: Task | null;
  notes: string;
  distractions: Distraction[];

  startSession: (durationMinutes: number) => Promise<void>;
  pauseSession: () => void;
  resumeSession: () => void;
  finishSession: (completeTask?: boolean) => Promise<void>;
  // Legacy aliases used by a few timer components.
  startTimer: (durationMinutes: number) => Promise<void>;
  pauseTimer: () => void;
  resumeTimer: () => void;

  setCurrentTask: (task: Task | null) => void;
  updateNotes: (notes: string) => void;
  saveNotes: () => Promise<void>;
  addDistraction: (distraction: Distraction) => void;

  // For the UI to show completion summary
  showCompletionSummary: boolean;
  closeCompletionSummary: () => void;
  lastSessionSummary: any | null;
}

const FocusContext = createContext<FocusContextValue | undefined>(undefined);

export function FocusProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<FocusBlock | null>(null);
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [currentTask, setCurrentTask] = useState<Task | null>(null);

  const [totalDuration, setTotalDuration] = useState(25 * 60); // seconds
  const [timeLeft, setTimeLeft] = useState(25 * 60); // seconds

  const [notes, setNotes] = useState("");
  const [distractions, setDistractions] = useState<Distraction[]>([]);

  const [showCompletionSummary, setShowCompletionSummary] = useState(false);
  const [lastSessionSummary, setLastSessionSummary] = useState<any | null>(null);

  // Time tracking
  const targetEndTimeRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Keep track of total paused time and elapsed time
  const [pausedSeconds, setPausedSeconds] = useState(0);
  const lastPauseTimeRef = useRef<number | null>(null);
  const sessionStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (timerState === "running" && targetEndTimeRef.current) {
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const remainingMs = targetEndTimeRef.current! - now;

        if (remainingMs <= 0) {
          clearInterval(timerRef.current!);
          setTimeLeft(0);
          setTimerState("completed");
          // We don't automatically finish backend here, let the user click Done
        } else {
          setTimeLeft(Math.ceil(remainingMs / 1000));
        }
      }, 500);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerState]);

  const startSession = async (durationMinutes: number) => {
    try {
      const duration = durationMinutes * 60;

      // Create session in backend
      const newSession = await focusApi.create({
        title: currentTask ? currentTask.title : "Deep Work Session",
        taskId: currentTask ? currentTask : undefined,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + duration * 1000).toISOString(),
        durationMinutes: durationMinutes,
        type: "deep_work",
        status: "in_progress",
      });

      setSession(newSession);
      setTotalDuration(duration);
      setTimeLeft(duration);

      targetEndTimeRef.current = Date.now() + duration * 1000;
      sessionStartTimeRef.current = Date.now();

      setNotes("");
      setDistractions([]);
      setPausedSeconds(0);
      setTimerState("running");
    } catch (error) {
      console.error("Failed to start session", error);
      toast.error("Failed to start Focus Session");
    }
  };

  const pauseSession = () => {
    if (timerState === "running") {
      setTimerState("paused");
      targetEndTimeRef.current = null;
      lastPauseTimeRef.current = Date.now();
    }
  };

  const resumeSession = () => {
    if (timerState === "paused") {
      targetEndTimeRef.current = Date.now() + timeLeft * 1000;

      // Calculate how long it was paused
      if (lastPauseTimeRef.current) {
        const pausedFor = (Date.now() - lastPauseTimeRef.current) / 1000;
        setPausedSeconds((prev) => prev + pausedFor);
        lastPauseTimeRef.current = null;
      }

      setTimerState("running");
    }
  };

  const finishSession = async (completeTask: boolean = false) => {
    if (!session) return;

    // Stop any running timer
    setTimerState("completed");
    targetEndTimeRef.current = null;

    // Catch any trailing pause time
    let finalPausedSeconds = pausedSeconds;
    if (lastPauseTimeRef.current) {
      finalPausedSeconds += (Date.now() - lastPauseTimeRef.current) / 1000;
      setPausedSeconds(finalPausedSeconds);
      lastPauseTimeRef.current = null;
    }

    // Calculate total elapsed time since session started
    let elapsedSeconds = 0;
    if (sessionStartTimeRef.current) {
      elapsedSeconds = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);
    } else {
      elapsedSeconds = totalDuration - timeLeft;
    }

    try {
      const result = await focusApi.complete(session._id, {
        completeTask,
        elapsedSeconds,
        pausedSeconds: Math.floor(finalPausedSeconds),
        distractions,
        notes,
      });

      setLastSessionSummary(result);
      setShowCompletionSummary(true);

      toast.success(`Session complete! +${result.xpAwarded} XP`);
    } catch (error) {
      console.error("Failed to complete session", error);
      toast.error("Failed to save session data");
    }
  };

  const closeCompletionSummary = () => {
    setShowCompletionSummary(false);
    setTimerState("idle");
    setSession(null);
    setLastSessionSummary(null);
    setTimeLeft(totalDuration);
  };

  const updateNotes = (newNotes: string) => {
    setNotes(newNotes);
  };

  const saveNotes = async () => {
    // Optionally persist notes immediately to backend if session exists
    // (For now, we just save it locally and push on finishSession)
    toast.success("Notes saved");
  };

  const addDistraction = (distraction: Distraction) => {
    setDistractions((prev) => [...prev, distraction]);
  };

  const progress = 1 - timeLeft / totalDuration;

  return (
    <FocusContext.Provider
      value={{
        session,
        timerState,
        timeLeft,
        totalDuration,
        progress,
        currentTask,
        notes,
        distractions,
        startSession,
        pauseSession,
        resumeSession,
        finishSession,
        startTimer: startSession,
        pauseTimer: pauseSession,
        resumeTimer: resumeSession,
        setCurrentTask,
        updateNotes,
        saveNotes,
        addDistraction,
        showCompletionSummary,
        closeCompletionSummary,
        lastSessionSummary,
      }}
    >
      {children}
    </FocusContext.Provider>
  );
}

export function useFocus() {
  const context = useContext(FocusContext);
  if (context === undefined) {
    throw new Error("useFocus must be used within a FocusProvider");
  }
  return context;
}
