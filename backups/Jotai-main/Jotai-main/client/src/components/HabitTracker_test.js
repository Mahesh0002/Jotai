"use client"

import { useState, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, Check, TrendingUp, Calendar, Target } from "lucide-react"

const HabitTracker = ({ habits, addHabit, toggleHabitCompletion, removeHabit }) => {
    const [newHabitText, setNewHabitText] = useState("")
    const [newFrequency, setNewFrequency] = useState("daily")
    const [isAdding, setIsAdding] = useState(false)
    const [removingHabits, setRemovingHabits] = useState(new Set())

    // Memoized calculations for better performance
    const habitStats = useMemo(() => {
        const completedHabits = habits.filter((habit) => habit.completed).length
        const totalHabits = habits.length
        const progress = totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0

        const dailyHabits = habits.filter((h) => h.frequency === "daily").length
        const weeklyHabits = habits.filter((h) => h.frequency === "weekly").length
        const monthlyHabits = habits.filter((h) => h.frequency === "monthly").length

        return {
            completedHabits,
            totalHabits,
            progress,
            dailyHabits,
            weeklyHabits,
            monthlyHabits,
        }
    }, [habits])

    const handleAddHabit = useCallback(async () => {
        if (!newHabitText.trim()) return

        setIsAdding(true)

        try {
            await addHabit(newHabitText.trim(), newFrequency)
            setNewHabitText("")
            setNewFrequency("daily")
            setTimeout(() => setIsAdding(false), 500)
        } catch (error) {
            console.error("Error adding habit:", error)
            setIsAdding(false)
        }
    }, [newHabitText, newFrequency, addHabit])

    const handleRemoveHabit = useCallback(
        (habitId) => {
            setRemovingHabits((prev) => new Set([...prev, habitId]))
            setTimeout(() => {
                removeHabit(habitId)
                setRemovingHabits((prev) => {
                    const newSet = new Set(prev)
                    newSet.delete(habitId)
                    return newSet
                })
            }, 300)
        },
        [removeHabit]
    )

    const handleToggleHabit = useCallback(
        (habitId) => {
            if (navigator.vibrate) {
                navigator.vibrate(50)
            }
            toggleHabitCompletion(habitId)
        },
        [toggleHabitCompletion]
    )

    const handleKeyPress = useCallback(
        (e) => {
            if (e.key === "Enter" && !isAdding) {
                handleAddHabit()
            }
        },
        [handleAddHabit, isAdding]
    )

    const frequencyOptions = useMemo(
        () => [
            { value: "daily", label: "Daily", icon: "📅" },
            { value: "weekly", label: "Weekly", icon: "📊" },
            { value: "monthly", label: "Monthly", icon: "🗓️" },
        ],
        []
    )

    return (
        <motion.div
            className="p-6 bg-black/90 rounded-3xl border border-white/10 w-full relative overflow-hidden flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.5)] h-full"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Target className="text-[#8e44ad]" size={20} />
                    <h3 className="text-sm font-bold text-white tracking-[2px] uppercase">
                        HABIT TRACKER
                    </h3>
                </div>
                <div className="flex items-center gap-3 text-xs font-medium text-white/40">
                    <div className="flex items-center gap-1">
                        <TrendingUp size={12} className="text-[#f1c40f]" />
                        <span>{habitStats.progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-px h-3 bg-white/10" />
                    <div className="flex items-center gap-1">
                        <Calendar size={12} className="text-[#8e44ad]" />
                        <span>{habitStats.totalHabits}</span>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1 bg-white/5 rounded-full mb-6 overflow-hidden relative">
                <motion.div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#8e44ad] to-[#f1c40f]"
                    initial={{ width: 0 }}
                    animate={{ width: `${habitStats.progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                />
                <motion.div
                    className="absolute top-0 left-0 h-full w-full bg-white/20"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    style={{ display: habitStats.progress > 0 ? "block" : "none" }}
                />
            </div>

            {/* Input Section */}
            <div className="flex gap-2 mb-6">
                <div className="flex-1 relative group">
                    <input
                        type="text"
                        value={newHabitText}
                        onChange={(e) => setNewHabitText(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Add a new habit..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#8e44ad]/50 transition-colors"
                        disabled={isAdding}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <select
                            value={newFrequency}
                            onChange={(e) => setNewFrequency(e.target.value)}
                            className="bg-transparent text-xs text-white/40 focus:text-white focus:outline-none cursor-pointer hover:text-white/60 transition-colors appearance-none text-right pr-2"
                            disabled={isAdding}
                        >
                            {frequencyOptions.map((option) => (
                                <option key={option.value} value={option.value} className="bg-black text-white">
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <motion.button
                    onClick={handleAddHabit}
                    disabled={isAdding || !newHabitText.trim()}
                    className="bg-[#8e44ad] text-white p-3 rounded-xl hover:bg-[#9b59b6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    {isAdding ? (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                            <Plus size={18} />
                        </motion.div>
                    ) : (
                        <Plus size={18} />
                    )}
                </motion.button>
            </div>

            {/* Habits List */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                    {habits.map((habit) => {
                        const isRemoving = removingHabits.has(habit.id)
                        return (
                            <motion.div
                                key={habit.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className={`group flex items-center gap-3 p-3 rounded-xl border transition-all ${habit.completed
                                        ? "bg-[#8e44ad]/10 border-[#8e44ad]/20"
                                        : "bg-white/5 border-white/5 hover:border-white/10"
                                    }`}
                            >
                                <motion.button
                                    onClick={() => handleToggleHabit(habit.id)}
                                    className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors ${habit.completed
                                            ? "bg-[#8e44ad] border-[#8e44ad]"
                                            : "border-white/20 group-hover:border-white/40"
                                        }`}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    {habit.completed && <Check size={14} className="text-white" />}
                                </motion.button>

                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium truncate transition-colors ${habit.completed ? "text-white/40 line-through" : "text-white"
                                        }`}>
                                        {habit.text}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] uppercase tracking-wider text-white/30">
                                            {habit.frequency}
                                        </span>
                                    </div>
                                </div>

                                <motion.button
                                    onClick={() => handleRemoveHabit(habit.id)}
                                    className="text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-2"
                                    disabled={isRemoving}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <Trash2 size={14} />
                                </motion.button>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>

                {habits.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center h-40 text-white/20"
                    >
                        <Target size={32} className="mb-2 opacity-50" />
                        <p className="text-sm">No habits tracked yet</p>
                    </motion.div>
                )}
            </div>

            {/* Achievement Celebration */}
            <AnimatePresence>
                {habitStats.progress === 100 && habitStats.totalHabits > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute bottom-6 left-6 right-6 bg-[#f1c40f] text-black font-bold text-center py-3 rounded-xl shadow-lg text-sm"
                    >
                        🎉 All habits completed!
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

export default HabitTracker
