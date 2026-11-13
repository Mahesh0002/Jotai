import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { Note, NoteFolder, NoteTag, notesApi } from "@/lib/api";
import { toast } from "sonner";

export type NoteSort = "updated" | "created" | "title" | "oldest" | "newest";

export type Filter = {
  type: "library" | "folder" | "tag";
  value: string;
};

type NotesContextType = {
  notes: Note[];
  folders: NoteFolder[];
  tags: NoteTag[];

  // UI State
  activeNoteId: string | null;
  activeFilter: Filter;
  searchQuery: string;
  sortBy: NoteSort;

  // Derived state
  filteredAndSortedNotes: Note[];

  // Setters
  setActiveNoteId: (id: string | null) => void;
  setActiveFilter: (filter: Filter) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: NoteSort) => void;

  // Mutations
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  createNote: () => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;

  createFolder: (name: string, color?: string, icon?: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;

  createTag: (name: string, color?: string) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;

  isLoading: boolean;
};

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [tags, setTags] = useState<NoteTag[]>([]);

  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<Filter>({ type: "library", value: "All Notes" });
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<NoteSort>("updated");

  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [fetchedNotes, fetchedFolders, fetchedTags] = await Promise.all([
        notesApi.getAll(),
        notesApi.getFolders(),
        notesApi.getTags(),
      ]);
      setNotes(fetchedNotes);
      setFolders(fetchedFolders);
      setTags(fetchedTags);

      if (fetchedNotes.length > 0 && !activeNoteId) {
        setActiveNoteId(fetchedNotes[0]._id);
      }
    } catch (err) {
      console.error("Failed to load notes data", err);
      toast.error("Failed to load notes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- Derived State Pipeline ---
  const filteredAndSortedNotes = useMemo(() => {
    let result = [...notes];

    // 1. Search Filter
    if (searchQuery.trim()) {
      const lowerQ = searchQuery.toLowerCase();
      result = result.filter(
        (n) => n.title.toLowerCase().includes(lowerQ) || n.content.toLowerCase().includes(lowerQ),
      );
    }

    // 2. Sidebar Filter
    if (activeFilter.type === "library") {
      if (activeFilter.value === "Pinned") {
        result = result.filter((n) => n.pinned);
      } else if (activeFilter.value === "Recent") {
        // Last 7 days
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        result = result.filter((n) => new Date(n.lastEdited).getTime() > sevenDaysAgo);
      }
    } else if (activeFilter.type === "folder") {
      result = result.filter((n) => n.folderId?._id === activeFilter.value);
    } else if (activeFilter.type === "tag") {
      result = result.filter((n) => n.tagIds.some((t) => t._id === activeFilter.value));
    }

    // 3. Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "updated":
          return new Date(b.lastEdited).getTime() - new Date(a.lastEdited).getTime();
        case "oldest":
          return new Date(a.lastEdited).getTime() - new Date(b.lastEdited).getTime();
        case "created":
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return result;
  }, [notes, activeFilter, searchQuery, sortBy]);

  // Ensure activeNoteId is valid based on filtered results
  useEffect(() => {
    if (filteredAndSortedNotes.length > 0) {
      const activeNoteExists = filteredAndSortedNotes.some((n) => n._id === activeNoteId);
      if (!activeNoteExists) {
        // Don't auto-switch unless necessary, but if it's completely gone from view, maybe switch
        // Actually, keeping the active note visible in editor even if filtered out is sometimes desired,
        // but for now let's switch to the first available if it's not in the list.
        setActiveNoteId(filteredAndSortedNotes[0]._id);
      }
    } else {
      setActiveNoteId(null);
    }
  }, [filteredAndSortedNotes, activeNoteId]);

  // --- Mutations ---
  const updateNote = async (id: string, updates: Partial<Note>) => {
    // Optimistic update
    setNotes((prev) =>
      prev.map((n) =>
        n._id === id ? { ...n, ...updates, lastEdited: new Date().toISOString() } : n,
      ),
    );
    try {
      // The backend expects folderId and tagIds as strings or arrays of strings for update
      const payload: any = { ...updates };
      if (payload.folderId && typeof payload.folderId === "object")
        payload.folderId = payload.folderId._id;
      if (payload.tagIds)
        payload.tagIds = payload.tagIds.map((t: any) => (typeof t === "object" ? t._id : t));

      const updated = await notesApi.update(id, payload);
      // Replace with backend truth
      setNotes((prev) => prev.map((n) => (n._id === id ? updated : n)));
    } catch (err) {
      console.error("Failed to update note", err);
      toast.error("Failed to save changes");
      loadData(); // Revert on failure
    }
  };

  const createNote = async () => {
    try {
      let folderId = undefined;
      let tagIds: string[] = [];

      if (activeFilter.type === "folder") {
        folderId = activeFilter.value;
      } else if (activeFilter.type === "tag") {
        tagIds = [activeFilter.value];
      }

      const newNote = await notesApi.create({
        title: "Untitled Note",
        content: "",
        folderId: folderId as any,
        tagIds: tagIds as any,
        pinned: false,
      });

      setNotes((prev) => [newNote, ...prev]);
      setActiveNoteId(newNote._id);
    } catch (err) {
      console.error("Failed to create note", err);
      toast.error("Failed to create note");
    }
  };

  const deleteNote = async (id: string) => {
    setNotes((prev) => prev.filter((n) => n._id !== id));
    try {
      await notesApi.delete(id);
      toast.success("Note deleted");
    } catch (err) {
      console.error("Failed to delete note", err);
      toast.error("Failed to delete note");
      loadData();
    }
  };

  const togglePin = async (id: string) => {
    const note = notes.find((n) => n._id === id);
    if (!note) return;

    // Optimistic
    setNotes((prev) => prev.map((n) => (n._id === id ? { ...n, pinned: !n.pinned } : n)));
    try {
      const updated = await notesApi.update(id, { pinned: !note.pinned });
      setNotes((prev) => prev.map((n) => (n._id === id ? updated : n)));
    } catch (err) {
      toast.error("Couldn't update pin");
      loadData(); // revert
    }
  };

  const createFolder = async (name: string, color?: string, icon?: string) => {
    try {
      const newFolder = await notesApi.createFolder({ name, color, icon });
      setFolders((prev) => [...prev, newFolder]);
      toast.success("Folder created");
    } catch (err) {
      toast.error("Failed to create folder");
    }
  };

  const deleteFolder = async (id: string) => {
    try {
      await notesApi.deleteFolder(id);
      setFolders((prev) => prev.filter((f) => f._id !== id));
      // Optional: unassign folder from all notes
      setNotes((prev) => prev.map((n) => (n.folderId?._id === id ? { ...n, folderId: null } : n)));
      toast.success("Folder deleted");
    } catch (err) {
      toast.error("Failed to delete folder");
    }
  };

  const createTag = async (name: string, color?: string) => {
    // Ensure format includes #
    const formattedName = name.startsWith("#") ? name : `#${name}`;
    try {
      const newTag = await notesApi.createTag({ name: formattedName, color });
      setTags((prev) => [...prev, newTag]);
      toast.success("Tag created");
    } catch (err) {
      toast.error("Failed to create tag. Does it already exist?");
    }
  };

  const deleteTag = async (id: string) => {
    try {
      await notesApi.deleteTag(id);
      setTags((prev) => prev.filter((t) => t._id !== id));
      // Remove tag from notes
      setNotes((prev) => prev.map((n) => ({ ...n, tagIds: n.tagIds.filter((t) => t._id !== id) })));
      toast.success("Tag deleted");
    } catch (err) {
      toast.error("Failed to delete tag");
    }
  };

  return (
    <NotesContext.Provider
      value={{
        notes,
        folders,
        tags,
        activeNoteId,
        activeFilter,
        searchQuery,
        sortBy,
        filteredAndSortedNotes,
        setActiveNoteId,
        setActiveFilter,
        setSearchQuery,
        setSortBy,
        updateNote,
        createNote,
        deleteNote,
        togglePin,
        createFolder,
        deleteFolder,
        createTag,
        deleteTag,
        isLoading,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error("useNotes must be used within a NotesProvider");
  }
  return context;
}
