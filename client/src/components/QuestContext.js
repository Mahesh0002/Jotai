"use client"

import { createContext, useState, useContext, useEffect, useCallback, useMemo } from "react"

// Create the context
const QuestContext = createContext(undefined)

// Optimized localStorage utilities
const createDebouncedSave = (key, delay = 1000) => {
  let timeoutId
  return (data) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(data))
      } catch (error) {
        console.error(`Error saving ${key}:`, error)
      }
    }, delay)
  }
}

const loadFromStorage = (key, defaultValue) => {
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : defaultValue
  } catch (error) {
    console.error(`Error loading ${key}:`, error)
    return defaultValue
  }
}

// Context provider component
export function QuestProvider({ children }) {
  // Optimized initial state loading
  const [goals, setGoals] = useState(() =>
    loadFromStorage("jotai_goals", [
      {
        id: 1,
        title: "Complete project documentation",
        description: "Finish the user guide sections",
        progress: 0,
        completed: false,
        createdAt: new Date().toISOString(),
        type: "goal",
      },
      {
        id: 2,
        title: "Review pull requests",
        description: "Check team's code submissions",
        progress: 0,
        completed: false,
        createdAt: new Date().toISOString(),
        type: "goal",
      },
      {
        id: 3,
        title: "Update dependencies",
        description: "Check for security patches",
        progress: 0,
        completed: false,
        createdAt: new Date().toISOString(),
        type: "goal",
      },
      {
        id: 4,
        title: "Daily team standup",
        description: "Morning meeting at 9:30 AM",
        progress: 100,
        completed: true,
        createdAt: new Date().toISOString(),
        type: "goal",
      },
    ]),
  )

  const [animating, setAnimating] = useState({})
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [lastCompletionTime, setLastCompletionTime] = useState(null)

  // Create debounced save function
  const debouncedSave = useMemo(() => createDebouncedSave("jotai_goals", 500), [])

  // Optimized save with debouncing
  useEffect(() => {
    debouncedSave(goals)
  }, [goals, debouncedSave])

  // Memoized calculations with better performance
  const stats = useMemo(() => {
    const totalQuests = goals.length
    const completedQuests = goals.filter((goal) => goal.completed).length
    const habitGoals = goals.filter((goal) => goal.type === "habit")
    const regularGoals = goals.filter((goal) => goal.type === "goal")
    const completionRate = totalQuests > 0 ? Math.round((completedQuests / totalQuests) * 100) : 0

    // Simple streak calculation
    const today = new Date().toDateString()
    const completedToday = goals.filter(
      (goal) => goal.completed && new Date(goal.updatedAt || goal.createdAt).toDateString() === today,
    ).length

    return {
      totalQuests,
      completedQuests,
      habitGoals,
      regularGoals,
      completionRate,
      streak: completedToday,
    }
  }, [goals])

  // Optimized level up notification
  useEffect(() => {
    if (stats.totalQuests > 0 && stats.completedQuests === stats.totalQuests) {
      if (lastCompletionTime && Date.now() - lastCompletionTime < 3000) {
        setShowLevelUp(true)
        const timer = setTimeout(() => setShowLevelUp(false), 3000)
        return () => clearTimeout(timer)
      }
    }
  }, [stats.completedQuests, stats.totalQuests, lastCompletionTime])

  // Optimized add goal
  const addGoal = useCallback((title, description = "", type = "goal") => {
    if (!title.trim()) return null

    const newGoal = {
      id: Date.now() + Math.random(),
      title: title.trim(),
      description: description.trim(),
      progress: 0,
      completed: false,
      type: type,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setGoals((prev) => [...prev, newGoal])
    return newGoal
  }, [])

  // Optimized toggle completion with batched updates
  const toggleComplete = useCallback((goalId) => {
    setLastCompletionTime(Date.now())

    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId
          ? {
              ...g,
              progress: g.completed ? 0 : 100,
              completed: !g.completed,
              updatedAt: new Date().toISOString(),
            }
          : g,
      ),
    )
  }, [])

  // Optimized edit goal
  const editGoal = useCallback((goalId, newTitle, newDescription) => {
    if (!newTitle?.trim()) return false

    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId
          ? {
              ...g,
              title: newTitle.trim(),
              description: newDescription?.trim() || g.description,
              updatedAt: new Date().toISOString(),
            }
          : g,
      ),
    )
    return true
  }, [])

  // Optimized delete goal
  const deleteGoal = useCallback((goalId) => {
    setGoals((prev) => prev.filter((g) => g.id !== goalId))
    setAnimating((a) => {
      const copy = { ...a }
      delete copy[goalId]
      return copy
    })
  }, [])

  // Batch operations for better performance
  const batchUpdateGoals = useCallback((updates) => {
    setGoals((prev) => {
      const goalMap = new Map(prev.map((goal) => [goal.id, goal]))

      updates.forEach(({ id, changes }) => {
        if (goalMap.has(id)) {
          goalMap.set(id, {
            ...goalMap.get(id),
            ...changes,
            updatedAt: new Date().toISOString(),
          })
        }
      })

      return Array.from(goalMap.values())
    })
  }, [])

  // Memoized context value
  const value = useMemo(
    () => ({
      goals,
      animating,
      showLevelUp,
      ...stats,
      addGoal,
      toggleComplete,
      editGoal,
      deleteGoal,
      batchUpdateGoals,
      setShowLevelUp,
    }),
    [goals, animating, showLevelUp, stats, addGoal, toggleComplete, editGoal, deleteGoal, batchUpdateGoals],
  )

  return <QuestContext.Provider value={value}>{children}</QuestContext.Provider>
}

// Custom hook to use the quest context
export function useQuests() {
  const context = useContext(QuestContext)
  if (context === undefined) {
    throw new Error("useQuests must be used within a QuestProvider")
  }
  return context
}
