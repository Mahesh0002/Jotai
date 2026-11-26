import { Search, ChevronDown, Bell, Zap } from "lucide-react";
import { useNotes } from "@/contexts/NotesContext";

export function NotesHeader() {
  const { notes, searchQuery, setSearchQuery, createNote } = useNotes();

  const stats = [
    { value: notes.length.toString(), label: "All Notes" },
    { value: notes.filter((n) => n.pinned).length.toString(), label: "Pinned" },
    {
      value: notes
        .filter((n) => new Date(n.lastEdited).getTime() > Date.now() - 86400000)
        .length.toString(),
      label: "Updated Today",
    },
    { value: "3", label: "Shared with me" }, // Assuming shared is static for now
  ];

  return (
    <div className="flex flex-col gap-6 w-full mb-6">
      <div className="flex items-start justify-between">
        {/* Title & Description */}
        <div className="flex flex-col">
          <h1 className="text-2xl font-semibold tracking-tight text-white mb-1">Notes</h1>
          <p className="text-sm text-zinc-400">Capture ideas, knowledge and thoughts.</p>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900/50 pl-9 pr-12 text-sm text-zinc-300 placeholder:text-zinc-500 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
              ⌘K
            </div>
          </div>

          {/* New Note Button */}
          <div className="flex items-center">
            <button
              onClick={createNote}
              className="flex h-10 items-center gap-2 rounded-lg bg-purple-600 px-4 text-sm font-medium text-white hover:bg-purple-500 transition-colors shadow-[0_0_15px_rgba(147,51,234,0.3)]"
            >
              + New Note
            </button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex gap-4">
        {stats.map((s, i) => (
          <div
            key={i}
            className={`flex flex-col rounded-xl border ${i === 0 ? "border-purple-500/30 bg-purple-500/10" : "border-zinc-800 bg-zinc-900/30"} px-6 py-4 min-w-[140px]`}
          >
            <span
              className={`text-xl font-bold mb-1 ${i === 0 ? "text-purple-400" : "text-white"}`}
            >
              {s.value}
            </span>
            <span className="text-[11px] font-medium text-zinc-400">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
