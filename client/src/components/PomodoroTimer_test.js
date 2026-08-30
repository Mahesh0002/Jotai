"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Pause, RotateCcw, Settings, Volume2 } from "lucide-react"

// Circular Progress Component
const CircularProgress = ({ time, totalDuration, isBreak, isRunning }) => {
    const radius = 120
    const circumference = 2 * Math.PI * radius
    const progress = (time / totalDuration) * circumference
    const strokeDashoffset = circumference - progress

    const formatTime = (time) => {
        const minutes = Math.floor(time / 60)
        const seconds = time % 60
        return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    }

    return (
        <div className="relative flex items-center justify-center w-64 h-64 mx-auto mb-8">
            {/* Background Circle */}
            <svg className="absolute w-full h-full transform -rotate-90 drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                <circle
                    cx="128"
                    cy="128"
                    r={radius}
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="8"
                    fill="transparent"
                />
                {/* Progress Circle */}
                <motion.circle
                    cx="128"
                    cy="128"
                    r={radius}
                    stroke={isBreak ? "#8e44ad" : "#f1c40f"}
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={circumference}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1, ease: "linear" }}
                    strokeLinecap="round"
                    className="drop-shadow-[0_0_3px_currentColor]"
                />
            </svg>

            {/* Time Display */}
            <div className="relative z-10 flex flex-col items-center">
                <motion.div
                    key={time}
                    initial={{ scale: 0.95, opacity: 0.5 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-6xl font-black text-white tracking-tighter tabular-nums"
                >
                    {formatTime(time)}
                </motion.div>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`text-sm font-bold uppercase tracking-[3px] mt-2 ${isBreak ? "text-[#8e44ad]" : "text-[#f1c40f]"
                        }`}
                >
                    {isBreak ? "Rest Time" : "Focus Mode"}
                </motion.div>
            </div>
        </div>
    )
}

export default function PomodoroTimer() {
    const [time, setTime] = useState(25 * 60)
    const [isRunning, setIsRunning] = useState(false)
    const [pomodoroDuration, setPomodoroDuration] = useState(25 * 60)
    const [breakDuration, setBreakDuration] = useState(5 * 60)
    const [isBreak, setIsBreak] = useState(false)
    const [sessionCount, setSessionCount] = useState(0)
    const [showSettings, setShowSettings] = useState(false)
    const [selectedSound, setSelectedSound] = useState("none")

    const intervalRef = useRef(null)
    const audioRef = useRef(null)
    const lastUpdateRef = useRef(Date.now())

    const playAlertSound = useCallback(() => {
        if (selectedSound !== "none") {
            if (!audioRef.current) {
                audioRef.current = new Audio(`/sounds/${selectedSound}.mp3`)
                audioRef.current.preload = "auto"
            }
            audioRef.current.currentTime = 0
            audioRef.current.play().catch(console.error)
        }
    }, [selectedSound])

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

    useEffect(() => {
        if (isRunning && time > 0) {
            const updateTimer = () => {
                const now = Date.now()
                const deltaTime = now - lastUpdateRef.current

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
            setIsRunning(false)
        }
    }, [time, isRunning, isBreak, pomodoroDuration, breakDuration, playAlertSound])

    useEffect(() => {
        const handleAssistantStart = (event) => {
            const { duration } = event.detail
            const durationInSeconds = duration * 60
            setPomodoroDuration(durationInSeconds)
            setTime(durationInSeconds)
            setIsBreak(false)
            setIsRunning(true)
        }

        document.addEventListener("startPomodoroFromAssistant", handleAssistantStart)

        return () => {
            document.removeEventListener("startPomodoroFromAssistant", handleAssistantStart)
        }
    }, [])

    const currentDuration = isBreak ? breakDuration : pomodoroDuration

    return (
        <motion.div
            className="p-6 bg-black/90 rounded-3xl border border-white/10 w-full relative overflow-hidden flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.5)] min-h-[500px]"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6 relative z-20">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#f1c40f] animate-pulse" />
                    <h3 className="text-sm font-bold text-white/60 tracking-[2px] uppercase">
                        SESSION #{sessionCount + 1}
                    </h3>
                </div>
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className={`p-2 rounded-full transition-all ${showSettings ? "bg-white/20 text-white" : "text-white/40 hover:text-white hover:bg-white/10"
                        }`}
                >
                    <Settings size={20} />
                </button>
            </div>

            {/* Main Timer Area */}
            <div className="flex-1 flex flex-col items-center justify-center relative">
                <CircularProgress
                    time={time}
                    totalDuration={currentDuration}
                    isBreak={isBreak}
                    isRunning={isRunning}
                />

                {/* Controls */}
                <div className="flex items-center gap-6 mb-8">
                    <motion.button
                        onClick={resetTimer}
                        className="p-4 rounded-full bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <RotateCcw size={20} />
                    </motion.button>

                    <motion.button
                        onClick={toggleTimer}
                        className={`p-6 rounded-full shadow-lg flex items-center justify-center transition-all ${isRunning
                            ? "bg-[#e74c3c] text-white shadow-[0_0_20px_rgba(231,76,60,0.4)]"
                            : "bg-[#f1c40f] text-black shadow-[0_0_20px_rgba(241,196,15,0.4)]"
                            }`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        {isRunning ? (
                            <Pause size={32} fill="currentColor" />
                        ) : (
                            <Play size={32} fill="currentColor" className="ml-1" />
                        )}
                    </motion.button>

                    <div className="w-[52px]" /> {/* Spacer for symmetry */}
                </div>
            </div>

            {/* Settings Panel Overlay */}
            <AnimatePresence>
                {showSettings && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute inset-x-4 bottom-4 bg-[#1a1a1a] rounded-2xl p-4 border border-white/10 shadow-2xl z-30"
                    >
                        <div className="flex items-center gap-2 mb-4 text-white/60 text-xs font-bold uppercase tracking-wider">
                            <Settings size={14} /> Timer Configuration
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-white">Focus Duration</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={pomodoroDuration / 60}
                                        onChange={(e) => {
                                            const val = Number(e.target.value) * 60
                                            setPomodoroDuration(val)
                                            if (!isRunning && !isBreak) setTime(val)
                                        }}
                                        className="w-16 bg-white/5 border border-white/10 rounded-lg p-2 text-center text-white font-mono focus:outline-none focus:border-[#f1c40f]"
                                    />
                                    <span className="text-xs text-white/40">min</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-white">Break Duration</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={breakDuration / 60}
                                        onChange={(e) => setBreakDuration(Number(e.target.value) * 60)}
                                        className="w-16 bg-white/5 border border-white/10 rounded-lg p-2 text-center text-white font-mono focus:outline-none focus:border-[#8e44ad]"
                                    />
                                    <span className="text-xs text-white/40">min</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-white flex items-center gap-2">
                                    <Volume2 size={14} /> Alert Sound
                                </label>
                                <select
                                    value={selectedSound}
                                    onChange={(e) => setSelectedSound(e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-[#f1c40f]"
                                >
                                    <option value="none" className="bg-black">None</option>
                                    <option value="beep" className="bg-black">Beep</option>
                                    <option value="chime" className="bg-black">Chime</option>
                                    <option value="synth" className="bg-black">Synth</option>
                                </select>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
