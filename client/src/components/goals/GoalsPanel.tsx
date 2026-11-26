import { useState, type FormEvent } from "react";
import { Check, Trash2, Target } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGoals } from "@/hooks/useGoals";
import type { Goal } from "@/lib/api";

function formatDate(value?: string): string {
  if (!value) return "No due date";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "No due date" : date.toLocaleDateString();
}

export function GoalsPanel() {
  const { goals, isLoading, error, createGoal, updateGoal, deleteGoal } = useGoals();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    const payload: Partial<Goal> = { title: trimmed, status: "active", progress: 0 };
    if (description.trim()) payload.description = description.trim();
    if (dueDate) payload.dueDate = dueDate;

    createGoal.mutate(payload, {
      onSuccess: () => {
        setTitle("");
        setDescription("");
        setDueDate("");
        toast.success("Goal created");
      },
      onError: (mutationError) => toast.error(`Could not create goal: ${mutationError.message}`),
    });
  };

  const handleToggle = (goal: Goal) => {
    const completed = goal.status !== "completed";
    updateGoal.mutate(
      {
        id: goal._id,
        data: {
          status: completed ? "completed" : "active",
          completed,
          progress: completed ? 100 : 0,
        },
      },
      {
        onError: (mutationError) => toast.error(`Could not update goal: ${mutationError.message}`),
      },
    );
  };

  const handleDelete = (goal: Goal) => {
    if (!window.confirm(`Delete “${goal.title}”?`)) return;
    deleteGoal.mutate(goal._id, {
      onError: (mutationError) => toast.error(`Could not delete goal: ${mutationError.message}`),
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-200">All goals</h2>
          <span className="text-[11px] text-zinc-500">{goals.length} total</span>
        </div>

        {isLoading ? <p className="text-sm text-zinc-500">Loading goals…</p> : null}
        {error instanceof Error ? (
          <p className="text-sm text-red-400">Could not load goals: {error.message}</p>
        ) : null}

        {!isLoading && goals.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-sm text-zinc-500">
            No goals yet. Add your first one from the form.
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {goals.map((goal) => {
              const completed = goal.status === "completed";
              return (
                <li key={goal._id} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3
                        className={`text-sm font-medium ${completed ? "text-zinc-500 line-through" : "text-zinc-100"}`}
                      >
                        {goal.title}
                      </h3>
                      {goal.description ? (
                        <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
                          {goal.description}
                        </p>
                      ) : null}
                      <p className="mt-1 text-[10px] text-zinc-600">{formatDate(goal.dueDate)}</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 border-zinc-700 bg-transparent text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
                        onClick={() => handleToggle(goal)}
                      >
                        <Check className="mr-1.5 size-3.5" />
                        {completed ? "Reopen" : "Complete"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 border-red-500/30 bg-transparent text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300"
                        onClick={() => handleDelete(goal)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className={`h-full rounded-full ${completed ? "bg-emerald-500" : "bg-purple-500"}`}
                        style={{ width: `${Math.min(100, Math.max(0, goal.progress ?? 0))}%` }}
                      />
                    </div>
                    <span className="font-mono text-[11px] text-zinc-400">
                      {goal.progress ?? 0}%
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <aside>
        <form
          onSubmit={handleCreate}
          className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/30 p-4"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
            <Target className="size-4 text-purple-400" />
            New goal
          </div>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Goal title"
            aria-label="Goal title"
            className="h-9 border-zinc-800 bg-zinc-950 text-xs text-zinc-200"
          />
          <Input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Description (optional)"
            aria-label="Goal description"
            className="h-9 border-zinc-800 bg-zinc-950 text-xs text-zinc-200"
          />
          <Input
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            aria-label="Goal due date"
            className="h-9 border-zinc-800 bg-zinc-950 text-xs text-zinc-200"
          />
          <Button
            type="submit"
            size="sm"
            className="h-8 bg-purple-600 text-xs text-white hover:bg-purple-500"
            disabled={createGoal.isPending || !title.trim()}
          >
            Add goal
          </Button>
        </form>
      </aside>
    </div>
  );
}
