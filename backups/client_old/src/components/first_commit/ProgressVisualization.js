"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { AlertCircle, Activity, Footprints, CheckSquare, TrendingUp } from "lucide-react"
import { motion, useMotionValue, animate, AnimatePresence } from "framer-motion"
import "./progress.css"
import { useQuests } from "./QuestContext"

const TOTAL_TIME = 2 * 60 * 60 // Total time in seconds (2 hours)
const CALORIE_GOAL = 500
const STEP_GOAL = 6000

// Custom hook for smooth progress animations
const useAnimatedProgress = (targetValue, duration = 1000) => {
  const motionValue = useMotionValue(0)
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const controls = animate(motionValue, targetValue, {
      duration: duration / 1000,
      ease: "easeOut",
      onUpdate: (value) => setDisplayValue(value),
    })

    return controls.stop
  }, [targetValue, duration, motionValue])

  return displayValue
}

// Custom hook for localStorage with error handling
const useLocalStorage = (key, defaultValue) => {
  const [value, setValue] = useState(() => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return defaultValue
    }
  })

  const setStoredValue = useCallback(
    (newValue) => {
      try {
        setValue(newValue)
        localStorage.setItem(key, JSON.stringify(newValue))
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error)
      }
    },
    [key],
  )

  return [value, setStoredValue]
}

