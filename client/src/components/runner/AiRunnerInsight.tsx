import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AiRunnerInsight() {
  return (
    <div className="flex flex-col rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-zinc-950 p-6 shadow-[0_0_15px_rgba(168,85,247,0.05)] relative overflow-hidden">
      {/* Glow effect */}
      <div className="absolute -left-12 -top-12 h-32 w-32 rounded-full bg-purple-500/20 blur-[40px]" />

      <div className="flex items-center gap-2 mb-4 relative z-10">
        <Sparkles className="h-4 w-4 text-purple-400" />
        <h2 className="text-[10px] font-bold uppercase tracking-wider text-white">
          AI Runner Insight
        </h2>
      </div>

      <div className="flex flex-col gap-4 relative z-10">
        <p className="text-[11px] leading-relaxed text-zinc-300">
          You're building strong momentum! Your focus time is{" "}
          <span className="font-bold text-white">22% higher</span> than last week.
        </p>
        <p className="text-[11px] leading-relaxed text-zinc-300">
          Stay consistent for 3 more days to reach Level 09.
        </p>

        <Button className="w-full mt-2 h-9 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 text-xs font-medium border border-purple-500/30 transition-all">
          View Detailed Analysis
        </Button>
      </div>
    </div>
  );
}
