import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { goalsApi, Goal } from "../lib/api";

export function useGoals() {
  const queryClient = useQueryClient();
  const queryKey = ["goals"];

  const {
    data: goals = [],
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: () => goalsApi.getAll(),
  });

  const createGoal = useMutation({
    mutationFn: (data: Partial<Goal>) => goalsApi.create(data),
    onSuccess: (newGoal) => {
      // Optimistically prepend the new goal
      queryClient.setQueryData(queryKey, (old: Goal[] | undefined) => {
        return old ? [newGoal, ...old] : [newGoal];
      });
      // Invalidate both goals and today summary
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["today"] });
    },
  });

  const updateGoal = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Goal> }) => goalsApi.update(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel in-flight requests
      await queryClient.cancelQueries({ queryKey });
      const previousGoals = queryClient.getQueryData<Goal[]>(queryKey);

      // Optimistic update
      queryClient.setQueryData(queryKey, (old: Goal[] | undefined) => {
        if (!old) return old;
        return old.map((g) =>
          g._id === id
            ? {
                ...g,
                ...data,
                // Keep status and completed in sync optimistically
                status: data.status ?? (data.completed ? "completed" : g.status),
                completed: data.completed ?? data.status === "completed",
              }
            : g,
        );
      });

      return { previousGoals };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousGoals) {
        queryClient.setQueryData(queryKey, context.previousGoals);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["today"] });
    },
  });

  const deleteGoal = useMutation({
    mutationFn: (id: string) => goalsApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previousGoals = queryClient.getQueryData<Goal[]>(queryKey);

      // Optimistically remove
      queryClient.setQueryData(queryKey, (old: Goal[] | undefined) => {
        if (!old) return old;
        return old.filter((g) => g._id !== id);
      });

      return { previousGoals };
    },
    onError: (_err, _id, context) => {
      if (context?.previousGoals) {
        queryClient.setQueryData(queryKey, context.previousGoals);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["today"] });
    },
  });

  return {
    goals,
    isLoading,
    error,
    createGoal,
    updateGoal,
    deleteGoal,
  };
}
