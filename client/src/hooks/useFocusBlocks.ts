import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { focusApi, FocusBlock } from "../lib/api";

export function useFocusBlocks(filters?: { start?: string; end?: string }) {
  const queryClient = useQueryClient();
  const queryKey = ["focusBlocks", filters];

  const {
    data: blocks = [],
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: () => focusApi.getAll(filters),
  });

  const createBlock = useMutation({
    mutationFn: focusApi.create,
    onSuccess: (newBlock) => {
      queryClient.setQueryData(queryKey, (old: FocusBlock[] | undefined) => {
        return old ? [...old, newBlock] : [newBlock];
      });
      queryClient.invalidateQueries({ queryKey: ["focusBlocks"] });
    },
  });

  const updateBlock = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FocusBlock> }) =>
      focusApi.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["focusBlocks"] });
      const previousBlocks = queryClient.getQueryData<FocusBlock[]>(queryKey);

      queryClient.setQueryData(queryKey, (old: FocusBlock[] | undefined) => {
        if (!old) return old;
        return old.map((b) => (b._id === id ? { ...b, ...data } : b));
      });

      return { previousBlocks };
    },
    onError: (err, newTodo, context) => {
      if (context?.previousBlocks) {
        queryClient.setQueryData(queryKey, context.previousBlocks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["focusBlocks"] });
    },
  });

  const completeBlock = useMutation({
    mutationFn: ({ id, completeTask }: { id: string; completeTask?: boolean }) =>
      focusApi.complete(id, { completeTask }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["focusBlocks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] }); // Because task might be updated
    },
  });

  const deleteBlock = useMutation({
    mutationFn: focusApi.delete,
    onSuccess: (_, id) => {
      queryClient.setQueryData(queryKey, (old: FocusBlock[] | undefined) => {
        if (!old) return old;
        return old.filter((b) => b._id !== id);
      });
      queryClient.invalidateQueries({ queryKey: ["focusBlocks"] });
    },
  });

  return {
    blocks,
    isLoading,
    error,
    createBlock,
    updateBlock,
    completeBlock,
    deleteBlock,
  };
}
