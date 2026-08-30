"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { AlertCircle, Activity, Footprints, CheckSquare, TrendingUp } from "lucide-react"
import { motion, useMotionValue, animate, AnimatePresence } from "framer-motion"
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
            className="p-5 bg-black/95 rounded-2xl border border-white/10 w-full relative overflow-hidden flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
        >
            <motion.div
                className="flex flex-col items-center justify-center mb-8 relative z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
            >
                <h2 className="text-[1.8rem] font-bold text-[#8e44ad] m-0 text-center drop-shadow-[0_0_5px_rgba(142,68,173,0.5)] tracking-[2px]">
                    PLAYER STATS
                </h2>
                {streak > 0 && (
                    <motion.div
                        className="flex items-center gap-2 mt-3 text-[#2ecc71] font-bold text-sm bg-[#2ecc71]/10 px-4 py-1.5 rounded-full border border-[#2ecc71]/30 shadow-[0_0_10px_rgba(46,204,113,0.2)]"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                    >
                        <TrendingUp size={14} className="drop-shadow-[0_0_5px_currentColor]" />
                        <span className="tracking-wide">{streak} day streak!</span>
                    </motion.div>
                )}
            </motion.div>

            <div className="flex flex-col gap-4 relative z-10">
                {progressItems.map((item, index) => {
                    const IconComponent = item.icon

                    return (
                        <motion.div
                            key={item.id}
                            className="group flex items-center gap-4 p-3.5 rounded-xl border border-white/10 bg-white/5 transition-all duration-200 relative overflow-hidden hover:border-white/20 hover:bg-white/10"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + index * 0.05, duration: 0.3 }}
                        >
                            <div
                                className="flex items-center justify-center w-12 h-12 rounded-xl bg-black/40 border border-white/10 shadow-inner transition-transform duration-200 group-hover:scale-105"
                                style={{ color: item.color, boxShadow: `inset 0 0 20px ${item.color}10` }}
                            >
                                <IconComponent size={22} className="drop-shadow-[0_0_8px_currentColor]" />
                            </div>

                            <div className="flex-1 flex flex-col gap-2">
                                <div className="flex justify-between items-end">
                                    <span className="text-xs text-white/60 font-medium uppercase tracking-wider group-hover:text-white/80 transition-colors">{item.label}</span>
                                    {item.isInput ? (
                                        <div className="flex items-center gap-1">
                                            <motion.input
                                                type="number"
                                                value={item.value}
                                                onChange={item.onChange}
                                                className="bg-transparent border-none text-right text-white font-bold text-lg w-24 focus:outline-none focus:text-[#f1c40f] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                min="0"
                                            />
                                            <span className="text-xs text-white/30 font-bold mb-1">/ {item.max}</span>
                                        </div>
                                    ) : (
                                        <span className="text-white font-bold text-lg drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">{item.value}</span>
                                    )}
                                </div>

                                <div className="h-2.5 w-full bg-black/60 rounded-full overflow-hidden relative border border-white/5 shadow-inner">
                                    <motion.div
                                        className="h-full rounded-full relative"
                                        style={{
                                            backgroundColor: item.color,
                                            width: `${item.progress}%`,
                                            boxShadow: `0 0 10px ${item.color}66`
                                        }}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${item.progress}%` }}
                                        transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.05 }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )
                })}
            </div>

            {/* Achievement notification */}
            <AnimatePresence>
                {progressStats.questProgress === 100 && totalQuests > 0 && (
                    <motion.div
                        className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#2ecc71] text-black font-bold px-6 py-2.5 rounded-full shadow-[0_0_20px_rgba(46,204,113,0.6)] flex items-center gap-2 whitespace-nowrap z-50 border border-white/20"
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                    >
                        <CheckSquare size={18} />
                        <span className="tracking-wide drop-shadow-md">All Quests Completed!</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
