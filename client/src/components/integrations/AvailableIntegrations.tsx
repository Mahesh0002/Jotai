import { Mail, MessageSquare, CheckSquare, ListTodo, Slack } from "lucide-react";
import { Button } from "@/components/ui/button";

const available = [
  {
    name: "Gmail",
    desc: "Import emails, tasks and attachments into your workspace.",
    icon: (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20 text-red-500">
        <Mail className="h-5 w-5" />
      </div>
    ),
    soon: false,
  },
  {
    name: "Slack",
    desc: "Get Jōtai notifications and import conversations as notes.",
    icon: (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
        <MessageSquare className="h-5 w-5" />
      </div>
    ),
    soon: false,
  },
  {
    name: "Todoist",
    desc: "Sync tasks, projects and due dates bidirectionally.",
    icon: (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20 text-red-500">
        <CheckSquare className="h-5 w-5" />
      </div>
    ),
    soon: false,
  },
  {
    name: "Microsoft To Do",
    desc: "Sync tasks and daily planning lists.",
    icon: (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
        <ListTodo className="h-5 w-5" />
      </div>
    ),
    soon: true,
  },
];

export function AvailableIntegrations() {
  return (
    <div className="flex flex-col gap-4 mt-4">
      <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 pl-1">
        Coming Soon
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {available.map((item, i) => (
          <div
            key={i}
            className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/20 p-5 shadow-sm transition-all hover:bg-zinc-900/40 hover:border-zinc-700 opacity-75"
          >
            <div className="flex items-start gap-4 mb-6">
              {item.icon}
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">{item.name}</h3>
                  {item.soon && (
                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-amber-400">
                      SOON
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-zinc-500 mt-1 leading-snug">{item.desc}</p>
              </div>
            </div>

            <Button
              variant="outline"
              disabled
              className="w-full mt-auto h-8 border-zinc-700 bg-zinc-800/30 text-[11px] font-medium text-zinc-500 cursor-not-allowed"
            >
              Coming Soon
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
