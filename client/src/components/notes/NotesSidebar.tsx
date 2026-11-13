import React, { useState } from "react";
import { FileText, Pin, Clock, Star, Trash2, Folder, Hash, Plus, X } from "lucide-react";
import { useNotes, Filter } from "@/contexts/NotesContext";
import { motion, AnimatePresence } from "framer-motion";

export function NotesSidebar() {
  const { notes, folders, tags, activeFilter, setActiveFilter, createFolder, createTag } =
    useNotes();

  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);

  const [newFolderName, setNewFolderName] = useState("");
  const [newTagName, setNewTagName] = useState("");

  const [showAllTags, setShowAllTags] = useState(false);

  // Compute counts dynamically
  const allCount = notes.length;
  const pinnedCount = notes.filter((n: any) => n.pinned).length;
  // Recent: last 7 days
  const recentCount = notes.filter(
    (n: any) => new Date(n.lastEdited).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000,
  ).length;

  // Folder and Tag counts
  const folderCounts: Record<string, number> = {};
  const tagCounts: Record<string, number> = {};

  notes.forEach((n: any) => {
    if (n.folderId) {
      folderCounts[n.folderId._id] = (folderCounts[n.folderId._id] || 0) + 1;
    }
    n.tagIds.forEach((t: any) => {
      tagCounts[t._id] = (tagCounts[t._id] || 0) + 1;
    });
  });

  const library = [
    {
      name: "All Notes",
      count: allCount,
      icon: FileText,
      filter: { type: "library", value: "All Notes" } as Filter,
    },
    {
      name: "Pinned",
      count: pinnedCount,
      icon: Pin,
      filter: { type: "library", value: "Pinned" } as Filter,
    },
    {
      name: "Recent",
      count: recentCount,
      icon: Clock,
      filter: { type: "library", value: "Recent" } as Filter,
    },
  ];

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      await createFolder(newFolderName.trim());
      setNewFolderName("");
      setShowFolderModal(false);
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTagName.trim()) {
      await createTag(newTagName.trim().replace(/^#/, ""));
      setNewTagName("");
      setShowTagModal(false);
    }
  };

  const visibleTags = showAllTags ? tags : tags.slice(0, 5);

  return (
    <>
      <div className="flex flex-col w-56 shrink-0 h-full overflow-y-auto custom-scrollbar pr-4">
        {/* LIBRARY */}
        <div className="mb-8">
          <h3 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Library
          </h3>
          <div className="flex flex-col gap-1">
            {library.map((item, i) => {
              const isActive =
                activeFilter.type === item.filter.type && activeFilter.value === item.filter.value;
              return (
                <div
                  key={i}
                  onClick={() => setActiveFilter(item.filter)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                    isActive
                      ? "bg-purple-500/20 text-purple-400"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <span className={`text-[10px] ${isActive ? "text-purple-300" : "text-zinc-500"}`}>
                    {item.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* FOLDERS */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3 pr-2">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Folders
            </h3>
            <button
              onClick={() => setShowFolderModal(true)}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
          <div className="flex flex-col gap-1">
            {folders.map((folder: any) => {
              const isActive = activeFilter.type === "folder" && activeFilter.value === folder._id;
              const count = folderCounts[folder._id] || 0;
              return (
                <div
                  key={folder._id}
                  onClick={() => setActiveFilter({ type: "folder", value: folder._id })}
                  className={`flex items-center justify-between rounded-lg px-3 py-1.5 cursor-pointer transition-colors ${
                    isActive
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Folder className="h-4 w-4 text-zinc-500" />
                    <span className="text-sm font-medium">{folder.name}</span>
                  </div>
                  <span className="text-[10px] text-zinc-500">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* TAGS */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3 pr-2">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Tags</h3>
            <button
              onClick={() => setShowTagModal(true)}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
          <div className="flex flex-col gap-1">
            {visibleTags.map((tag: any) => {
              const isActive = activeFilter.type === "tag" && activeFilter.value === tag._id;
              const count = tagCounts[tag._id] || 0;
              return (
                <div
                  key={tag._id}
                  onClick={() => setActiveFilter({ type: "tag", value: tag._id })}
                  className={`flex items-center justify-between rounded-lg px-3 py-1.5 cursor-pointer transition-colors ${
                    isActive
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Hash className="h-3.5 w-3.5 text-zinc-500" />
                    <span className="text-sm font-medium">{tag.name.replace("#", "")}</span>
                  </div>
                  <span className="text-[10px] text-zinc-500">{count}</span>
                </div>
              );
            })}

            {tags.length > 5 && (
              <button
                onClick={() => setShowAllTags(!showAllTags)}
                className="text-[11px] text-zinc-500 hover:text-zinc-300 text-left px-3 pt-2 mt-1"
              >
                {showAllTags ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MODALS */}
      <AnimatePresence>
        {showFolderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 w-[400px] shadow-2xl"
            >
              <h2 className="text-lg font-bold text-white mb-4">Create Folder</h2>
              <form onSubmit={handleCreateFolder}>
                <div className="mb-6">
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    Folder Name
                  </label>
                  <input
                    autoFocus
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="e.g. College"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowFolderModal(false)}
                    className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newFolderName.trim()}
                    className="px-4 py-2 text-sm font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showTagModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 w-[400px] shadow-2xl"
            >
              <h2 className="text-lg font-bold text-white mb-4">Create Tag</h2>
              <form onSubmit={handleCreateTag}>
                <div className="mb-6">
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    Tag Name
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">
                      #
                    </span>
                    <input
                      autoFocus
                      type="text"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="e.g. machine-learning"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowTagModal(false)}
                    className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newTagName.trim()}
                    className="px-4 py-2 text-sm font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
