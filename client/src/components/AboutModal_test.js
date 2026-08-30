"use client"

import { motion, AnimatePresence } from "framer-motion"

export default function AboutModal({ isOpen, onClose }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[2000] flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-[#0a0a0a] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto custom-scrollbar shadow-2xl relative"
                    >
                        {/* Content Container */}
                        <div className="p-8 md:p-10 space-y-8 text-white/90 font-sans leading-relaxed">

                            {/* Header */}
                            <div className="border-b border-white/10 pb-6">
                                <h2 className="text-2xl md:text-3xl font-bold tracking-wide text-white mb-2">
                                    Jōtai (状態)
                                </h2>
                                <p className="text-[#8e44ad] font-medium tracking-wider uppercase text-sm">
                                    Cyberpunk Productivity Dashboard
                                </p>
                            </div>

                            {/* Intro */}
                            <p className="text-white/70">
                                Jōtai is a personal development project built to explore the capabilities of React 19 and Tailwind CSS. Designed as a futuristic "Cyberpunk" command center, this application serves as a comprehensive playground for testing advanced frontend concepts and real-time API integrations.
                            </p>

                            {/* Motivation */}
                            <section>
                                <h3 className="text-lg font-bold text-white mb-3 uppercase tracking-wide border-l-2 border-[#f1c40f] pl-3">
                                    Motivation
                                </h3>
                                <p className="text-white/70 mb-4">
                                    This project was created as a challenge to bridge the gap between design and functionality. The primary goal was to move beyond basic tutorials and build a complex, responsive application that integrates:
                                </p>
                                <ul className="list-disc list-inside space-y-2 text-white/70 ml-2 marker:text-[#f1c40f]">
                                    <li><span className="text-white font-medium">Modern UI/UX:</span> Mastering utility-first styling with Tailwind and advanced aesthetics.</li>
                                    <li><span className="text-white font-medium">AI Integration:</span> Learning to handle LLM responses (Google Gemini 2.0) and Voice APIs (Deepgram) within a React environment.</li>
                                    <li><span className="text-white font-medium">State Management:</span> Testing React Context API for global state across multiple widgets.</li>
                                </ul>
                            </section>

                            {/* Key Features */}
                            <section>
                                <h3 className="text-lg font-bold text-white mb-3 uppercase tracking-wide border-l-2 border-[#8e44ad] pl-3">
                                    Key Features
                                </h3>
                                <ul className="space-y-4 text-white/70">
                                    <li>
                                        <strong className="block text-white mb-1">AI Smart Assistant</strong>
                                        A voice-activated system operator powered by Google Gemini 2.0 Flash and Deepgram, capable of executing function calls to control the app.
                                    </li>
                                    <li>
                                        <strong className="block text-white mb-1">Gamified Productivity</strong>
                                        Includes an XP-based task manager, habit tracker with streaks, and a visual Pomodoro timer.
                                    </li>
                                    <li>
                                        <strong className="block text-white mb-1">Live Dashboard</strong>
                                        Real-time data fetching for weather, stock market trends, and tech news.
                                    </li>
                                    <li>
                                        <strong className="block text-white mb-1">Immersive Design</strong>
                                        A fully responsive, dark-mode interface featuring neon accents and smooth Framer Motion transitions.
                                    </li>
                                </ul>
                            </section>

                            {/* Tech Stack */}
                            <section>
                                <h3 className="text-lg font-bold text-white mb-3 uppercase tracking-wide border-l-2 border-[#2ecc71] pl-3">
                                    Tech Stack
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white/70">
                                    <div>
                                        <span className="block text-white font-medium mb-1">Frontend</span>
                                        React 19, Tailwind CSS, Framer Motion, Lucide React
                                    </div>
                                    <div>
                                        <span className="block text-white font-medium mb-1">AI & Data</span>
                                        Google Gemini API, Deepgram SDK, WeatherAPI, NewsAPI
                                    </div>
                                </div>
                            </section>

                            {/* Close Button */}
                            <div className="pt-6 border-t border-white/10 flex justify-end">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg transition-colors text-sm font-bold uppercase tracking-wider"
                                >
                                    Close System Info
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
