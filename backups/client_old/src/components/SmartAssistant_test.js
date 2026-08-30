"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mic, Send, X, Sparkles, Bot, User, Volume2, VolumeX, Trash2 } from "lucide-react"
import confetti from "canvas-confetti"
import { useQuests } from "../components/QuestContext"

// --- Deepgram Hook (Preserved) ---
const DeepgramSTT_TTS = () => {
    const [isListening, setIsListening] = useState(false)
    const [transcription, setTranscription] = useState("")
    const [audioUrl, setAudioUrl] = useState(null)
    const mediaRecorderRef = useRef(null)
    const socketRef = useRef(null)
    const audioRef = useRef(null)

    const DEEPGRAM_API_KEY = process.env.REACT_APP_DEEPGRAM_API_KEY

    useEffect(() => {
        return () => {
            if (socketRef.current) socketRef.current.close()
            if (mediaRecorderRef.current) mediaRecorderRef.current.stop()
        }
    }, [])

    const startListening = useCallback(async () => {
        setIsListening(true)
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: "audio/webm" })

            socketRef.current = new WebSocket("wss://api.deepgram.com/v1/listen", [
                "token",
                DEEPGRAM_API_KEY,
            ])

            socketRef.current.onopen = () => {
                mediaRecorderRef.current.addEventListener("dataavailable", (event) => {
                    if (event.data.size > 0 && socketRef.current.readyState === 1) {
                        socketRef.current.send(event.data)
                    }
                })
                mediaRecorderRef.current.start(250)
            }

            socketRef.current.onmessage = (message) => {
                const received = JSON.parse(message.data)
                const transcript = received.channel.alternatives[0].transcript
                if (transcript && received.is_final) {
                    setTranscription(transcript)
                }
            }
        } catch (error) {
            console.error("Error accessing microphone:", error)
            setIsListening(false)
        }
    }, [DEEPGRAM_API_KEY])

    const stopListening = useCallback(() => {
        setIsListening(false)
        if (mediaRecorderRef.current) mediaRecorderRef.current.stop()
        if (socketRef.current) socketRef.current.close()
    }, [])

    const playAudio = useCallback(async (text) => {
        try {
            if (!DEEPGRAM_API_KEY) {
                console.warn("Deepgram API key is missing")
                return
            }
            const response = await fetch("https://api.deepgram.com/v1/speak?model=aura-asteria-en", {
                method: "POST",
                headers: {
                    Authorization: `Token ${DEEPGRAM_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ text }),
            })

            if (!response.ok) {
                console.error("Deepgram TTS error:", response.status, await response.text())
                return
            }

            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            setAudioUrl(url)
            if (audioRef.current) {
                audioRef.current.src = url
                audioRef.current.play().catch((e) => console.error("Audio play error:", e))
            }
        } catch (error) {
            console.error("Error generating audio:", error)
        }
    }, [DEEPGRAM_API_KEY])

    return { isListening, startListening, stopListening, transcription, playAudio, audioRef }
}

// --- Chat Hook (Preserved) ---
const useChat = () => {
    const [messages, setMessages] = useState([])
    const [userInfo, setUserInfo] = useState({ name: "User" })

    const displayTypingEffect = useCallback(async (text, sender = "ai") => {
        const newMessage = { sender, text: "", id: Date.now() }
        setMessages((prev) => [...prev, newMessage])

        for (let i = 0; i <= text.length; i++) {
            setMessages((prev) =>
                prev.map((msg) => (msg.id === newMessage.id ? { ...msg, text: text.slice(0, i) } : msg))
            )
            await new Promise((resolve) => setTimeout(resolve, 30))
        }
    }, [])

    const addUserMessage = useCallback((text) => {
        setMessages((prev) => [...prev, { sender: "user", text, id: Date.now() }])
    }, [])

    const clearMessages = useCallback(() => {
        setMessages([])
    }, [])

    return { messages, displayTypingEffect, addUserMessage, userInfo, setUserInfo, clearMessages }
}

// --- Main Component ---
export default function SmartAssistant_test({
    onClose,
    onAddHabit,
    onAddNote,
    onRemoveNote,
    onStartPomodoro,
    goals = [],
    habits = [],
    notes = [],
}) {
    const [isOpen, setIsOpen] = useState(false)
    const [input, setInput] = useState("")
    const [isMuted, setIsMuted] = useState(false)
    const messagesEndRef = useRef(null)
    const chatContainerRef = useRef(null)

    const { messages, displayTypingEffect, addUserMessage, userInfo, clearMessages } = useChat()
    const { addGoal, toggleComplete, deleteGoal, editGoal } = useQuests()
    const { startListening, stopListening, transcription, playAudio, audioRef, isListening } = DeepgramSTT_TTS()

    const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`

    // Sync transcription to input
    useEffect(() => {
        if (transcription) {
            setInput(transcription)
        }
    }, [transcription])

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    const handleMicClick = () => {
        if (isListening) {
            stopListening()
        } else {
            startListening()
        }
    }

    const triggerConfetti = useCallback(() => {
        const duration = 3000
        const animationEnd = Date.now() + duration
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

        function randomInRange(min, max) {
            return Math.random() * (max - min) + min
        }

        const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now()

            if (timeLeft <= 0) {
                return clearInterval(interval)
            }

            const particleCount = 50 * (timeLeft / duration)

            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
                colors: ["#f1c40f", "#ffffff", "#2ecc71"],
            })
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
                colors: ["#f1c40f", "#ffffff", "#2ecc71"],
            })
        }, 250)

        if (!isMuted) {
            try {
                const audio = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3")
                audio.volume = 0.5
                audio.play().catch((e) => console.log("Audio play error:", e))
            } catch (error) {
                console.error("Error playing sound:", error)
            }
        }
    }, [isMuted])

    const callGeminiFunction = useCallback(
        async (userText) => {
            if (!GEMINI_API_KEY) {
                await displayTypingEffect("⚠️ API key is missing. I can't perform smart actions.")
                return
            }

            const tools = [
                {
                    name: "add_goal",
                    description: "Add a new goal to the user's list.",
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            title: { type: "STRING", description: "The title of the goal." },
                        },
                        required: ["title"],
                    },
                },
                {
                    name: "delete_goal",
                    description: "Delete a goal by its ID. Use the provided list of goals to find the correct ID.",
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            goal_id: { type: "NUMBER", description: "The ID of the goal to delete." },
                        },
                        required: ["goal_id"],
                    },
                },
                {
                    name: "edit_goal",
                    description: "Edit an existing goal's title.",
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            goal_id: { type: "NUMBER", description: "The ID of the goal to edit." },
                            new_title: { type: "STRING", description: "The new title for the goal." },
                        },
                        required: ["goal_id", "new_title"],
                    },
                },
                {
                    name: "complete_goal",
                    description: "Mark a goal as completed.",
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            goal_id: { type: "NUMBER", description: "The ID of the goal to complete." },
                        },
                        required: ["goal_id"],
                    },
                },
                {
                    name: "add_habit",
                    description: "Add a new habit to track.",
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            title: { type: "STRING", description: "The title of the habit." },
                            frequency: {
                                type: "STRING",
                                description: "Frequency (daily, weekly, monthly). Default to daily.",
                            },
                        },
                        required: ["title"],
                    },
                },
                {
                    name: "add_note",
                    description: "Add a quick note or reminder.",
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            content: { type: "STRING", description: "The content of the note." },
                        },
                        required: ["content"],
                    },
                },
                {
                    name: "delete_note",
                    description: "Delete a note by its ID. Use the provided list of notes to find the correct ID.",
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            note_id: { type: "NUMBER", description: "The ID of the note to delete." },
                        },
                        required: ["note_id"],
                    },
                },
                {
                    name: "start_pomodoro",
                    description: "Start a Pomodoro timer.",
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            duration: { type: "NUMBER", description: "Duration in minutes. Default to 25." },
                        },
                        required: ["duration"],
                    },
                },
            ]

            const systemPrompt = `
      You are Jōtai's Smart Assistant. Your job is to help the user manage their productivity.
      
      Current Context:
      - User Name: ${userInfo.name || "User"}
      - Current Goals: ${JSON.stringify(goals.map((g) => ({ id: g.id, title: g.title, completed: g.completed })))}
      - Current Habits: ${JSON.stringify(habits.map((h) => ({ id: h.id, text: h.text })))}
      - Current Notes: ${JSON.stringify(notes.map((n) => ({ id: n.id, content: n.text })))}
      
      Instructions:
      1. Analyze the user's request.
      2. If the user wants to perform an action (add/delete/edit/complete goals, habits, notes, timer), CALL THE APPROPRIATE TOOL.
      3. If the user refers to a goal or note by name (e.g., "delete the milk goal"), find the matching ID from the lists. Be smart about fuzzy matching.
      4. If the user just wants to chat, reply normally without calling a tool.
      5. BE CONCISE.
    `

            try {
                const response = await fetch(GEMINI_API_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: systemPrompt }, { text: userText }] }],
                        tools: [{ function_declarations: tools }],
                    }),
                })

                const data = await response.json()
                const candidate = data.candidates?.[0]
                const content = candidate?.content
                const parts = content?.parts || []

                // Check for function calls
                const functionCall = parts.find((part) => part.functionCall)

                if (functionCall) {
                    const { name, args } = functionCall.functionCall
                    console.log("🤖 AI Function Call:", name, args)

                    let responseText = ""

                    switch (name) {
                        case "add_goal":
                            addGoal(args.title)
                            responseText = `I've added "${args.title}" to your goals.`
                            break
                        case "delete_goal":
                            deleteGoal(args.goal_id)
                            responseText = "Goal deleted."
                            break
                        case "edit_goal":
                            editGoal(args.goal_id, args.new_title)
                            responseText = `Goal updated to "${args.new_title}".`
                            break
                        case "complete_goal":
                            toggleComplete(args.goal_id)
                            triggerConfetti()
                            responseText = "Goal completed! Great job! 🎉"
                            break
                        case "add_habit":
                            onAddHabit(args.title, args.frequency || "daily")
                            responseText = `Added habit: ${args.title}`
                            break
                        case "add_note":
                            onAddNote(args.content)
                            responseText = "Note saved."
                            break
                        case "delete_note":
                            onRemoveNote(args.note_id)
                            responseText = "Note deleted."
                            break
                        case "start_pomodoro":
                            onStartPomodoro(args.duration || 25)
                            responseText = `Starting a ${args.duration || 25}-minute timer.`
                            break
                        default:
                            responseText = "I'm not sure how to do that yet."
                    }

                    await displayTypingEffect(responseText)
                    if (!isMuted) playAudio(responseText)
                } else {
                    // Normal chat response
                    const textResponse = parts.map((p) => p.text).join(" ") || "I didn't understand that."
                    await displayTypingEffect(textResponse)
                    if (!isMuted) playAudio(textResponse)
                }
            } catch (error) {
                console.error("Error calling Gemini:", error)
                await displayTypingEffect("⚠️ My brain is fuzzy right now. Please try again.")
            }
        },
        [
            userInfo.name,
            goals,
            habits,
            notes,
            addGoal,
            deleteGoal,
            editGoal,
            toggleComplete,
            triggerConfetti,
            onAddHabit,
            onAddNote,
            onRemoveNote,
            onStartPomodoro,
            displayTypingEffect,
            playAudio,
            isMuted,
            GEMINI_API_KEY,
        ]
    )

    const sendMessage = useCallback(async () => {
        if (!input.trim()) return

        const userText = input
        setInput("")
        addUserMessage(userText)

        await callGeminiFunction(userText)
    }, [input, addUserMessage, callGeminiFunction])

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    return (
        <>
            {/* Audio Element for TTS */}
            <audio ref={audioRef} className="hidden" />

            {/* Floating Holographic Orb Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-8 right-8 w-20 h-20 flex items-center justify-center z-50 group"
                    >
                        {/* Outer Ring */}
                        <div className="absolute inset-0 rounded-full border-2 border-[#f1c40f]/30 border-dashed animate-[spin_10s_linear_infinite]" />
                        {/* Inner Ring */}
                        <div className="absolute inset-1 rounded-full border border-[#8e44ad]/50 animate-[spin_5s_linear_infinite_reverse]" />
                        {/* Core Orb */}
                        <div className="absolute inset-3 rounded-full bg-gradient-to-br from-[#8e44ad] via-[#9b59b6] to-[#f1c40f] shadow-[0_0_30px_rgba(142,68,173,0.8)] flex items-center justify-center backdrop-blur-md overflow-hidden">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                            <Bot size={32} className="text-white relative z-10 drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]" />
                        </div>
                        {/* Glow Effect */}
                        <div className="absolute inset-0 rounded-full bg-[#8e44ad] opacity-20 blur-xl group-hover:opacity-40 transition-opacity duration-500" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Futuristic Chat Interface */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95, filter: "blur(10px)" }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: 50, scale: 0.95, filter: "blur(10px)" }}
                        transition={{ type: "spring", damping: 20, stiffness: 100 }}
                        className="fixed bottom-8 right-8 w-[95vw] md:w-[750px] h-[500px] bg-[#050505]/90 backdrop-blur-3xl rounded-[30px] border border-white/10 shadow-[0_0_60px_rgba(142,68,173,0.3)] z-50 flex flex-col overflow-hidden"
                    >
                        {/* Cyberpunk Grid Background */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(142,68,173,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(142,68,173,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

                        {/* Header */}
                        <div className="relative p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#8e44ad]/10 to-transparent">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8e44ad] to-[#2c3e50] flex items-center justify-center shadow-[0_0_15px_rgba(142,68,173,0.5)] border border-white/10">
                                        <Bot size={24} className="text-white" />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#050505] rounded-full flex items-center justify-center">
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#2ecc71] shadow-[0_0_8px_#2ecc71] animate-pulse" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsMuted(!isMuted)}
                                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-[#f1c40f] transition-all border border-white/5"
                                >
                                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                                </button>
                                <button
                                    onClick={clearMessages}
                                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-[#e74c3c] transition-all border border-white/5"
                                    title="Clear Protocol"
                                >
                                    <Trash2 size={18} />
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all border border-white/5"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="relative flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            {messages.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                                    <div className="w-24 h-24 rounded-full bg-[#8e44ad]/10 flex items-center justify-center mb-6 animate-pulse">
                                        <Sparkles size={40} className="text-[#8e44ad]" />
                                    </div>
                                    <h4 className="text-white font-bold text-lg mb-2 font-['Orbitron']">AWAITING INPUT</h4>
                                    <p className="text-white/40 text-sm max-w-[250px] leading-relaxed">
                                        I can manage your <span className="text-[#f1c40f]">goals</span>, track <span className="text-[#f1c40f]">habits</span>, take <span className="text-[#f1c40f]">notes</span>, and set <span className="text-[#f1c40f]">timers</span>.
                                    </p>
                                </div>
                            )}
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, x: msg.sender === "user" ? 20 : -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"} max-w-[85%]`}>
                                        <span className="text-[10px] text-white/30 mb-1 font-mono uppercase tracking-wider">
                                            {msg.sender === "user" ? "You" : "System"}
                                        </span>
                                        <div
                                            className={`p-4 rounded-2xl text-sm leading-relaxed backdrop-blur-sm border ${msg.sender === "user"
                                                ? "bg-[#8e44ad]/20 border-[#8e44ad]/30 text-white rounded-tr-none shadow-[0_0_15px_rgba(142,68,173,0.1)]"
                                                : "bg-white/5 border-white/10 text-white/90 rounded-tl-none shadow-lg"
                                                }`}
                                        >
                                            {msg.text}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="relative p-5 bg-[#050505]/80 border-t border-white/10 backdrop-blur-xl">
                            <div className="relative flex items-center gap-3">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Enter command..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-white/20 focus:outline-none focus:border-[#8e44ad] focus:bg-white/10 transition-all text-sm font-medium tracking-wide"
                                />
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleMicClick}
                                    className={`p-4 rounded-xl transition-all border border-white/10 ${isListening
                                        ? "bg-[#e74c3c] text-white shadow-[0_0_20px_rgba(231,76,60,0.4)] animate-pulse"
                                        : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
                                        }`}
                                >
                                    <Mic size={20} />
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={sendMessage}
                                    disabled={!input.trim()}
                                    className="p-4 bg-gradient-to-r from-[#8e44ad] to-[#9b59b6] text-white rounded-xl hover:shadow-[0_0_20px_rgba(142,68,173,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                                >
                                    <Send size={20} fill="currentColor" />
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
