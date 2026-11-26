import { Lock, Sparkles } from "lucide-react";

/**
 * privacy mode. Kept as a component so existing layouts keep compiling.
 * There are deliberately no network requests in this file.
 */
export function ExternalSignalsSidebar() {
  return (
    <div className="flex w-[320px] shrink-0 flex-col gap-4 overflow-y-auto custom-scrollbar border-l border-zinc-800/50 bg-zinc-950/50 p-6">
      <div className="flex flex-col gap-3 rounded-xl border border-purple-500/20 bg-zinc-900/40 p-5">
        <div className="flex items-center gap-2 text-purple-300">
          <Lock className="size-4" />
          <h3 className="text-[10px] font-bold uppercase tracking-wider">Local only</h3>
        </div>
        <p className="text-[11px] leading-relaxed text-zinc-400">
          News, market and weather feeds are disabled in privacy mode. Your assistant works entirely
          from data stored on this machine.
        </p>
        <button
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent("open-ai-assistant", {
                detail: "Give me my daily update",
              }),
            )
          }
          className="flex items-center gap-2 self-start rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-[11px] text-purple-200 transition-colors hover:bg-purple-500/20"
        >
          <Sparkles className="size-3.5" />
          Ask for a daily update
        </button>
      </div>
    </div>
  );
}
