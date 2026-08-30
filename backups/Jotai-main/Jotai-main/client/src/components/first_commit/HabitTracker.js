"use client"

import { useState, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, Target, TrendingUp, Calendar } from "lucide-react"
import "./SkillMastery.css"

// Enhanced HabitTracker with better animations and performance
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

    // Calculate streaks and frequency stats
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

  // Enhanced add habit with validation and animation
  const handleAddHabit = useCallback(async () => {
    if (!newHabitText.trim()) return

    setIsAdding(true)

    try {
      await addHabit(newHabitText.trim(), newFrequency)
      setNewHabitText("")
      setNewFrequency("daily")

      // Success animation
      setTimeout(() => setIsAdding(false), 500)
    } catch (error) {
      console.error("Error adding habit:", error)
      setIsAdding(false)
    }
  }, [newHabitText, newFrequency, addHabit])

  // Enhanced remove habit with smooth animation
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
    [removeHabit],
  )

  // Enhanced toggle with haptic feedback simulation
  const handleToggleHabit = useCallback(
    (habitId) => {
      // Add a small vibration effect if supported
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
      toggleHabitCompletion(habitId)
    },
    [toggleHabitCompletion],
  )

  // Keyboard handlers
  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter" && !isAdding) {
        handleAddHabit()
      }
    },
    [handleAddHabit, isAdding],
  )

  // Frequency options with icons
  const frequencyOptions = useMemo(
    () => [
      { value: "daily", label: "Daily", icon: "📅" },
      { value: "weekly", label: "Weekly", icon: "📊" },
      { value: "monthly", label: "Monthly", icon: "🗓️" },
    ],
    [],
  )

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      scale: 0.95,
      transition: {
        duration: 0.3,
      },
    },
  }

  return (
    <motion.div
      className="skill-mastery skill-mastery-animated"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="habit-card">
        {/* Enhanced Header */}
        <motion.div
          className="habit-header"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="cyberpunk-flicker">
            <Target className="header-icon" />
            Skill Mastery
          </h3>

          {/* Stats Display */}
          <div className="habit-stats">
            <div className="stat-item">
              <TrendingUp size={14} />
              <span>{habitStats.progress.toFixed(0)}% Complete</span>
            </div>
            <div className="stat-item">
              <Calendar size={14} />
              <span>
                {habitStats.dailyHabits}D • {habitStats.weeklyHabits}W • {habitStats.monthlyHabits}M
              </span>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Input Section */}
        <motion.div
          className="habit-input-section"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="input-group">
            <motion.input
              type="text"
              value={newHabitText}
              onChange={(e) => setNewHabitText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add a new habit..."
              className="habit-input"
              disabled={isAdding}
              whileFocus={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            />

            <div className="frequency-selector">
              <select
                value={newFrequency}
                onChange={(e) => setNewFrequency(e.target.value)}
                className="frequency-select"
                disabled={isAdding}
              >
                {frequencyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.icon} {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <motion.button
            className={`animated-btn ${isAdding ? "loading" : ""}`}
            onClick={handleAddHabit}
            disabled={isAdding || !newHabitText.trim()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            {isAdding ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              >
                <Plus size={16} />
              </motion.div>
            ) : (
              <>
                <Plus size={16} />
                Add Habit
              </>
            )}
          </motion.button>
        </motion.div>

        {/* Enhanced Progress Bar */}
        <motion.div
          className="progress-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="progress-container">
            <motion.div
              className="progress-bar"
              initial={{ width: 0 }}
              animate={{ width: `${habitStats.progress}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
            />
            <motion.div
              className="progress-glow"
              animate={{
                opacity: habitStats.progress > 0 ? [0.5, 1, 0.5] : 0,
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
              style={{ width: `${Math.max(habitStats.progress - 10, 0)}%` }}
            />
          </div>

          <motion.p
            className="progress-text"
            key={`${habitStats.completedHabits}-${habitStats.totalHabits}`}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {habitStats.completedHabits} / {habitStats.totalHabits} Habits Completed
          </motion.p>
        </motion.div>

        {/* Enhanced Habits List */}
        <motion.ul className="habits-list" variants={containerVariants} initial="hidden" animate="visible">
          <AnimatePresence mode="popLayout">
            {habits.map((habit) => {
              const isRemoving = removingHabits.has(habit.id)

              return (
                <motion.li
                  key={habit.id}
                  variants={itemVariants}
                  layout
                  className={`habit-item ${habit.completed ? "completed" : ""} ${isRemoving ? "removing" : ""}`}
                  whileHover={{ scale: 1.02, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div
                    className="habit-content"
                    onClick={() => handleToggleHabit(habit.id)}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="habit-checkbox">
                      <motion.div
                        className={`checkbox ${habit.completed ? "checked" : ""}`}
                        animate={{
                          scale: habit.completed ? [1, 1.2, 1] : 1,
                          backgroundColor: habit.completed ? "#2ecc71" : "transparent",
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        {habit.completed && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="checkmark"
                          >
                            ✓
                          </motion.div>
                        )}
                      </motion.div>
                    </div>

                    <div className="habit-details">
                      <span className={`habit-text ${habit.completed ? "completed" : ""}`}>{habit.text}</span>
                      <span className="habit-frequency">
                        {frequencyOptions.find((opt) => opt.value === habit.frequency)?.icon} {habit.frequency}
                      </span>
                    </div>
                  </motion.div>

                  <motion.button
                    onClick={() => handleRemoveHabit(habit.id)}
                    className="remove-btn"
                    disabled={isRemoving}
                    whileHover={{ scale: 1.1, color: "#e74c3c" }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <Trash2 size={16} />
                  </motion.button>
                </motion.li>
              )
            })}
          </AnimatePresence>

          {habits.length === 0 && (
            <motion.li
              className="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="empty-content">
                <Target size={32} className="empty-icon" />
                <p>No habits yet. Add your first habit to get started!</p>
              </div>
            </motion.li>
          )}
        </motion.ul>

        {/* Achievement Celebration */}
        <AnimatePresence>
          {habitStats.progress === 100 && habitStats.totalHabits > 0 && (
            <motion.div
              className="achievement-celebration"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              🎉 All habits completed! You're on fire! 🔥
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default HabitTracker
