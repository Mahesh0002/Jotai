import { PenLine } from "lucide-react";
import { useFocus } from "@/contexts/FocusContext";

export function SessionNotesCard() {
  const { notes, updateNotes, saveNotes } = useFocus();

  return (
    <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
          Session Notes
        </h2>
        <PenLine className="h-3.5 w-3.5 text-zinc-500" />
      </div>

      <textarea
        value={notes}
        onChange={(e) => updateNotes(e.target.value)}
        placeholder="Type your thoughts..."
        className="flex-1 w-full resize-none bg-transparent text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none custom-scrollbar min-h-[120px]"
      />

      <div className="mt-2 text-[10px] text-zinc-500 leading-snug">
        Notes will be attached to this focus session.
      </div>

      <button
        onClick={saveNotes}
        className="mt-4 flex w-full items-center justify-center rounded bg-zinc-900 py-2 text-[11px] font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
      >
        Save Note
      </button>
    </div>
  );
}
