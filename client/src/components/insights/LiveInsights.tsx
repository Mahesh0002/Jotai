import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { todayApi } from "@/lib/api";

export function LiveInsights() {
  const {
    data: insight,
    isPending,
    isError,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["today-insights"],
    queryFn: () => todayApi.getInsights(),
    staleTime: 5 * 60_000,
  });

  return (
    <div className="relative flex min-h-[220px] flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
            Computed insight
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-7 border-zinc-700 bg-transparent text-[11px] text-zinc-400 hover:bg-zinc-800 hover:text-white"
          onClick={() => void refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`mr-1.5 size-3 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {isPending ? (
        <p className="mt-6 text-sm text-zinc-500">Loading insight…</p>
      ) : isError ? (
        <p className="mt-6 text-sm text-red-400">
          Could not load insight: {error instanceof Error ? error.message : "Unknown error"}
        </p>
      ) : !insight ? (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-white">No insight yet</h3>
          <p className="mt-2 text-xs leading-relaxed text-zinc-400">
            Complete at least three focus sessions in the last 30 days to unlock a focus-window
            insight.
          </p>
        </div>
      ) : (
        <div className="mt-6">
          <h2 className="text-2xl font-medium leading-tight text-white">{insight.headline}</h2>
          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-zinc-400">
            {insight.description}
          </p>
          <div className="mt-6 max-w-md">
            <div className="mb-1.5 flex justify-between text-[10px] font-medium uppercase tracking-wide text-zinc-500">
              <span>Confidence</span>
              <span className="font-mono text-zinc-300">
                {Math.round(insight.confidence * 100)}%
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-purple-500"
                style={{ width: `${Math.round(insight.confidence * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <p className="mt-6 text-[10px] text-zinc-600">
        Computed from your completed focus sessions — no LLM call.
      </p>
    </div>
  );
}
