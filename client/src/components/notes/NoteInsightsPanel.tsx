import {
  Filter,
  LayoutGrid,
  Layout,
  MapPin,
  Camera,
  ListOrdered,
  CheckSquare,
  Key,
  PenLine,
  Search,
  Globe2,
  FileText,
  Image as ImageIcon,
  Plus,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { useNotes } from "@/contexts/NotesContext";

export function NoteInsightsPanel() {
  const { activeNoteId, notes } = useNotes();
  const activeNote = notes.find((n) => n.id === activeNoteId);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const simulateAiAction = (actionName: string) => {
    setLoadingAction(actionName);
    setTimeout(() => {
      setLoadingAction(null);
      alert(`${actionName} completed for ${activeNote?.title || "this note"}`);
    }, 1500);
  };
  const aiActions = [
    { name: "Summarize", icon: ListOrdered },
    { name: "Extract Tasks", icon: CheckSquare },
    { name: "Key Points", icon: Key },
    { name: "Improve Writing", icon: PenLine },
    { name: "Find Related Notes", icon: Search },
    { name: "Translate", icon: Globe2 },
  ];

  const relatedNotes = [
    "NLP Preprocessing",
    "Parsing Techniques",
    "Lecture Notes - Week 4",
    "NLP Exam Preparation",
  ];

  return (
    <div className="flex flex-col w-72 shrink-0 h-full overflow-y-auto custom-scrollbar">
      {/* Top Icons Bar */}
      <div className="flex items-center justify-between mb-8 text-zinc-500">
        <button className="p-1.5 hover:bg-zinc-800 hover:text-zinc-300 rounded">
          <Filter className="h-4 w-4" />
        </button>
        <button className="p-1.5 hover:bg-zinc-800 hover:text-zinc-300 rounded">
          <LayoutGrid className="h-4 w-4" />
        </button>
        <button className="p-1.5 hover:bg-zinc-800 hover:text-zinc-300 rounded">
          <Layout className="h-4 w-4" />
        </button>
        <button className="p-1.5 hover:bg-zinc-800 hover:text-zinc-300 rounded">
          <MapPin className="h-4 w-4" />
        </button>
        <button className="p-1.5 hover:bg-zinc-800 hover:text-zinc-300 rounded">
          <Camera className="h-4 w-4" />
        </button>
      </div>

      {/* AI & INSIGHTS */}
      <div className="mb-8">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-4 px-1">
          AI & Insights
        </h3>
        <div className="flex flex-col gap-1">
          {aiActions.map((action, i) => (
            <button
              key={i}
              onClick={() => simulateAiAction(action.name)}
              disabled={loadingAction !== null}
              className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 transition-colors text-left disabled:opacity-50"
            >
              {loadingAction === action.name ? (
                <Loader2 className="h-4 w-4 text-purple-400 animate-spin" />
              ) : (
                <action.icon className="h-4 w-4 text-zinc-500" />
              )}
              {loadingAction === action.name ? `Processing...` : action.name}
            </button>
          ))}
        </div>
      </div>

      <div className="h-px w-full bg-zinc-800/50 mb-8" />

      {/* LINKED ITEMS */}
      <div className="mb-8">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-4 px-1">
          Linked Items
        </h3>

        {/* Tasks */}
        <div className="mb-6">
          <span className="text-[10px] text-zinc-500 px-1 mb-2 block">Tasks (1)</span>
          <div className="flex gap-3 rounded-lg border border-zinc-800 bg-zinc-900/30 p-3">
            <div className="h-3.5 w-3.5 rounded border border-zinc-600 mt-0.5 shrink-0" />
            <div className="flex flex-col flex-1">
              <span className="text-[11px] font-medium text-zinc-200 mb-1">
                Finish CFG parsing notes
              </span>
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-zinc-500">Due Fri, 30 Aug</span>
                <span className="text-[9px] font-medium text-blue-400">In Progress</span>
              </div>
            </div>
          </div>
        </div>

        {/* Related Notes */}
        <div>
          <span className="text-[10px] text-zinc-500 px-1 mb-2 block">Related Notes (4)</span>
          <div className="flex flex-col gap-1 mb-3">
            {relatedNotes.map((note, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-[11px] text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 cursor-pointer transition-colors"
              >
                <FileText className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                <span className="truncate">{note}</span>
              </div>
            ))}
          </div>
          <button className="flex items-center text-[10px] text-purple-400 hover:text-purple-300 transition-colors px-1">
            View all <ArrowRight className="ml-1 h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="h-px w-full bg-zinc-800/50 mb-8" />

      {/* ATTACHMENTS */}
      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-4 px-1">
          Attachments (2)
        </h3>

        <div className="flex flex-col gap-2 mb-4">
          <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 p-2.5">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-red-500/10 text-red-400">
                <FileText className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-medium text-zinc-300 truncate w-24">
                CFG_Notes.pdf
              </span>
            </div>
            <span className="text-[9px] text-zinc-500">1.2 MB</span>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 p-2.5">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-500/10 text-blue-400">
                <ImageIcon className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-medium text-zinc-300 truncate w-24">
                example_tree.png
              </span>
            </div>
            <span className="text-[9px] text-zinc-500">420 KB</span>
          </div>
        </div>

        <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 transition-colors w-full">
          <Plus className="h-3.5 w-3.5 text-zinc-500" />
          Add attachment
        </button>
      </div>
    </div>
  );
}
