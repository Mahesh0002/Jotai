import { createFileRoute } from "@tanstack/react-router";
import { NotesHeader } from "@/components/notes/NotesHeader";
import { NotesSidebar } from "@/components/notes/NotesSidebar";
import { NotesList } from "@/components/notes/NotesList";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { NoteInsightsPanel } from "@/components/notes/NoteInsightsPanel";
import { NotesProvider } from "@/contexts/NotesContext";

export const Route = createFileRoute("/notes")({
  component: NotesRoute,
});

function NotesRoute() {
  return (
    <NotesProvider>
      <div className="flex flex-col h-full w-full bg-zinc-950 overflow-hidden rounded-xl border border-zinc-800 shadow-sm p-6">
        {/* Top Header Row */}
        <NotesHeader />

        {/* Main Workspace (4 Columns) */}
        <div className="flex flex-1 overflow-hidden mt-2">
          {/* Column 1: Library & Folders */}
          <NotesSidebar />

          {/* Column 2: Note List */}
          <NotesList />

          {/* Column 3: Main Editor Area */}
          <NoteEditor />

          {/* Column 4: AI & Insights */}
          <NoteInsightsPanel />
        </div>
      </div>
    </NotesProvider>
  );
}