export default function ProgressVisualization() {
  // Get quest data from context
  const { completedQuests, totalQuests, completionRate, streak } = useQuests()

  // Use custom localStorage hook
  const [progressData, setProgressData] = useLocalStorage("jotai_progress", {
    timeLeft: TOTAL_TIME,
    calories: 0,
    steps: 0,
    lastResetDate: new Date().toDateString(),
  })

  // Separate state for better performance
  const [timeLeft, setTimeLeft] = useState(progressData.timeLeft)
  const [calories, setCalories] = useState(progressData.calories)
  const [steps, setSteps] = useState(progressData.steps)

  // Memoized progress calculations
  const progressStats = useMemo(
    () => ({
      timeProgress: ((TOTAL_TIME - timeLeft) / TOTAL_TIME) * 100,
      calorieProgress: Math.min((calories / CALORIE_GOAL) * 100, 100),
      stepProgress: Math.min((steps / STEP_GOAL) * 100, 100),
      questProgress: completionRate,
    }),
    [timeLeft, calories, steps, completionRate],
  )

  // Animated progress values for smooth transitions
  const animatedTimeProgress = useAnimatedProgress(progressStats.timeProgress)
  const animatedCalorieProgress = useAnimatedProgress(progressStats.calorieProgress)
  const animatedStepProgress = useAnimatedProgress(progressStats.stepProgress)
  const animatedQuestProgress = useAnimatedProgress(progressStats.questProgress)

  // Function to reset progress with animation
  const resetProgress = useCallback(() => {
    const newData = {
      timeLeft: TOTAL_TIME,
      calories: 0,
      steps: 0,
      lastResetDate: new Date().toDateString(),
    }

    setProgressData(newData)
    setTimeLeft(TOTAL_TIME)
    setCalories(0)
    setSteps(0)
  }, [setProgressData])

  // Enhanced timer with better performance
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime > 0) {
          const newTime = prevTime - 1
          // Update localStorage less frequently for performance
          if (newTime % 60 === 0) {
            // Every minute
            setProgressData((prev) => ({ ...prev, timeLeft: newTime }))
          }
          return newTime
        }
        return 0
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [setProgressData])

  // Update localStorage when calories or steps change (debounced)
  useEffect(() => {
    const timeout = setTimeout(() => {
      setProgressData((prev) => ({ ...prev, calories, steps }))
    }, 500)

    return () => clearTimeout(timeout)
  }, [calories, steps, setProgressData])

  // Enhanced midnight reset check
  useEffect(() => {
    const checkMidnight = () => {
      const currentDate = new Date().toDateString()
      if (progressData.lastResetDate !== currentDate) {
        resetProgress()
      }
    }

    // Check immediately
    checkMidnight()

    // Check every minute
    const interval = setInterval(checkMidnight, 60000)
    return () => clearInterval(interval)
  }, [progressData.lastResetDate, resetProgress])

  // Input handlers with validation
  const handleCalorieChange = useCallback((e) => {
    const value = Math.max(0, Math.min(9999, Number(e.target.value) || 0))
    setCalories(value)
  }, [])

  const handleStepChange = useCallback((e) => {
    const value = Math.max(0, Math.min(99999, Number(e.target.value) || 0))
    setSteps(value)
  }, [])

  // Format time display
  const formatTime = useCallback((seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}:${minutes.toString().padStart(2, "0")}`
  }, [])

  const progressItems = useMemo(
    () => [
      {
        id: "time",
        icon: AlertCircle,
        progress: animatedTimeProgress,
        value: formatTime(TOTAL_TIME - timeLeft),
        max: "2:00",
        label: "Focus Time",
        color: "#e74c3c",
        isInput: false,
      },
      {
        id: "calories",
        icon: Activity,
        progress: animatedCalorieProgress,
        value: calories,
        max: CALORIE_GOAL,
        label: "Calories Burnt",
        color: "#f39c12",
        isInput: true,
        onChange: handleCalorieChange,
      },
      {
        id: "steps",
        icon: Footprints,
        progress: animatedStepProgress,
        value: steps,
        max: STEP_GOAL,
        label: "Steps",
        color: "#3498db",
        isInput: true,
        onChange: handleStepChange,
      },
      {
        id: "quests",
        icon: CheckSquare,
        progress: animatedQuestProgress,
        value: `${completedQuests}/${totalQuests}`,
        max: totalQuests,
        label: "Daily Quests",
        color: "#2ecc71",
        isInput: false,
      },
    ],
    [
      animatedTimeProgress,
      animatedCalorieProgress,
      animatedStepProgress,
      animatedQuestProgress,
      timeLeft,
      calories,
      steps,
      completedQuests,
      totalQuests,
      formatTime,
      handleCalorieChange,
      handleStepChange,
    ],
  )

  return (
    <motion.div
      className="progress-visualization skill-mastery-animated"
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <motion.div
        className="progress-header"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h2 style={{ color: "#8e44ad" }} className="progress-title cyberpunk-flicker">
          Player Progress
        </h2>
        {streak > 0 && (
          <motion.div
            className="streak-indicator"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: "spring" }}
          >
            <TrendingUp size={16} />
            <span>{streak} day streak!</span>
          </motion.div>
        )}
      </motion.div>

      <div className="progress-container">
        {progressItems.map((item, index) => {
          const IconComponent = item.icon

          return (
            <motion.div
              key={item.id}
              className="progress-item"
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.4, type: "spring" }}
              whileHover={{ scale: 1.02 }}
            >
              <IconComponent className="progress-icon" style={{ color: item.color }} />

              <div className="progress-track">
                <motion.div
                  className="progress-fill neon-pulse"
                  style={{
                    backgroundColor: item.color,
                    width: `${item.progress}%`,
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${item.progress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.1 }}
                />

                {/* Progress glow effect */}
                <motion.div
                  className="progress-glow"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${item.color}40, transparent)`,
                    width: "20px",
                    left: `${Math.max(0, item.progress - 10)}%`,
                  }}
                  animate={{
                    opacity: item.progress > 5 ? [0.5, 1, 0.5] : 0,
                  }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                />
              </div>

              <div className="progress-info">
                {item.isInput ? (
                  <motion.input
                    type="number"
                    value={item.value}
                    onChange={item.onChange}
                    className="progress-input"
                    min="0"
                    whileFocus={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  />
                ) : (
                  <span className="progress-text">{item.value}</span>
                )}
                <span className="progress-status">{item.label}</span>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Achievement notification */}
      <AnimatePresence>
        {progressStats.questProgress === 100 && totalQuests > 0 && (
          <motion.div
            className="achievement-notification"
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            🎉 All quests completed! Amazing work!
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
