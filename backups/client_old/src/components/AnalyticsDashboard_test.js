"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    BarChart3,
    Target,
    TrendingUp,
    Clock,
    Award,
    Activity,
    Zap,
    CheckCircle2,
    AlertCircle,
    ArrowUpRight,
} from "lucide-react"

// Custom animated chart component to avoid external dependencies
const CustomAreaChart = ({ data }) => {
    const maxVal = Math.max(...data)
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * 100
        const y = 100 - (val / maxVal) * 80 // Leave some headroom
        return `${x},${y}`
    })

    const pathD = `M0,100 L0,${100 - (data[0] / maxVal) * 80} ${points.map((p, i) => `L${p.split(",")[0]},${p.split(",")[1]}`).join(" ")} L100,100 Z`
    const lineD = `M0,${100 - (data[0] / maxVal) * 80} ${points.map((p, i) => `L${p.split(",")[0]},${p.split(",")[1]}`).join(" ")}`

    return (
        <div className="w-full h-48 relative overflow-hidden rounded-xl bg-white/5 border border-white/10 p-4">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8e44ad" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#8e44ad" stopOpacity="0" />
                    </linearGradient>
                </defs>
                {/* Area Fill */}
                <motion.path
                    d={pathD}
                    fill="url(#chartGradient)"
                    initial={{ opacity: 0, pathLength: 0 }}
                    animate={{ opacity: 1, pathLength: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                />
                {/* Line Stroke */}
                <motion.path
                    d={lineD}
                    fill="none"
                    stroke="#8e44ad"
                    strokeWidth="0.5"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                />
            </svg>
            {/* Data Points */}
            <div className="absolute inset-0 flex justify-between items-end px-2 pb-2 pointer-events-none">
                {data.map((val, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                        <motion.div
                            className="w-1 h-1 rounded-full bg-[#f1c40f]"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1 + i * 0.1 }}
                        />
                        <span className="text-[8px] text-white/40 font-mono">
                            {["M", "T", "W", "T", "F", "S", "S"][i]}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default function AnalyticsDashboard({
    data = {
        completedGoals: 47,
        totalGoalsCreated: 62,
        streaks: 12,
        focusTime: 340,
        dailyActivity: [8, 12, 6, 15, 9, 11, 14],
    },
    goals = [
        { id: "1", title: "Complete morning workout", completed: true, progress: 100 },
        { id: "2", title: "Review project documentation", completed: false, progress: 60 },
        { id: "3", title: "Team standup meeting", completed: false, progress: 0 },
    ],
    habits = [
        { id: "1", text: "Morning meditation", frequency: "daily", completed: true },
        { id: "2", text: "Read technical articles", frequency: "daily", completed: false },
    ],
}) {
    const [activeTab, setActiveTab] = useState("overview")

    const completionRate =
        data.totalGoalsCreated > 0 ? Math.round((data.completedGoals / data.totalGoalsCreated) * 100) : 0
    const activeGoals = goals.filter((g) => !g.completed).length
    const activeHabits = habits.length

    const formatTime = (minutes) => {
        if (minutes < 60) return `${minutes}m`
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return `${hours}h ${mins}m`
    }

    const tabs = [
        { id: "overview", label: "Overview", icon: BarChart3 },
        { id: "goals", label: "Objectives", icon: Target },
        { id: "habits", label: "Habits", icon: TrendingUp },
        { id: "focus", label: "Focus", icon: Clock },
    ]

    return (
        <motion.div
            className="p-6 bg-black/90 rounded-3xl border border-white/10 w-full relative overflow-hidden flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.5)] min-h-[500px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#8e44ad]/20 rounded-xl border border-[#8e44ad]/30">
                        <Activity className="text-[#8e44ad]" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-wider">ANALYTICS CENTER</h2>
                        <p className="text-xs text-white/40 font-medium tracking-widest uppercase">Performance Metrics</p>
                    </div>
                </div>
                <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative px-4 py-2 rounded-md text-sm font-bold transition-all duration-300 ${activeTab === tab.id ? "text-black" : "text-white/60 hover:text-white"
                                }`}
                        >
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-[#f1c40f] rounded-md shadow-[0_0_15px_rgba(241,196,15,0.4)]"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="relative z-10 flex items-center gap-2">
                                <tab.icon size={14} />
                                <span className="hidden sm:inline">{tab.label}</span>
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="flex-1"
                >
                    {activeTab === "overview" && (
                        <div className="space-y-6">
                            {/* Metrics Grid */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { label: "Completion Rate", value: `${completionRate}%`, icon: Award, color: "#f1c40f" },
                                    { label: "Active Streak", value: data.streaks, sub: "days", icon: Zap, color: "#e74c3c" },
                                    { label: "Active Goals", value: activeGoals, icon: Target, color: "#3498db" },
                                    { label: "Focus Time", value: formatTime(data.focusTime), icon: Clock, color: "#2ecc71" },
                                ].map((metric, i) => (
                                    <motion.div
                                        key={i}
                                        className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors group"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-white/40 text-xs font-bold uppercase tracking-wider">{metric.label}</span>
                                            <metric.icon size={16} style={{ color: metric.color }} className="opacity-70 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-bold text-white">{metric.value}</span>
                                            {metric.sub && <span className="text-xs text-white/40">{metric.sub}</span>}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Chart Section */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-white/80 flex items-center gap-2">
                                        <TrendingUp size={16} className="text-[#8e44ad]" />
                                        WEEKLY ACTIVITY
                                    </h3>
                                    <span className="text-xs text-[#2ecc71] flex items-center gap-1 bg-[#2ecc71]/10 px-2 py-1 rounded-full border border-[#2ecc71]/20">
                                        <ArrowUpRight size={12} /> +12% vs last week
                                    </span>
                                </div>
                                <CustomAreaChart data={data.dailyActivity} />
                            </div>
                        </div>
                    )}

                    {activeTab === "goals" && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="text-center p-3 bg-white/5 rounded-lg border border-white/10">
                                    <div className="text-2xl font-bold text-white">{data.totalGoalsCreated}</div>
                                    <div className="text-xs text-white/40 uppercase tracking-wider">Total</div>
                                </div>
                                <div className="text-center p-3 bg-white/5 rounded-lg border border-white/10">
                                    <div className="text-2xl font-bold text-[#2ecc71]">{data.completedGoals}</div>
                                    <div className="text-xs text-white/40 uppercase tracking-wider">Done</div>
                                </div>
                                <div className="text-center p-3 bg-white/5 rounded-lg border border-white/10">
                                    <div className="text-2xl font-bold text-[#f1c40f]">{activeGoals}</div>
                                    <div className="text-xs text-white/40 uppercase tracking-wider">Active</div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {goals.slice(0, 5).map((goal, i) => (
                                    <motion.div
                                        key={goal.id}
                                        className="flex items-center gap-4 p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${goal.completed ? "bg-[#2ecc71]" : "bg-[#f1c40f]"}`} />
                                        <div className="flex-1">
                                            <div className="flex justify-between mb-1">
                                                <span className={`text-sm font-medium ${goal.completed ? "text-white/40 line-through" : "text-white"}`}>
                                                    {goal.title}
                                                </span>
                                                <span className="text-xs text-white/40 font-mono">
                                                    {goal.completed ? "100%" : `${goal.progress}%`}
                                                </span>
                                            </div>
                                            <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                                                <motion.div
                                                    className={`h-full rounded-full ${goal.completed ? "bg-[#2ecc71]" : "bg-[#f1c40f]"}`}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${goal.progress}%` }}
                                                    transition={{ duration: 0.8, delay: 0.2 }}
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === "habits" && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#8e44ad]/20 to-transparent rounded-xl border border-[#8e44ad]/30 mb-6">
                                <div>
                                    <div className="text-sm text-white/60 font-medium">Current Streak</div>
                                    <div className="text-3xl font-bold text-white flex items-center gap-2">
                                        {data.streaks} <span className="text-sm font-normal text-white/40">days</span>
                                    </div>
                                </div>
                                <Zap size={32} className="text-[#f1c40f] drop-shadow-[0_0_10px_rgba(241,196,15,0.5)]" />
                            </div>

                            <div className="space-y-3">
                                {habits.map((habit, i) => (
                                    <motion.div
                                        key={habit.id}
                                        className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-colors"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${habit.completed ? "bg-[#2ecc71]/20 text-[#2ecc71]" : "bg-white/5 text-white/40"}`}>
                                                <CheckCircle2 size={18} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-white">{habit.text}</div>
                                                <div className="text-xs text-white/40 capitalize">{habit.frequency}</div>
                                            </div>
                                        </div>
                                        <div className={`w-2 h-2 rounded-full ${habit.completed ? "bg-[#2ecc71] shadow-[0_0_8px_#2ecc71]" : "bg-white/10"}`} />
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === "focus" && (
                        <div className="space-y-6">
                            <div className="text-center py-8 relative">
                                <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                                    <Clock size={120} />
                                </div>
                                <h3 className="text-white/40 text-sm font-bold uppercase tracking-widest mb-2">Total Focus Time</h3>
                                <div className="text-5xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                                    {formatTime(data.focusTime)}
                                </div>
                                <div className="text-[#2ecc71] text-sm font-medium mt-2">Top 10% of users this week</div>
                            </div>

                            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                                <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                    <AlertCircle size={16} className="text-[#f1c40f]" />
                                    OPTIMIZATION TIPS
                                </h4>
                                <ul className="space-y-3">
                                    {[
                                        "Take 5-minute breaks every 25 minutes",
                                        "Stay hydrated to maintain peak cognitive function",
                                        "Eliminate digital distractions during deep work",
                                        "Set clear micro-goals before starting a session"
                                    ].map((tip, i) => (
                                        <motion.li
                                            key={i}
                                            className="flex items-start gap-3 text-sm text-white/70"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.2 + i * 0.1 }}
                                        >
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#8e44ad] mt-1.5 shrink-0" />
                                            {tip}
                                        </motion.li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </motion.div>
    )
}
