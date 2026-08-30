"use client"

import { useState, useEffect, useCallback, useRef, memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import "./PomodoroTimer.css"

// Memoized timer display to prevent unnecessary re-renders
const TimerDisplay = memo(({ time, isBreak }) => {
  const formatTime = useCallback((time) => {
    const minutes = Math.floor(time / 60)
    const seconds = time % 60
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
  }, [])

  return (
    <AnimatePresence mode="wait">
      <motion.p
        className="timer-display neon-pulse"
        key={Math.floor(time / 10)} // Only re-render every 10 seconds for smoother performance
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        {formatTime(time)}
      </motion.p>
    </AnimatePresence>
  )
})

TimerDisplay.displayName = "TimerDisplay"

// Memoized progress bar to prevent unnecessary re-renders
const ProgressBar = memo(({ time, totalDuration, isBreak }) => {
  const progress = (time / totalDuration) * 100

  return (
    <div className="progress-bar-container">
      <motion.div
        className="progress-bar"
        style={{
          width: `${progress}%`,
          background: isBreak ? "#8e44ad" : "#f1c40f",
        }}
        transition={{ duration: 0.1, ease: "linear" }}
      />
    </div>
  )
})

ProgressBar.displayName = "ProgressBar"

// Memoized settings panel
const TimerSettings = memo(
  ({ pomodoroDuration, breakDuration, selectedSound, onPomodoroChange, onBreakChange, onSoundChange, isRunning }) => (
    <div className="timer-settings">
      <label>
        Pomodoro (min):
        <input
          type="number"
          value={pomodoroDuration / 60}
          onChange={onPomodoroChange}
          min="5"
          max="60"
          disabled={isRunning}
        />
      </label>
      <label>
        Break (min):
        <input
          type="number"
          value={breakDuration / 60}
          onChange={onBreakChange}
          min="1"
          max="30"
          disabled={isRunning}
        />
      </label>
      <label>
        Alert Sound:
        <select value={selectedSound} onChange={onSoundChange}>
          <option value="none">None</option>
          <option value="beep">Beep</option>
          <option value="chime">Chime</option>
          <option value="synth">Synth</option>
        </select>
      </label>
    </div>
  ),
)

TimerSettings.displayName = "TimerSettings"

const PomodoroTimer = () => {
  const [time, setTime] = useState(25 * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [pomodoroDuration, setPomodoroDuration] = useState(25 * 60)
  const [breakDuration, setBreakDuration] = useState(5 * 60)
  const [isBreak, setIsBreak] = useState(false)
  const [sessionCount, setSessionCount] = useState(0)
  const [selectedSound, setSelectedSound] = useState("none")

  // Use refs to prevent unnecessary re-renders
  const intervalRef = useRef(null)
  const audioRef = useRef(null)
  const lastUpdateRef = useRef(Date.now())

  // Optimized timer with requestAnimationFrame for smoother updates
  useEffect(() => {
    if (isRunning && time > 0) {
      const updateTimer = () => {
        const now = Date.now()
        const deltaTime = now - lastUpdateRef.current

        // Only update if at least 1000ms have passed (1 second)
        if (deltaTime >= 1000) {
          setTime((prevTime) => {
            const newTime = Math.max(0, prevTime - Math.floor(deltaTime / 1000))
            lastUpdateRef.current = now
            return newTime
          })
        }

        if (time > 0) {
          intervalRef.current = requestAnimationFrame(updateTimer)
        }
      }

      lastUpdateRef.current = Date.now()
      intervalRef.current = requestAnimationFrame(updateTimer)
    } else {
      if (intervalRef.current) {
        cancelAnimationFrame(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        cancelAnimationFrame(intervalRef.current)
      }
    }
  }, [isRunning, time])

  // Handle timer completion
  useEffect(() => {
    if (time === 0 && isRunning) {
      if (!isBreak) {
        setIsBreak(true)
        setTime(breakDuration)
        setSessionCount((prev) => prev + 1)
      } else {
        setIsBreak(false)
        setTime(pomodoroDuration)
      }
      playAlertSound()
      setIsRunning(false) // Auto-pause after completion
    }
  }, [time, isRunning, isBreak, pomodoroDuration, breakDuration])

  // Memoized event handlers
  const toggleTimer = useCallback(() => {
    setIsRunning((prev) => !prev)
  }, [])

  const resetTimer = useCallback(() => {
    setIsRunning(false)
    setTime(pomodoroDuration)
    setIsBreak(false)
    if (intervalRef.current) {
      cancelAnimationFrame(intervalRef.current)
      intervalRef.current = null
    }
  }, [pomodoroDuration])

  const handlePomodoroChange = useCallback(
    (e) => {
      const newDuration = e.target.value * 60
      setPomodoroDuration(newDuration)
      if (!isRunning && !isBreak) setTime(newDuration)
    },
    [isRunning, isBreak],
  )

  const handleBreakChange = useCallback((e) => {
    setBreakDuration(e.target.value * 60)
  }, [])

  const handleSoundChange = useCallback((e) => {
    setSelectedSound(e.target.value)
  }, [])

  const playAlertSound = useCallback(() => {
    if (selectedSound !== "none") {
      // Use Web Audio API for better performance
      if (!audioRef.current) {
        audioRef.current = new Audio(`/sounds/${selectedSound}.mp3`)
        audioRef.current.preload = "auto"
      }

      // Reset and play
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(console.error)
    }
  }, [selectedSound])

  // Preload audio when sound changes
  useEffect(() => {
    if (selectedSound !== "none") {
      audioRef.current = new Audio(`/sounds/${selectedSound}.mp3`)
      audioRef.current.preload = "auto"
    }
  }, [selectedSound])

  // Animation variants
  const timerVariants = {
    initial: { opacity: 0, scale: 0.95, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: -20 },
  }

  const currentDuration = isBreak ? breakDuration : pomodoroDuration

  return (
    <motion.div
      className="pomodoro-timer skill-mastery-animated"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={timerVariants}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <motion.h3
        className={`cyberpunk-flicker ${isBreak ? "break-title" : "focus-title"}`}
        key={isBreak ? "break" : "focus"}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        {isBreak ? "Break Time" : "Focus Mode"}
      </motion.h3>

      <TimerDisplay time={time} isBreak={isBreak} />

      <ProgressBar time={time} totalDuration={currentDuration} isBreak={isBreak} />

      <TimerSettings
        pomodoroDuration={pomodoroDuration}
        breakDuration={breakDuration}
        selectedSound={selectedSound}
        onPomodoroChange={handlePomodoroChange}
        onBreakChange={handleBreakChange}
        onSoundChange={handleSoundChange}
        isRunning={isRunning}
      />

      <motion.p
        className="session-count"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        Sessions Completed: {sessionCount}
      </motion.p>

      <div className="button-container">
        <motion.button
          onClick={toggleTimer}
          className={`action-btn animated-btn ${isRunning ? "pause" : "play"}`}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          {isRunning ? "Pause" : "Start"}
        </motion.button>
        <motion.button
          onClick={resetTimer}
          className="reset-btn animated-btn"
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          Reset
        </motion.button>
      </div>
    </motion.div>
  )
}

export default memo(PomodoroTimer)
