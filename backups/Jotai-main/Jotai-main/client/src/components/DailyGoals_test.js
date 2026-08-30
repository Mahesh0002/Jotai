"use client"

import { useState } from "react"
import { useQuests } from "./QuestContext"
import { Check, Trash2, Plus, Edit } from 'lucide-react'
import { motion, AnimatePresence } from "framer-motion"

// --- DailyGoals Component ---
function DailyGoals() {
    // Get quest context data and functions
    const { goals, animating, showLevelUp, addGoal, toggleComplete, deleteGoal, editGoal } = useQuests()

    const [showInput, setShowInput] = useState(false)
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")

    // Edit functionality state
    const [editingGoal, setEditingGoal] = useState(null)
    const [editTitle, setEditTitle] = useState("")
    const [editDescription, setEditDescription] = useState("")

    // Handle form submission for adding new goal
    function handleAddGoal(e) {
        e.preventDefault()
        if (addGoal(title, description)) {
            setTitle("")
            setDescription("")
            setShowInput(false)
        }
    }

    // Handle edit goal
    function handleEditGoal(goal) {
        setEditingGoal(goal.id)
        setEditTitle(goal.title)
        setEditDescription(goal.description || "")
    }

    // Handle save edit
    function handleSaveEdit(e) {
        e.preventDefault()
        if (editTitle.trim()) {
            editGoal(editingGoal, editTitle, editDescription)
            setEditingGoal(null)
            setEditTitle("")
            setEditDescription("")
        }
    }

    // Handle cancel edit
    function handleCancelEdit() {
        setEditingGoal(null)
        setEditTitle("")
        setEditDescription("")
    }

    return (
        <div className="p-4 bg-black/95 rounded-2xl border border-white/10 min-h-[350px] w-full relative overflow-hidden flex flex-col will-change-transform transform-gpu">
            <h2 className="text-[1.8rem] font-bold text-error mb-8 text-center drop-shadow-[0_0_5px_rgba(231,76,60,0.5)] tracking-[2px]">DAILY QUEST</h2>
            <div className="flex flex-col gap-6">
                <ul className="flex flex-col gap-4 p-0 m-0 list-none">
                    <AnimatePresence mode="popLayout">
                        {goals.map((goal) => {
                            const isDeleting = animating[goal.id]?.deleting
                            const isCompleting = animating[goal.id]?.completing

                            // Animation classes (keeping existing ones for specific effects, but adding motion props)
                            let animationClass = ""
                            if (isDeleting) animationClass = "animate-[deleteTask_0.3s_cubic-bezier(0.4,0,0.2,1)_forwards]"
                            else if (isCompleting) animationClass = "animate-[completeTask_0.4s_cubic-bezier(0.4,0,0.2,1)]"

                            const completionClass = goal.completed
                                ? "bg-[rgba(38,58,46,0.1)] border-[rgba(46,204,113,0.3)] transition-all duration-500"
                                : "bg-black border-white/10"

                            // Check if this goal is being edited
                            const isEditing = editingGoal === goal.id

                            return (
                                <motion.li
                                    layout
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                    transition={{ duration: 0.4, type: "spring", stiffness: 100, damping: 15 }}
                                    key={goal.id}
                                    className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-500 min-h-[45px] relative overflow-hidden cursor-pointer will-change-transform transform-gpu hover:bg-black hover:border-white/20 hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)] ${completionClass} ${animationClass}`}
                                    data-id={goal.id}
                                >
                                    {isEditing ? (
                                        // Edit mode
                                        <form onSubmit={handleSaveEdit} className="flex flex-col gap-4 w-full">
                                            <input
                                                type="text"
                                                value={editTitle}
                                                onChange={(e) => setEditTitle(e.target.value)}
                                                className="p-3 bg-white/10 border border-white/20 rounded-md text-white text-base transition-all duration-200 focus:outline-none focus:border-[#3498db]/60 focus:shadow-[0_0_5px_rgba(52,152,219,0.3)]"
                                                autoFocus
                                            />
                                            <input
                                                type="text"
                                                value={editDescription}
                                                onChange={(e) => setEditDescription(e.target.value)}
                                                placeholder="Description (optional)"
                                                className="p-3 bg-white/10 border border-white/20 rounded-md text-white text-base transition-all duration-200 focus:outline-none focus:border-[#3498db]/60 focus:shadow-[0_0_5px_rgba(52,152,219,0.3)]"
                                            />
                                            <div className="flex gap-2 justify-end">
                                                <button type="submit" className="px-4 py-2 border-none rounded-md text-sm font-medium cursor-pointer transition-all duration-200 bg-[#2ecc71]/80 text-white hover:bg-[#2ecc71] hover:-translate-y-[1px]">Save</button>
                                                <button type="button" onClick={handleCancelEdit} className="px-4 py-2 border-none rounded-md text-sm font-medium cursor-pointer transition-all duration-200 bg-[#e74c3c]/80 text-white hover:bg-[#e74c3c] hover:shadow-[0_4px_12px_rgba(231,76,60,0.4)]">Cancel</button>
                                            </div>
                                        </form>
                                    ) : (
                                        // Display mode
                                        <>
                                            <div className="flex-1 mr-3">
                                                <div className={`text-base font-semibold text-white mb-1 leading-[1.3] drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] ${goal.completed ? "line-through text-[#888] opacity-70" : ""}`}>{goal.title}</div>
                                                {goal.description && <div className={`text-xs text-[#b0b0b0] leading-[1.2] opacity-80 ${goal.completed ? "line-through text-[#888] opacity-70" : ""}`}>{goal.description}</div>}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    className={`w-[30px] h-[30px] border rounded-md flex items-center justify-center cursor-pointer transition-all duration-500 relative overflow-hidden will-change-transform hover:scale-105 hover:shadow-[0_0_8px_rgba(46,204,113,0.4)] ${goal.completed ? "bg-[rgba(46,204,113,0.4)] text-white border-transparent" : "bg-[rgba(46,204,113,0.2)] border-[rgba(46,204,113,0.4)] text-[#2ecc71] hover:bg-[rgba(46,204,113,0.3)]"}`}
                                                    onClick={() => toggleComplete(goal.id)}
                                                    aria-label={goal.completed ? "Mark as incomplete" : "Mark as complete"}
                                                    disabled={isCompleting}
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button
                                                    className="w-[30px] h-[30px] border rounded-md flex items-center justify-center cursor-pointer transition-all duration-500 relative overflow-hidden will-change-transform hover:scale-105 hover:shadow-[0_0_8px_rgba(52,152,219,0.4)] bg-[rgba(52,152,219,0.2)] border-[rgba(52,152,219,0.4)] text-[#3498db] hover:bg-[rgba(52,152,219,0.3)]"
                                                    onClick={() => handleEditGoal(goal)}
                                                    aria-label="Edit goal"
                                                    disabled={isDeleting || isCompleting}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    className="w-[30px] h-[30px] border rounded-md flex items-center justify-center cursor-pointer transition-all duration-500 relative overflow-hidden will-change-transform hover:scale-105 hover:shadow-[0_0_8px_rgba(231,76,60,0.4)] bg-[rgba(231,76,60,0.2)] border-[rgba(231,76,60,0.4)] text-[#e74c3c] hover:bg-[rgba(231,76,60,0.3)]"
                                                    onClick={() => deleteGoal(goal.id)}
                                                    aria-label="Delete goal"
                                                    disabled={isDeleting}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </motion.li>
                            )
                        })}
                    </AnimatePresence>
                </ul>

                {/* Add Goal Button at the bottom */}
                {showInput ? (
                    <form onSubmit={handleAddGoal} className="flex flex-col gap-3 p-4 bg-[#721fb1]/5 border border-white/10 rounded-lg">
                        <label className="flex flex-col gap-1 text-[0.85rem] font-medium text-white">
                            New Quest
                            <input
                                type="text"
                                className="p-3 bg-white/10 border border-white/20 rounded-md text-white text-sm transition-all duration-200 focus:outline-none focus:border-[#8e44ad]/60 focus:shadow-[0_0_5px_rgba(142,68,173,0.3)] placeholder:text-[#888]"
                                placeholder="Add a new daily quest..."
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                autoFocus
                            />
                        </label>
                        <label className="flex flex-col gap-1 text-[0.85rem] font-medium text-white">
                            Description (optional)
                            <input
                                type="text"
                                className="p-3 bg-white/10 border border-white/20 rounded-md text-white text-sm transition-all duration-200 focus:outline-none focus:border-[#8e44ad]/60 focus:shadow-[0_0_5px_rgba(142,68,173,0.3)] placeholder:text-[#888]"
                                placeholder="Add a description..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </label>
                        <div className="flex gap-3 justify-end mt-2">
                            <button type="button" className="px-4 py-3 bg-[#e74c3c]/80 border border-[#e74c3c]/60 rounded-md text-white text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-[#e74c3c] hover:shadow-[0_4px_12px_rgba(231,76,60,0.4)] min-h-[40px]" onClick={() => setShowInput(false)}>
                                Cancel
                            </button>
                            <button type="submit" className="px-4 py-3 bg-[#8e44ad]/80 border border-[#8e44ad]/60 rounded-md text-white text-sm font-semibold cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 min-h-[40px] hover:bg-[#8e44ad] hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(142,68,173,0.4)]" id="add_daily_quest">
                                <Plus className="w-4 h-4" />
                                Add Daily Quest
                            </button>
                        </div>
                    </form>
                ) : (
                    <button className="px-4 py-2 text-[0.85rem] min-h-[36px] bg-[#8e44ad]/80 border border-white/20 text-white rounded-md font-semibold cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 hover:bg-[#8e44ad]/80 hover:-translate-y-[1px] hover:shadow-[0_2px_8px_rgba(255,255,255,0.1)]" onClick={() => setShowInput(true)}>
                        + Add Goal
                    </button>
                )}
            </div>

            {/* Level Up Animation */}
            {showLevelUp && (
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1000] text-center pointer-events-none will-change-[transform,opacity]">
                    <span className="text-[3rem] font-bold text-[#f1c40f] drop-shadow-[0_0_10px_rgba(241,196,15,0.8)] animate-[levelUpPulse_1.5s_cubic-bezier(0.4,0,0.2,1)]">Level UP!</span>
                    <span className="block text-[1.2rem] text-white mt-2 drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">All Quests Completed</span>
                </div>
            )}
        </div>
    )
}

export default DailyGoals
