import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksApi, Task } from "../lib/api";

export function useTasks(filters?: any) {
  const queryClient = useQueryClient();
  const queryKey = ["tasks", filters];

  const {
    data: tasks = [],
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: () => tasksApi.getAll(filters),
  });

  const createTask = useMutation({
    mutationFn: tasksApi.create,
    onSuccess: (newTask) => {
      queryClient.setQueryData(queryKey, (old: Task[] | undefined) => {
        return old ? [newTask, ...old] : [newTask];
      });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const updateTask = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) => tasksApi.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previousTasks = queryClient.getQueryData<Task[]>(queryKey);

      queryClient.setQueryData(queryKey, (old: Task[] | undefined) => {
        if (!old) return old;
        return old.map((t) => (t._id === id ? { ...t, ...data } : t));
      });

      return { previousTasks };
    },
    onError: (err, newTodo, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKey, context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const completeTask = useMutation({
    mutationFn: tasksApi.complete,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previousTasks = queryClient.getQueryData<Task[]>(queryKey);

      // Optimistically move task to completed
      queryClient.setQueryData(queryKey, (old: Task[] | undefined) => {
        if (!old) return old;
        return old.map((t) => (t._id === id ? { ...t, status: "completed" as const } : t));
      });

      return { previousTasks };
    },
    onError: (err, id, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKey, context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const toggleSubtask = useMutation({
    mutationFn: ({
      taskId,
      subtaskId,
      isCompleted,
    }: {
      taskId: string;
      subtaskId: string;
      isCompleted: boolean;
    }) => tasksApi.toggleSubtask(taskId, subtaskId, isCompleted),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const deleteTask = useMutation({
    mutationFn: tasksApi.delete,
    onSuccess: (_, id) => {
      queryClient.setQueryData(queryKey, (old: Task[] | undefined) => {
        if (!old) return old;
        return old.filter((t) => t._id !== id);
      });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  return {
    tasks,
    isLoading,
    error,
    createTask,
    updateTask,
    completeTask,
    toggleSubtask,
    deleteTask,
  };
}
