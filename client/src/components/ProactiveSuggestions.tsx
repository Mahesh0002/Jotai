import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { assistantApi } from "@/lib/api";

/**
 * Suggestions are refreshed by the single event stream in EventsProvider, not
 * by a per-component interval.
 */
export function ProactiveSuggestions() {
  const queryClient = useQueryClient();
  const { data: suggestions = [] } = useQuery({
    queryKey: ["suggestions"],
    queryFn: assistantApi.getSuggestions,
  });

  const respond = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "accept" | "dismiss" }) =>
      assistantApi.actOnSuggestion(id, action),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ["suggestions"] });
      const previous = queryClient.getQueryData(["suggestions"]);
      queryClient.setQueryData(
        ["suggestions"],
        (old: any[] | undefined) => old?.filter((s) => s._id !== id) ?? [],
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(["suggestions"], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["suggestions"] }),
  });

  const handleAction = (id: string, action: "accept" | "dismiss") => {
    respond.mutate({ id, action });
    if (action === "accept") {
      const suggestion = suggestions.find((s) => s._id === id);
      const keys =
        suggestion?.targetModule === "today"
          ? ["today", "tasks", "focusBlocks"]
          : [suggestion?.targetModule ?? "today"];
      window.dispatchEvent(new CustomEvent("jotai-invalidate", { detail: keys.filter(Boolean) }));
    }
  };

  if (suggestions.length === 0) return null;

  return (
    <div className="fixed top-20 right-6 z-40 flex w-[320px] flex-col gap-3">
      <AnimatePresence>
        {suggestions.map((suggestion) => (
          <motion.div
            key={suggestion._id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            className={`overflow-hidden rounded-xl border bg-surface/95 p-4 shadow-panel backdrop-blur-xl ${
              suggestion.priority === "high" ? "border-red-500/30" : "border-purple-500/30"
            }`}
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles
                  className={`size-4 ${suggestion.priority === "high" ? "text-red-400" : "text-purple-400"}`}
                />
                <h3 className="text-sm font-semibold text-foreground">{suggestion.title}</h3>
              </div>
              <button
                onClick={() => handleAction(suggestion._id, "dismiss")}
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Dismiss suggestion"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
              {suggestion.message}
            </p>

            <Button
              size="sm"
              className={`h-8 w-full text-xs ${
                suggestion.priority === "high"
                  ? "bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white"
                  : "bg-purple-500/20 text-purple-300 hover:bg-purple-500 hover:text-white"
              }`}
              onClick={() => handleAction(suggestion._id, "accept")}
            >
              <CheckCircle2 className="mr-1.5 size-3.5" />
              Review Plan
            </Button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
