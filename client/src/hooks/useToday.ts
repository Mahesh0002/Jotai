import { useState, useEffect, useCallback } from "react";
import { todayApi, tasksApi, TodaySummary, CalendarEvent, AIInsight, Task } from "@/lib/api";
import { toast } from "sonner";

export function useToday() {
  const [summary, setSummary] = useState<TodaySummary | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [insights, setInsights] = useState<AIInsight | null>(null);
  const [nextAction, setNextAction] = useState<{ task: Task | null; reason: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sum, events, ins, nxt] = await Promise.all([
        todayApi.getSummary(),
        todayApi.getCalendarEvents(),
        todayApi.getInsights(),
        tasksApi.getNextAction(),
      ]);

      setSummary(sum);
      setCalendarEvents(events);
      setInsights(ins);
      setNextAction({ task: nxt.data, reason: nxt.reason });
    } catch (error) {
      console.error("Failed to fetch Today data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const refreshNextAction = async () => {
    try {
      const nxt = await tasksApi.getNextAction();
      setNextAction({ task: nxt.data, reason: nxt.reason });
    } catch (error) {
      console.error("Failed to refresh next action", error);
    }
  };

  const refreshSummary = async () => {
    try {
      const sum = await todayApi.getSummary();
      setSummary(sum);
    } catch (error) {
      console.error("Failed to refresh summary", error);
    }
  };

  return {
    summary,
    calendarEvents,
    insights,
    nextAction,
    loading,
    refreshNextAction,
    refreshSummary,
    refreshAll: fetchAll
  };
}
