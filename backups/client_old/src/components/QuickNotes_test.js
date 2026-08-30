"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, StickyNote } from "lucide-react"

export default function QuickNotes({ notes = [], addNote, removeNote }) {
    const [note, setNote] = useState("")

    const handleAddNote = () => {
        if (note.trim()) {
            addNote(note)
            setNote("")
        }
    }

    const handleRemoveNote = (id) => {
        removeNote(id)
    }

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleAddNote()
        }
    }

    return (
        <motion.div
            className="p-5 bg-black/90 rounded-2xl border border-white/10 w-full relative overflow-hidden flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.5)] h-full"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        >
            <div className="flex items-center justify-center mb-6">
                <h3 className="text-[1.5rem] font-bold text-[#8e44ad] m-0 text-center tracking-[2px] uppercase">
                    INVENTORY NOTES
                </h3>
            </div>

            <div className="flex flex-col gap-4 mb-6">
                <div className="relative">
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your notes..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-white/30 focus:outline-none focus:border-[#f1c40f]/50 focus:bg-white/10 transition-all resize-none min-h-[100px] text-sm font-medium"
                    />
                    <motion.button
                        onClick={handleAddNote}
                        className="absolute bottom-3 right-3 bg-[#f1c40f] text-black p-2 rounded-lg hover:bg-[#f39c12] transition-colors shadow-lg"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={!note.trim()}
                    >
                        <Plus size={20} strokeWidth={3} />
                    </motion.button>
                </div>
            </div>

            <ul className="flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar flex-1 max-h-[400px]">
                <AnimatePresence mode="popLayout">
                    {notes.map((noteItem) => (
                        <motion.li
                            key={noteItem.id}
                            className="group flex items-start justify-between gap-3 bg-white/5 border border-white/5 rounded-xl p-4 hover:border-white/20 hover:bg-white/10 transition-all"
                            initial={{ opacity: 0, x: -20, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 20, scale: 0.95 }}
                            layout
                        >
                            <p className="text-white/80 text-sm whitespace-pre-wrap leading-relaxed break-words w-full">
                                {noteItem.text}
                            </p>
                            <button
                                onClick={() => handleRemoveNote(noteItem.id)}
                                className="text-white/30 hover:text-[#e74c3c] transition-colors p-1 -mr-1 opacity-0 group-hover:opacity-100"
                                title="Delete note"
                            >
                                <Trash2 size={16} />
                            </button>
                        </motion.li>
                    ))}
                </AnimatePresence>
                {notes.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center text-white/20 italic text-sm mt-4"
                    >
                        No notes yet. Start typing above!
                    </motion.div>
                )}
            </ul>
        </motion.div>
    )
}
