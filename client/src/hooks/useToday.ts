import { useQuery, useQueryClient } from "@tanstack/react-query";
import { todayApi, tasksApi, TodaySummary, CalendarEvent, AIInsight, Task } from "@/lib/api";

/**
 * Today dashboard data. All fetching goes through TanStack Query so the single
 * `/events` listener in EventsProvider can invalidate these keys when the
 * runner or another local consumer changes data.
 */
export function useToday() {
  const queryClient = useQueryClient();

  const summaryQuery = useQuery({
    queryKey: ["today", "summary"],
    queryFn: todayApi.getSummary,
  });
  const calendarQuery = useQuery({
    queryKey: ["today", "calendar"],
    queryFn: todayApi.getCalendarEvents,
  });
  const insightsQuery = useQuery({
    queryKey: ["today", "insights"],
    queryFn: todayApi.getInsights,
  });
  const nextActionQuery = useQuery({
    queryKey: ["tasks", "next-action"],
    queryFn: tasksApi.getNextAction,
  });

  const nextAction = nextActionQuery.data
    ? { task: nextActionQuery.data.data ?? null, reason: nextActionQuery.data.reason }
    : null;

  return {
    summary: (summaryQuery.data ?? null) as TodaySummary | null,
    calendarEvents: (calendarQuery.data ?? []) as CalendarEvent[],
    insights: (insightsQuery.data ?? null) as AIInsight | null,
    nextAction: nextAction as { task: Task | null; reason: string } | null,
    loading: summaryQuery.isLoading || calendarQuery.isLoading || nextActionQuery.isLoading,
    refreshNextAction: () => queryClient.invalidateQueries({ queryKey: ["tasks", "next-action"] }),
    refreshSummary: () => queryClient.invalidateQueries({ queryKey: ["today", "summary"] }),
    refreshAll: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["today"] }),
        queryClient.invalidateQueries({ queryKey: ["tasks"] }),
      ]),
  };
}
