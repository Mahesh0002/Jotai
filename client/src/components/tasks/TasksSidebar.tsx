import {
  Inbox,
  CalendarDays,
  CalendarClock,
  CheckCircle2,
  Plus,
  ChevronDown,
  Flag,
  Calendar as CalendarIcon,
  Tag,
  Clock,
} from "lucide-react";

export function TasksSidebar() {
  const views = [
    { name: "Inbox", icon: Inbox, count: 12, active: false },
    { name: "Today", icon: CalendarDays, count: 4, active: true },
    { name: "Upcoming", icon: CalendarClock, count: 18, active: false },
    { name: "Completed", icon: CheckCircle2, count: 126, active: false },
  ];

  const projects = [
    { name: "NLP Assignment", count: 12, color: "bg-purple-500" },
    { name: "Traffic Classifier", count: 24, color: "bg-blue-500" },
    { name: "Portfolio", count: 8, color: "bg-emerald-500" },
    { name: "Personal", count: 6, color: "bg-amber-500" },
  ];

  const filters = [
    { name: "Priority", icon: Flag },
    { name: "Due date", icon: CalendarIcon },
    { name: "Tags", icon: Tag },
    { name: "Estimated time", icon: Clock },
  ];

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 p-6 overflow-y-auto custom-scrollbar h-full">
      {/* Views */}
      <div className="mb-8 flex flex-col gap-1">
        {views.map((view) => (
          <button
            key={view.name}
            className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
              view.active
                ? "bg-purple-500/10 text-purple-300 font-medium"
                : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <view.icon
                className={`h-4 w-4 ${view.active ? "text-purple-400" : "text-zinc-500"}`}
              />
              {view.name}
            </div>
            <span className={`text-xs ${view.active ? "text-purple-400" : "text-zinc-500"}`}>
              {view.count}
            </span>
          </button>
        ))}
      </div>

      {/* Projects */}
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between px-1">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Projects</h3>
          <button className="text-zinc-500 hover:text-white transition-colors p-1">
            <Plus className="h-3 w-3" />
          </button>
        </div>
        <div className="flex flex-col gap-1">
          {projects.map((project) => (
            <button
              key={project.name}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className={`h-2 w-2 rounded-full ${project.color}`} />
                {project.name}
              </div>
              <span className="text-xs text-zinc-500">{project.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div>
        <h3 className="mb-3 px-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          Filters
        </h3>
        <div className="flex flex-col gap-1">
          {filters.map((filter) => (
            <button
              key={filter.name}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 transition-colors"
            >
              <div className="flex items-center gap-3">
                <filter.icon className="h-4 w-4 text-zinc-500" />
                {filter.name}
              </div>
              <ChevronDown className="h-3 w-3 text-zinc-500" />
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
