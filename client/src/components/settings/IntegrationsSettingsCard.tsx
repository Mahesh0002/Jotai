import { Puzzle, Check, X, ExternalLink } from "lucide-react";

export function IntegrationsSettingsCard() {
  const integrations = [
    { name: "Google Calendar", connected: true },
    { name: "Notion", connected: true },
    { name: "Spotify", connected: true },
    { name: "GitHub", connected: true },
    { name: "Trello", connected: false },
  ];

  return (
    <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 shadow-sm">
      <div className="flex items-start gap-3 mb-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20">
          <Puzzle className="h-4 w-4 text-purple-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white mb-0.5">Integrations</h2>
          <p className="text-[11px] text-zinc-400">Manage your connected accounts.</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {integrations.map((integration, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center rounded bg-zinc-900 border border-zinc-800">
                <span className="text-[10px] font-bold text-white">{integration.name[0]}</span>
              </div>
              <span className="text-xs font-medium text-zinc-300">{integration.name}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span
                className={`text-[10px] font-medium ${integration.connected ? "text-emerald-500" : "text-red-500"}`}
              >
                {integration.connected ? "Connected" : "Disconnected"}
              </span>
              {integration.connected ? (
                <Check className="h-3 w-3 text-emerald-500" />
              ) : (
                <X className="h-3 w-3 text-red-500" />
              )}
            </div>
          </div>
        ))}

        <button className="mt-3 flex w-full items-center justify-center gap-2 rounded border border-zinc-800 bg-zinc-900/30 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors">
          Manage Integrations <ExternalLink className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
