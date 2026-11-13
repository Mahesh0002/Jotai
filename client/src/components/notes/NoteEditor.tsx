import { useState, useRef, useEffect } from "react";
import {
  Undo2,
  Redo2,
  ChevronDown,
  Bold,
  Italic,
  Strikethrough,
  Code2,
  List,
  ListTodo,
  Link2,
  Image as ImageIcon,
  MoreHorizontal,
  Folder,
  Check,
  Sparkles,
  CheckSquare,
} from "lucide-react";
import { useNotes } from "@/contexts/NotesContext";
import { formatDistanceToNow, isToday, isYesterday, format } from "date-fns";

function formatRelativeTime(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) {
    const distance = formatDistanceToNow(d, { addSuffix: true });
    if (distance.includes("less than a minute")) return "Just now";
    return distance;
  }
  if (isYesterday(d)) return "Yesterday";
  if (d.getFullYear() === new Date().getFullYear()) return format(d, "MMM d");
  return format(d, "MMM d, yyyy");
}

export function NoteEditor() {
  const { filteredAndSortedNotes, activeNoteId, updateNote } = useNotes();
  const activeNote = filteredAndSortedNotes.find((n) => n._id === activeNoteId);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [localTitle, setLocalTitle] = useState("");
  const [localContent, setLocalContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (activeNote) {
      setLocalTitle(activeNote.title || "");
      setLocalContent(activeNote.content || "");
    }
  }, [activeNoteId, activeNote?._id]); // Only reset when note ID changes

  useEffect(() => {
    if (!activeNote) return;

    // Auto-save logic
    const timeout = setTimeout(() => {
      if (localTitle !== activeNote.title || localContent !== activeNote.content) {
        setIsSaving(true);
        updateNote(activeNote._id, { title: localTitle, content: localContent }).finally(() => {
          setTimeout(() => setIsSaving(false), 500); // simulate network delay
        });
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [localTitle, localContent, activeNote, updateNote]);

  const insertFormatting = (prefix: string, suffix: string) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = localContent;
    const before = text.substring(0, start);
    const selected = text.substring(start, end);
    const after = text.substring(end);

    setLocalContent(before + prefix + selected + suffix + after);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + prefix.length, end + prefix.length);
      }
    }, 0);
  };

  if (!activeNote) {
    return (
      <div className="flex flex-col flex-1 h-full bg-zinc-950/30 rounded-xl border border-zinc-800/60 items-center justify-center text-zinc-500 mr-6">
        Select a note or create a new one.
      </div>
    );
  }

  const wordCount = localContent
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

  return (
    <div className="flex flex-col flex-1 h-full bg-zinc-950/30 rounded-xl border border-zinc-800/60 overflow-hidden relative mr-6">
      {/* Editor Toolbar */}
      <div className="flex items-center gap-1 border-b border-zinc-800/60 p-2 text-zinc-400">
        <div className="flex items-center gap-1 px-2">
          <button className="p-1.5 hover:bg-zinc-800 rounded text-zinc-500">
            <Undo2 className="h-4 w-4" />
          </button>
          <button className="p-1.5 hover:bg-zinc-800 rounded text-zinc-500">
            <Redo2 className="h-4 w-4" />
          </button>
        </div>

        <div className="h-4 w-px bg-zinc-800 mx-1" />

        <button
          onClick={() => insertFormatting("### ", "")}
          className="flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-800 rounded text-sm font-medium"
        >
          Heading <ChevronDown className="h-3 w-3" />
        </button>

        <div className="h-4 w-px bg-zinc-800 mx-1" />

        <div className="flex items-center gap-1 px-2">
          <button
            onClick={() => insertFormatting("**", "**")}
            className="p-1.5 hover:bg-zinc-800 rounded"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            onClick={() => insertFormatting("*", "*")}
            className="p-1.5 hover:bg-zinc-800 rounded"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            onClick={() => insertFormatting("~~", "~~")}
            className="p-1.5 hover:bg-zinc-800 rounded"
          >
            <Strikethrough className="h-4 w-4" />
          </button>
          <button
            onClick={() => insertFormatting("`", "`")}
            className="p-1.5 hover:bg-zinc-800 rounded"
          >
            <Code2 className="h-4 w-4" />
          </button>
        </div>

        <div className="h-4 w-px bg-zinc-800 mx-1" />

        <div className="flex items-center gap-1 px-2">
          <button
            onClick={() => insertFormatting("- ", "")}
            className="p-1.5 hover:bg-zinc-800 rounded"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => insertFormatting("- [ ] ", "")}
            className="p-1.5 hover:bg-zinc-800 rounded"
          >
            <ListTodo className="h-4 w-4" />
          </button>
        </div>

        <div className="h-4 w-px bg-zinc-800 mx-1" />

        <div className="flex items-center gap-1 px-2">
          <button
            onClick={() => insertFormatting("[", "](url)")}
            className="p-1.5 hover:bg-zinc-800 rounded"
          >
            <Link2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => insertFormatting("![alt](", ")")}
            className="p-1.5 hover:bg-zinc-800 rounded"
          >
            <ImageIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1" />
        <button className="p-1.5 hover:bg-zinc-800 rounded mr-2">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-10 pb-32 flex flex-col">
        <input
          value={localTitle}
          onChange={(e) => setLocalTitle(e.target.value)}
          className="text-4xl font-bold text-white mb-4 bg-transparent outline-none placeholder:text-zinc-700 w-full"
          placeholder="Note Title"
        />

        {/* Metadata Bar */}
        <div className="flex items-center justify-between mb-10 pb-4 border-b border-zinc-800/50">
          <div className="flex items-center gap-4 text-xs font-medium">
            {activeNote.folderId && (
              <div className="flex items-center gap-1.5 text-zinc-300">
                <Folder className="h-3.5 w-3.5 text-purple-400" />
                {activeNote.folderId.name}
              </div>
            )}
            <div className="flex items-center gap-2 text-zinc-500">
              {activeNote.tagIds.map((t) => (
                <span key={t._id}>{t.name}</span>
              ))}
            </div>
            <span className="text-zinc-600">
              Last edited {formatRelativeTime(activeNote.lastEdited)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-500">
            {isSaving ? (
              <span className="text-zinc-500">Saving...</span>
            ) : (
              <>
                <Check className="h-3.5 w-3.5" /> Saved
              </>
            )}
          </div>
        </div>

        {/* Note Body Textarea */}
        <textarea
          ref={textareaRef}
          value={localContent}
          onChange={(e) => setLocalContent(e.target.value)}
          className="flex-1 bg-transparent text-zinc-300 outline-none resize-none custom-scrollbar leading-relaxed font-mono text-sm"
          placeholder="Start writing..."
        />
      </div>

      {/* Floating Action Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 rounded-full border border-zinc-800 bg-zinc-900/95 px-6 py-3 shadow-[0_8px_30px_rgb(0,0,0,0.4)] backdrop-blur">
        <div className="flex items-center gap-3 pr-4 border-r border-zinc-800 text-[11px] text-zinc-400 font-medium">
          <span>{wordCount} words</span>
          <div className="flex items-center gap-1 rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-300">
            <span className="font-mono">M↓</span> Markdown
          </div>
        </div>

        <div className="flex items-center gap-2 pl-2">
          <button className="flex items-center gap-2 rounded-full bg-purple-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-purple-500 transition-colors shadow-[0_0_15px_rgba(147,51,234,0.3)]">
            <Sparkles className="h-3.5 w-3.5" /> Ask AI
          </button>

          <button className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-800 px-4 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors">
            <CheckSquare className="h-3.5 w-3.5 text-emerald-400" /> Create Task
          </button>

          <button className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors">
            <MoreHorizontal className="h-4 w-4" /> More
          </button>
        </div>
      </div>
    </div>
  );
}
