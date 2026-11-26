import { createFileRoute } from "@tanstack/react-router";
import { Lock, PlugZap } from "lucide-react";

export const Route = createFileRoute("/integrations")({
  component: IntegrationsRoute,
});

/** Cloud integrations are disabled in privacy mode; no OAuth redirects here. */
function IntegrationsRoute() {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 p-8 shadow-sm">
      <div className="flex max-w-lg flex-col items-start gap-4 rounded-xl border border-zinc-800/70 bg-zinc-900/40 p-8">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-purple-500/15 text-purple-300">
            <PlugZap className="size-4" />
          </span>
          <div>
            <h1 className="text-lg font-semibold text-white">Integrations</h1>
            <p className="text-[11px] text-zinc-500">Privacy mode is active</p>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-zinc-400">
          Cloud connectors are switched off so your tasks, notes and calendar never leave this
          laptop. The local calendar feed is configured in Settings → Calendar feed.
        </p>
        <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-[11px] text-zinc-500">
          <Lock className="size-3.5" />
          No external requests are made by this application.
        </div>
      </div>
    </div>
  );
}
