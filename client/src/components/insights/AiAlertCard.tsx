import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AiAlertCard() {
  const data = [
    { label: "8 AM", value: 0.5 },
    { label: "10 AM", value: 1.2 },
    { label: "12 PM", value: 0.8 },
    { label: "2 PM", value: 1.5 },
    { label: "4 PM", value: 3.0, peak: true }, // The 3-4 PM spike
    { label: "6 PM", value: 1.8 },
    { label: "8 PM", value: 0.9 },
  ];

  // We actually need more bars to match the visual density of the screenshot.
  // The screenshot shows about 11 bars. Let's interpolate some data.
  const denseData = [
    { time: "8 AM", val: 0.3 },
    { time: "", val: 0.5 },
    { time: "10 AM", val: 0.7 },
    { time: "", val: 0.6 },
    { time: "12 PM", val: 0.9 },
    { time: "", val: 1.1 },
    { time: "2 PM", val: 1.4 },
    { time: "", val: 1.2 },
    { time: "4 PM", val: 3.0, highlight: true }, // Spike
    { time: "", val: 1.8 },
    { time: "6 PM", val: 1.5 },
    { time: "", val: 1.0 },
    { time: "8 PM", val: 0.5 },
  ];

  const maxVal = 3.5;

  return (
    <div className="flex rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 shadow-sm h-[220px]">
      {/* Left Text */}
      <div className="flex w-1/3 flex-col justify-center pr-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <TriangleAlert className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">
            AI Alert
          </span>
        </div>

        <h2 className="text-sm font-medium leading-tight text-white mb-3">
          Distraction spike detected every day between 3–4 PM.
        </h2>
        <p className="text-[11px] leading-relaxed text-zinc-400">
          You get 2.4x more notifications and context switches during this window.
        </p>
      </div>

      {/* Center Bar Chart */}
      <div className="flex flex-1 items-end border-l border-zinc-800/50 pl-6 pb-2 relative">
        <span className="absolute top-2 left-6 text-[9px] font-medium text-zinc-500">
          Context switches / hour
        </span>

        {/* Y Axis */}
        <div className="flex flex-col justify-between items-end h-[120px] pb-5 pr-3 text-[9px] font-medium text-zinc-500">
          <span>3x</span>
          <span>2x</span>
          <span>1x</span>
          <span>0</span>
        </div>

        {/* Bars */}
        <div className="flex-1 flex items-end justify-between h-[120px] pb-5 relative">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pb-5 pointer-events-none">
            <div className="border-t border-zinc-800/50 w-full" />
            <div className="border-t border-zinc-800/50 w-full" />
            <div className="border-t border-zinc-800/50 w-full" />
            <div className="border-t border-zinc-800/50 w-full" />
          </div>

          {denseData.map((d, i) => (
            <div key={i} className="flex flex-col items-center relative z-10 w-full group">
              {d.highlight && (
                <div className="absolute -top-6 rounded bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                  3.0x
                </div>
              )}
              <div
                className={`w-3.5 rounded-t-sm transition-all ${d.highlight ? "bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]" : "bg-purple-900"}`}
                style={{ height: `${(d.val / maxVal) * 100}%` }}
              >
                {!d.highlight && (
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-700 to-purple-500 mix-blend-overlay opacity-50" />
                )}
              </div>
              <span className="absolute -bottom-5 text-[9px] text-zinc-500 whitespace-nowrap">
                {d.time}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Recommendation */}
      <div className="flex w-64 flex-col justify-center pl-6 border-l border-zinc-800/50 ml-6">
        <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/30 p-4">
          <h4 className="text-[9px] font-bold tracking-wider text-amber-500 uppercase mb-2">
            Recommendation
          </h4>
          <p className="text-[10px] leading-relaxed text-zinc-300 mb-4">
            Schedule admin or light work during this window to protect deep work.
          </p>
          <Button
            variant="outline"
            className="h-7 w-full border-zinc-700 bg-transparent text-[10px] text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            Reschedule tasks
          </Button>
        </div>
      </div>
    </div>
  );
}
