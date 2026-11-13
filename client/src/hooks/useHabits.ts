import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { habitsApi, Habit, HabitAnalytics } from "../lib/api";

export function useHabits(date?: string, status?: string) {
  const queryClient = useQueryClient();
  const queryKey = ["habits", { date, status }];

  const {
    data: habits = [],
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: () => habitsApi.getAll(date, status),
  });

  const createHabit = useMutation({
    mutationFn: habitsApi.create,
    onSuccess: (newHabit) => {
      queryClient.setQueryData(queryKey, (old: Habit[] | undefined) => {
        return old ? [...old, newHabit] : [newHabit];
      });
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["habitAnalytics"] });
    },
  });

  const updateHabit = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Habit> }) => habitsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["habitAnalytics"] });
    },
  });

  const updateHabitStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "paused" | "archived" }) =>
      habitsApi.update(id, { status }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["habits"] });
      const previousHabits = queryClient.getQueryData<Habit[]>(queryKey);

      queryClient.setQueryData(queryKey, (old: Habit[] | undefined) => {
        if (!old) return old;
        return old.map((h) => (h._id === id ? { ...h, status } : h));
      });
      return { previousHabits };
    },
    onError: (err, variables, context) => {
      if (context?.previousHabits) {
        queryClient.setQueryData(queryKey, context.previousHabits);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
  });

  const duplicateHabit = useMutation({
    mutationFn: async (habit: Habit) => {
      const { _id, createdAt, updatedAt, ...rest } = habit;
      return habitsApi.create({ ...rest, name: `${rest.name} Copy` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
  });

  const toggleCompletion = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "completed" | "incomplete" }) =>
      habitsApi.toggleCompletion(id, date, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousHabits = queryClient.getQueryData<Habit[]>(queryKey);

      // Optimistically update
      queryClient.setQueryData(queryKey, (old: Habit[] | undefined) => {
        if (!old) return old;
        return old.map((h) => {
          if (h._id === id) {
            // Also optimistically bump streak
            const isCompleted = status === "completed";
            const streakMod =
              isCompleted && !h.isCompletedToday ? 1 : !isCompleted && h.isCompletedToday ? -1 : 0;
            return {
              ...h,
              isCompletedToday: isCompleted,
              currentStreak: (h.currentStreak || 0) + streakMod,
            };
          }
          return h;
        });
      });

      return { previousHabits };
    },
    onError: (err, newTodo, context) => {
      if (context?.previousHabits) {
        queryClient.setQueryData(queryKey, context.previousHabits);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["habitAnalytics"] });
      // We don't necessarily need to invalidate 'habits' here if we trust the optimistic update,
      // but it's safer to ensure we have truth from DB if there were any weird race conditions.
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteHabit = useMutation({
    mutationFn: habitsApi.delete,
    onSuccess: (_, id) => {
      queryClient.setQueryData(queryKey, (old: Habit[] | undefined) => {
        if (!old) return old;
        return old.filter((h) => h._id !== id);
      });
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["habitAnalytics"] });
    },
  });

  return {
    habits,
    isLoading,
    error,
    createHabit,
    updateHabit,
    updateHabitStatus,
    duplicateHabit,
    toggleCompletion,
    deleteHabit,
  };
}

export function useHabitAnalytics() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["habitAnalytics"],
    queryFn: () => habitsApi.getAnalytics(),
  });

  return {
    analytics,
    isLoading,
  };
}
