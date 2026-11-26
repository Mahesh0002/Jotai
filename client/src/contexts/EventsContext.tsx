import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { BACKEND_API_URL } from "@/lib/config";

/** Event type -> canonical TanStack query keys to invalidate. */
const EVENT_INVALIDATIONS: Record<string, string[]> = {
  TASK_CREATED: ["tasks", "today"],
  TASK_COMPLETED: ["tasks", "today", "progress", "status"],
  TASK_DELETED: ["tasks", "today"],
  HABIT_COMPLETED: ["habits", "habitAnalytics", "today"],
  FOCUS_STARTED: ["focusBlocks", "today", "status"],
  FOCUS_COMPLETED: ["focusBlocks", "today", "status", "progress"],
  NOTE_CHANGED: ["notes"],
  SCHEDULE_UPDATED: ["focusBlocks", "today", "calendar", "status"],
  PROPOSAL_UPDATED: ["proposals", "focusBlocks", "today"],
  HABIT_CREATED: ["habits", "habitAnalytics", "today"],
  HABIT_DELETED: ["habits", "habitAnalytics", "today"],
  SUGGESTION_CREATED: ["suggestions"],
  SUGGESTION_UPDATED: ["suggestions"],
};

type EventsContextValue = {
  lastEventId: React.MutableRefObject<number>;
};

const EventsContext = createContext<EventsContextValue | null>(null);

/**
 * Single long-poll connection to the backend event stream.
 * Replaces per-component interval polling and full page reloads.
 */
export function EventsProvider({ children }: { children: ReactNode }) {
  const lastId = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      if (cancelled) return;
      try {
        const response = await fetch(
          `${BACKEND_API_URL}/events?after=${lastId.current}&timeout=20000`,
          { credentials: "include" },
        );
        const body = await response.json();
        const payload = body?.data ?? {};
        const events = Array.isArray(payload.events) ? payload.events : [];

        if (typeof payload.lastId === "number" && payload.lastId > lastId.current) {
          lastId.current = payload.lastId;
        }

        const keys = new Set<string>();
        for (const event of events) {
          const type = event?.event_type ?? event?.eventType ?? event?.payload?.eventType;
          for (const key of EVENT_INVALIDATIONS[type] ?? []) keys.add(key);
        }
        if (keys.size > 0) {
          window.dispatchEvent(new CustomEvent("jotai-invalidate", { detail: [...keys] }));
        }
      } catch {
        // Backend may not be up yet; retry below.
      } finally {
        if (!cancelled) retryTimer = setTimeout(poll, 1000);
      }
    };

    void poll();
    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, []);

  return (
    <EventsContext.Provider value={{ lastEventId: lastId }}>{children}</EventsContext.Provider>
  );
}

export function useEvents() {
  const context = useContext(EventsContext);
  if (!context) throw new Error("useEvents must be used within EventsProvider");
  return context;
}
