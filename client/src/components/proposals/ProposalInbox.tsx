import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Check, Inbox, Lightbulb, ListTree, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { proposalsApi, type Proposal } from "@/lib/api";

type DecisionStatus = "accepted" | "rejected";
type Decision = { id: string; status: DecisionStatus };

const TYPE_LABELS: Record<Proposal["type"], string> = {
  schedule_proposal: "Schedule plan",
  habit_insight: "Habit insight",
  subtask_suggestion: "Subtask suggestion",
  workout_plan: "Workout plan",
};

function formatDate(value?: string): string {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function summarize(proposal: Proposal): string {
  const data = proposal.data ?? {};
  if (proposal.type === "schedule_proposal") {
    const count = Array.isArray(data.blocks) ? data.blocks.length : 0;
    return `${count} block${count === 1 ? "" : "s"} proposed`;
  }
  if (proposal.type === "habit_insight") return data.title ?? "Habit insight";
  return data.taskTitle ? `Subtasks for ${data.taskTitle}` : "Subtask suggestion";
}

function ProposalTypeIcon({ type }: { type: Proposal["type"] }) {
  if (type === "schedule_proposal") return <CalendarClock className="size-4" />;
  if (type === "habit_insight") return <Lightbulb className="size-4" />;
  return <ListTree className="size-4" />;
}

function FlagPills({ proposal }: { proposal: Proposal }) {
  const topLevel = Array.isArray(proposal.flags) ? proposal.flags : [];
  const dataFlags = Array.isArray(proposal.data?.flags) ? proposal.data.flags : [];
  const flags = [...new Set([...topLevel, ...dataFlags])];
  if (flags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {flags.map((flag) => (
        <span
          key={flag}
          className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-300"
        >
          {flag.replaceAll("_", " ")}
        </span>
      ))}
    </div>
  );
}

function ProposalSummary({ proposal }: { proposal: Proposal }) {
  const data = proposal.data ?? {};

  if (proposal.type === "schedule_proposal") {
    const blocks = Array.isArray(data.blocks) ? data.blocks : [];
    return (
      <div className="flex flex-col gap-2">
        {blocks.length === 0 ? (
          <p className="text-xs text-zinc-500">No schedule blocks were included.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {blocks.slice(0, 6).map((block, index) => (
              <li
                key={`${block.startTime ?? "block"}-${index}`}
                className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-xs"
              >
                <span className="font-medium text-zinc-200">{block.title ?? "Focus block"}</span>
                <span className="font-mono text-[11px] text-zinc-400">
                  {formatDate(block.startTime)} → {formatDate(block.endTime)}
                </span>
              </li>
            ))}
          </ul>
        )}
        {blocks.length > 6 && (
          <p className="text-[11px] text-zinc-500">+{blocks.length - 6} more blocks</p>
        )}
        {data.profile ? (
          <p className="text-[11px] leading-relaxed text-zinc-500">
            <span className="font-medium text-zinc-400">Preference profile: </span>
            {data.profile}
          </p>
        ) : null}
      </div>
    );
  }

  if (proposal.type === "habit_insight") {
    const stats = data.stats ? Object.entries(data.stats) : [];
    return (
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-zinc-100">{data.title ?? "Habit insight"}</h3>
        {data.description ? (
          <p className="text-xs leading-relaxed text-zinc-400">{data.description}</p>
        ) : null}
        {data.action ? <p className="text-xs text-purple-300">{data.action}</p> : null}
        {stats.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {stats.map(([key, value]) => (
              <span
                key={key}
                className="rounded-md border border-zinc-800 bg-zinc-900/60 px-2 py-1 font-mono text-[11px] text-zinc-300"
              >
                {key.replaceAll("_", " ")}: {String(value)}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  const subtasks = Array.isArray(data.subtasks) ? data.subtasks : [];
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-zinc-400">
        {data.taskTitle ? `For “${data.taskTitle}”` : "Suggested subtasks"}
      </p>
      {subtasks.length === 0 ? (
        <p className="text-xs text-zinc-500">No subtasks were included.</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {subtasks.slice(0, 8).map((subtask) => (
            <li
              key={subtask}
              className="rounded-md border border-zinc-800 bg-zinc-900/60 px-2 py-1 text-xs text-zinc-300"
            >
              {subtask}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ProposalInbox() {
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);

  const {
    data: proposals = [],
    isPending,
    isError,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["proposals"],
    queryFn: () => proposalsApi.getAll(),
    refetchInterval: 30_000,
  });

  const decide = useMutation({
    mutationFn: ({ id, status }: Decision) => proposalsApi.updateStatus(id, status),
    onSuccess: (_updated, variables) => {
      const verb = variables.status === "accepted" ? "accepted" : "rejected";
      toast.success(`Proposal ${verb} — decision logged`);
      void queryClient.invalidateQueries({ queryKey: ["proposals"] });
      if (variables.status === "accepted") {
        window.dispatchEvent(
          new CustomEvent("jotai-invalidate", {
            detail: ["tasks", "focusBlocks", "habits", "today", "habitAnalytics"],
          }),
        );
      }
    },
    onError: (mutationError: Error) => {
      toast.error(`Could not update proposal: ${mutationError.message}`);
    },
    onSettled: () => setBusyId(null),
  });

  const handleDecision = (id: string, status: DecisionStatus) => {
    setBusyId(id);
    decide.mutate({ id, status });
  };

  const pending = proposals.filter((proposal) => proposal.status === "pending");
  const history = proposals.filter((proposal) => proposal.status !== "pending").slice(0, 20);

  return (
    <div className="flex h-full w-full flex-col gap-6 overflow-y-auto custom-scrollbar rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-sm md:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-purple-400">
            <Inbox className="size-4" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Agent inbox</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-white">Proposals</h1>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-zinc-400">
            Review suggestions from the Jōtai Runner. Accepting or rejecting records a decision for
            the preference profile; it does not apply changes to your tasks or calendar
            automatically.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-zinc-700 bg-transparent text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
          onClick={() => void refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`mr-1.5 size-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </header>

      {isError ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          Could not load proposals: {error instanceof Error ? error.message : "Unknown error"}
        </div>
      ) : null}

      {isPending ? <p className="text-sm text-zinc-500">Loading proposals…</p> : null}

      {!isPending && !isError ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="flex flex-col gap-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
              Pending
              <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[11px] font-medium text-purple-300">
                {pending.length}
              </span>
            </h2>
            {pending.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-sm text-zinc-500">
                Nothing to review. Ask the assistant to plan your day or suggest subtasks.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {pending.map((proposal) => (
                  <article
                    key={proposal._id}
                    className="rounded-xl border border-purple-500/20 bg-zinc-900/40 p-4"
                  >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-purple-300">
                        <ProposalTypeIcon type={proposal.type} />
                        {TYPE_LABELS[proposal.type] ?? "Suggestion"}
                        <span className="font-normal text-zinc-500">
                          · {formatDate(proposal.createdAt)}
                        </span>
                      </div>
                      <FlagPills proposal={proposal} />
                    </div>
                    <ProposalSummary proposal={proposal} />
                    <div className="mt-4 flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 border-zinc-700 bg-transparent text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
                        disabled={busyId === proposal._id}
                        onClick={() => handleDecision(proposal._id, "rejected")}
                      >
                        <X className="mr-1.5 size-3.5" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 bg-purple-600 text-xs text-white hover:bg-purple-500"
                        disabled={busyId === proposal._id}
                        onClick={() => handleDecision(proposal._id, "accepted")}
                      >
                        <Check className="mr-1.5 size-3.5" />
                        Accept
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className="flex flex-col gap-3">
            <div>
              <h2 className="text-sm font-semibold text-zinc-200">Decision history</h2>
              <p className="mt-0.5 text-[11px] text-zinc-500">
                Most recent {history.length} decisions
              </p>
            </div>
            {history.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-800 p-5 text-center text-xs text-zinc-500">
                No decisions yet.
              </div>
            ) : (
              <ol className="flex flex-col gap-2">
                {history.map((proposal) => (
                  <li
                    key={proposal._id}
                    className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-zinc-200">
                        {TYPE_LABELS[proposal.type] ?? "Suggestion"}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                          proposal.status === "accepted"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        {proposal.status}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11px] text-zinc-500">
                      {summarize(proposal)}
                    </p>
                    <time className="mt-1 block text-[10px] text-zinc-600">
                      {formatDate(proposal.updatedAt ?? proposal.createdAt)}
                    </time>
                  </li>
                ))}
              </ol>
            )}
          </aside>
        </div>
      ) : null}
    </div>
  );
}
