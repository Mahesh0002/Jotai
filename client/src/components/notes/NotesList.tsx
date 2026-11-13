import React, { useState } from "react";
import { ChevronDown, SlidersHorizontal, Star, FileText, FolderOpen, SearchX } from "lucide-react";
import { useNotes, NoteSort } from "@/contexts/NotesContext";
import { formatDistanceToNow, isToday, isYesterday, format } from "date-fns";

// Helper for relative time
function formatRelativeTime(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) {
    // "Just now" or "2 hours ago"
    const distance = formatDistanceToNow(d, { addSuffix: true });
    // Simplify "less than a minute ago" -> "Just now"
    if (distance.includes("less than a minute")) return "Just now";
    return distance;
  }
  if (isYesterday(d)) {
    return "Yesterday";
  }
  if (d.getFullYear() === new Date().getFullYear()) {
    return format(d, "MMM d"); // e.g. Aug 21
  }
  return format(d, "MMM d, yyyy"); // e.g. Aug 10, 2026
}

export function NotesList() {
  const {
    filteredAndSortedNotes,
    activeFilter,
    searchQuery,
    activeNoteId,
    setActiveNoteId,
    togglePin,
    sortBy,
    setSortBy,
  } = useNotes();

  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const displayCount = filteredAndSortedNotes.length;

  const handleSortChange = (sort: NoteSort) => {
    setSortBy(sort);
    setShowSortDropdown(false);
  };

  // Determine empty state message
  const renderEmptyState = () => {
    if (searchQuery) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center px-4 opacity-50">
          <SearchX className="h-8 w-8 text-zinc-500 mb-3" />
          <p className="text-xs font-bold text-zinc-400 mb-1">No notes found</p>
          <p className="text-[10px] text-zinc-500">No notes match "{searchQuery}"</p>
        </div>
      );
    }
    if (activeFilter.type === "folder") {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center px-4 opacity-50">
          <FolderOpen className="h-8 w-8 text-zinc-500 mb-3" />
          <p className="text-xs font-bold text-zinc-400 mb-1">This folder is empty</p>
          <p className="text-[10px] text-zinc-500">Create a note to add it here.</p>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4 opacity-50">
        <FileText className="h-8 w-8 text-zinc-500 mb-3" />
        <p className="text-xs font-bold text-zinc-400 mb-1">No notes yet</p>
        <p className="text-[10px] text-zinc-500">
          Create your first note and start building your knowledge base.
        </p>
      </div>
    );
  };

  const getSortLabel = (s: NoteSort) => {
    switch (s) {
      case "updated":
        return "Updated";
      case "created":
        return "Created";
      case "title":
        return "Title";
      case "oldest":
        return "Oldest updated";
      case "newest":
        return "Newest created";
    }
  };

  return (
    <div className="flex flex-col w-72 shrink-0 h-full border-r border-zinc-800 pr-6 overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-white truncate max-w-[200px]">
          {activeFilter.value.replace(/^#/, "")}
        </h2>
        <button
          onClick={() => setShowFilterModal(true)}
          className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800/50">
        <span className="text-xs text-zinc-500">{displayCount} notes</span>

        {/* Sort Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="flex items-center text-[10px] text-zinc-400 hover:text-zinc-300 transition-colors py-1"
          >
            Sort by: {getSortLabel(sortBy)} <ChevronDown className="ml-1 h-3 w-3" />
          </button>

          {showSortDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowSortDropdown(false)} />
              <div className="absolute right-0 top-full mt-1 w-40 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl py-1 z-20">
                {(["updated", "created", "title", "oldest", "newest"] as NoteSort[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSortChange(s)}
                    className={`w-full text-left px-3 py-1.5 text-[11px] font-medium transition-colors ${
                      sortBy === s
                        ? "bg-purple-500/20 text-purple-300"
                        : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300"
                    }`}
                  >
                    {getSortLabel(s)}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar flex-1 pb-10">
        {filteredAndSortedNotes.length === 0
          ? renderEmptyState()
          : filteredAndSortedNotes.map((note) => {
              const isActive = note._id === activeNoteId;
              const snippet =
                note.content.substring(0, 80) + (note.content.length > 80 ? "..." : "");

              return (
                <div
                  key={note._id}
                  onClick={() => setActiveNoteId(note._id)}
                  className={`flex flex-col p-4 rounded-xl cursor-pointer transition-all ${
                    isActive
                      ? "bg-purple-900/20 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.05)] translate-x-1"
                      : "bg-zinc-900/30 border border-transparent hover:bg-zinc-900/50 hover:border-zinc-800"
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <h3
                      className={`text-sm font-semibold truncate pr-2 ${isActive ? "text-white" : "text-zinc-200"}`}
                    >
                      {note.title || "Untitled Note"}
                    </h3>
                    <Star
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePin(note._id);
                      }}
                      className={`h-3.5 w-3.5 shrink-0 mt-0.5 transition-colors ${note.pinned ? "text-amber-400 fill-amber-400" : "text-zinc-600 hover:text-zinc-400"}`}
                    />
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-relaxed mb-3 line-clamp-2 min-h-[32px]">
                    {snippet || <span className="italic opacity-50">No content</span>}
                  </p>

                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2">
                      {note.tagIds.slice(0, 2).map((tag) => (
                        <span key={tag._id} className="text-[10px] font-medium text-zinc-500">
                          {tag.name}
                        </span>
                      ))}
                      {note.tagIds.length > 2 && (
                        <span className="text-[10px] font-medium text-zinc-500">
                          +{note.tagIds.length - 2}
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[9px] font-medium uppercase tracking-wider ${isActive ? "text-purple-400/70" : "text-zinc-600"}`}
                    >
                      {formatRelativeTime(note.lastEdited)}
                    </span>
                  </div>
                </div>
              );
            })}
      </div>

      {/* Advanced Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 w-[400px] shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-2">Filter Notes</h2>
            <p className="text-xs text-zinc-400 mb-6">
              Advanced filtering options will be available here soon.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowFilterModal(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
