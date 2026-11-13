import { Sparkles, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewsWidget, MarketWidget, WeatherWidget } from "./jotai-widgets";

export function AIAssistantCard() {
  const openAI = () => window.dispatchEvent(new CustomEvent("open-ai-assistant"));

  return (
    <div className="flex flex-col rounded-xl border border-purple-500/20 bg-zinc-900/50 p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-purple-300">
          <Sparkles className="h-4 w-4" />
          <span className="text-[10px] font-semibold uppercase tracking-wider">AI Assistant</span>
        </div>
        <button onClick={openAI} className="text-zinc-500 hover:text-zinc-300 transition-colors">
          <Maximize2 className="h-3 w-3" />
        </button>
      </div>

      <p className="mb-4 text-sm text-zinc-300">How can I help you today?</p>

      <div className="grid grid-cols-2 gap-2">
        <Button
          onClick={openAI}
          variant="outline"
          className="h-auto whitespace-normal border-zinc-800 bg-zinc-950/50 p-2 text-xs text-zinc-400 hover:text-foreground justify-start text-left"
        >
          What should I focus on?
        </Button>
        <Button
          onClick={openAI}
          variant="outline"
          className="h-auto whitespace-normal border-zinc-800 bg-zinc-950/50 p-2 text-xs text-zinc-400 hover:text-foreground justify-start text-left"
        >
          Plan my day
        </Button>
        <Button
          onClick={openAI}
          variant="outline"
          className="h-auto whitespace-normal border-zinc-800 bg-zinc-950/50 p-2 text-xs text-zinc-400 hover:text-foreground justify-start text-left"
        >
          Review my progress
        </Button>
        <Button
          onClick={openAI}
          variant="outline"
          className="h-auto whitespace-normal border-zinc-800 bg-zinc-950/50 p-2 text-xs text-zinc-400 hover:text-foreground justify-start text-left"
        >
          Add a new task
        </Button>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={openAI}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.3)] transition-transform hover:scale-110 active:scale-95"
        >
          <Sparkles className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function IntelligenceRail() {
  return (
    <aside className="flex w-80 shrink-0 flex-col gap-6 overflow-y-auto custom-scrollbar pb-10">
      <AIAssistantCard />

      <div className="flex items-center gap-3 opacity-60">
        <span className="h-px flex-1 bg-zinc-800" />
        <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
          External Signals
        </span>
        <span className="h-px flex-1 bg-zinc-800" />
      </div>

      <NewsWidget />
      <MarketWidget />
      <WeatherWidget />
    </aside>
  );
}
