import { Bot, Dumbbell, Gauge, Sparkles, Sunrise } from "lucide-react";
import { Button } from "@/components/ui/button";

function askAssistant(prompt: string) {
  window.dispatchEvent(new CustomEvent("open-ai-assistant", { detail: prompt }));
}

export function AIAssistantCard() {
  return (
    <div className="flex flex-col rounded-xl border border-purple-500/20 bg-zinc-900/50 p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-purple-300">
          <Sparkles className="h-4 w-4" />
          <span className="text-[10px] font-semibold uppercase tracking-wider">AI Assistant</span>
        </div>
        <button
          onClick={() => askAssistant("")}
          className="text-zinc-500 transition-colors hover:text-zinc-300"
          aria-label="Open assistant"
        >
          <Bot className="h-4 w-4" />
        </button>
      </div>

      <p className="mb-4 text-sm text-zinc-300">How can I help you today?</p>

      <div className="grid grid-cols-2 gap-2">
        <Button
          onClick={() => askAssistant("What should I focus on?")}
          variant="secondary"
          className="h-auto justify-start whitespace-normal border-zinc-800 bg-zinc-950/50 p-2 text-left text-xs text-zinc-400 hover:text-foreground"
        >
          What should I focus on?
        </Button>
        <Button
          onClick={() => askAssistant("Plan my day")}
          variant="secondary"
          className="h-auto justify-start whitespace-normal border-zinc-800 bg-zinc-950/50 p-2 text-left text-xs text-zinc-400 hover:text-foreground"
        >
          Plan my day
        </Button>
        <Button
          onClick={() => askAssistant("Give me my daily update")}
          variant="secondary"
          className="h-auto justify-start whitespace-normal border-zinc-800 bg-zinc-950/50 p-2 text-left text-xs text-zinc-400 hover:text-foreground"
        >
          Daily update
        </Button>
        <Button
          onClick={() => askAssistant("What is my status?")}
          variant="secondary"
          className="h-auto justify-start whitespace-normal border-zinc-800 bg-zinc-950/50 p-2 text-left text-xs text-zinc-400 hover:text-foreground"
        >
          My status
        </Button>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={() => askAssistant("")}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.3)] transition-transform hover:scale-110 active:scale-95"
          aria-label="Open assistant"
        >
          <Sparkles className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/** Local-only replacements for the old news / market / weather widgets. */
export function IntelligenceRail() {
  const prompts = [
    { icon: Sunrise, label: "Daily update", prompt: "Give me my daily update" },
    { icon: Gauge, label: "Status", prompt: "What is my status?" },
    { icon: Dumbbell, label: "Workout", prompt: "Suggest a workout for me" },
  ];

  return (
    <aside className="flex w-80 shrink-0 flex-col gap-6 overflow-y-auto custom-scrollbar pb-10">
      <AIAssistantCard />

      <div className="flex items-center gap-3 opacity-60">
        <span className="h-px flex-1 bg-zinc-800" />
        <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Local Signals
        </span>
        <span className="h-px flex-1 bg-zinc-800" />
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-4">
        {prompts.map(({ icon: Icon, label, prompt }) => (
          <button
            key={label}
            onClick={() => askAssistant(prompt)}
            className="flex items-center gap-3 rounded-lg border border-zinc-800/60 bg-zinc-950/40 px-3 py-2 text-left text-xs text-zinc-300 transition-colors hover:border-purple-500/40 hover:text-purple-200"
          >
            <Icon className="size-4 shrink-0 text-purple-400" />
            <span className="flex-1">{label}</span>
            <span className="text-[9px] uppercase tracking-wide text-zinc-600">Ask</span>
          </button>
        ))}
        <p className="mt-2 text-[10px] leading-relaxed text-zinc-600">
          Calculated on this device from your own tasks, focus blocks and calendar. Nothing is sent
          to the web.
        </p>
      </div>
    </aside>
  );
}
