"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { MessageSquare, X, Mic, MicOff, Send } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import "./SmartAssistant.css"
import confetti from "canvas-confetti"
import { useQuests } from "./QuestContext"

// Environment variables
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`
const DEEPGRAM_API_KEY = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY

function useChat() {
  const [messages, setMessages] = useState(() => {
    try {
      const storedMessages = localStorage.getItem("jotai_conversationHistory")
      return storedMessages ? JSON.parse(storedMessages) : []
    } catch (error) {
      console.error("Error parsing stored messages:", error)
      return []
    }
  })

  const [userInfo, setUserInfo] = useState(() => {
    try {
      const storedInfo = localStorage.getItem("jotai_userInfo")
      return storedInfo ? JSON.parse(storedInfo) : {}
    } catch (error) {
      console.error("Error parsing stored user info:", error)
      return {}
    }
  })

  const aiTextRef = useRef("")

  useEffect(() => {
    try {
      localStorage.setItem("jotai_conversationHistory", JSON.stringify(messages))
    } catch (error) {
      console.error("Error storing messages:", error)
    }
  }, [messages])

  useEffect(() => {
    try {
      localStorage.setItem("jotai_userInfo", JSON.stringify(userInfo))
    } catch (error) {
      console.error("Error storing user info:", error)
    }
  }, [userInfo])

  const addUserMessage = useCallback((message) => {
    setMessages((prev) => {
      const newMessages = [...prev, message]
      if (newMessages.length > 20) {
        return newMessages.slice(1)
      }
      return newMessages
    })
  }, [])

  const displayTypingEffect = useCallback((text) => {
    return new Promise((resolve) => {
      aiTextRef.current = ""
      const newMessage = { role: "assistant", text: "", id: Date.now() }
      setMessages((prev) => [...prev, newMessage])

      let i = 0
      const interval = setInterval(() => {
        if (i < text.length) {
          aiTextRef.current += text[i]
          setMessages((prev) => {
            const updatedMessages = [...prev]
            const lastIndex = updatedMessages.length - 1
            updatedMessages[lastIndex] = {
              ...updatedMessages[lastIndex],
              text: aiTextRef.current,
            }
            return updatedMessages
          })
          i++
        } else {
          clearInterval(interval)
          resolve()
        }
      }, 20)
    })
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    try {
      localStorage.removeItem("jotai_conversationHistory")
    } catch (error) {
      console.error("Error clearing conversation history:", error)
    }
  }, [])

  const updateUserInfo = useCallback((newInfo) => {
    setUserInfo((prev) => ({ ...prev, ...newInfo }))
  }, [])

  return {
    messages,
    displayTypingEffect,
    addUserMessage,
    userInfo,
    updateUserInfo,
    clearMessages,
  }
}

const TypingIndicator = () => (
  <div className="typing-indicator">
    {[0, 1, 2].map((i) => (
      <motion.span
        key={`typing-dot-${i}`}
        initial={{ y: 0 }}
        animate={{ y: [0, -5, 0] }}
        transition={{
          duration: 0.6,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "loop",
          delay: i * 0.1,
          ease: "easeInOut",
        }}
      ></motion.span>
    ))}
  </div>
)

const DeepgramSTT_TTS = () => {
  const [transcription, setTranscription] = useState("")
  const audioRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const wsRef = useRef(null)

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" })
      mediaRecorderRef.current = mediaRecorder

      wsRef.current = new WebSocket(`wss://api.deepgram.com/v1/listen?punctuate=true`, ["token", DEEPGRAM_API_KEY])

      wsRef.current.onopen = () => console.log("🎧 WebSocket Connected")

      wsRef.current.onmessage = (message) => {
        const data = JSON.parse(message.data)
        if (data.channel && data.channel.alternatives[0]) {
          setTranscription(data.channel.alternatives[0].transcript)
        }
      }

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          console.log("🎤 Sending audio chunk to Deepgram...")
          wsRef.current.send(event.data)
        }
      }

      mediaRecorder.start(1000)
    } catch (error) {
      console.error("Microphone access error:", error)
    }
  }

  const stopListening = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
    }
    if (wsRef.current) {
      wsRef.current.close()
    }
  }

  const playAudio = async (textToSpeak) => {
    try {
      const response = await fetch("https://api.deepgram.com/v1/speak?model=aura-asteria-en", {
        method: "POST",
        headers: {
          Authorization: `Token ${DEEPGRAM_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: textToSpeak }),
      })

      if (!response.ok) throw new Error("❌ Failed to fetch audio")

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      audioRef.current.src = audioUrl
      audioRef.current.play()
    } catch (error) {
      console.error("TTS Error:", error)
    }
  }

  return {
    startListening,
    stopListening,
    transcription,
    playAudio,
    audioRef,
  }
}



function Assistant({ onClose, onAddHabit, onAddNote, onRemoveNote, onStartPomodoro, goals = [], habits = [], notes = [] }) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const { messages, displayTypingEffect, addUserMessage, userInfo, updateUserInfo, clearMessages } = useChat()
  const messagesEndRef = useRef(null)
  const [userNameInput, setUserNameInput] = useState("")

  const { addGoal, toggleComplete, deleteGoal, editGoal } = useQuests()

  const { startListening, stopListening, transcription, playAudio, audioRef } = DeepgramSTT_TTS()
  const [isListening, setIsListening] = useState(false)

  useEffect(() => {
    if (transcription) {
      setInput(transcription)
    }
  }, [transcription])

  const handleMicClick = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
    setIsListening((prev) => !prev)
  }

  const toggleChat = useCallback(() => {
    setOpen((prevOpen) => !prevOpen)
  }, [])

  const handleClearChat = useCallback(() => {
    clearMessages()
  }, [clearMessages])

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

    try {
      const audio = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3")
      audio.volume = 0.5
      audio.play().catch((e) => console.log("Audio play error:", e))
    } catch (error) {
      console.error("Error playing sound:", error)
    }
  }, [])

  // Function to call Gemini with tools
  const callGeminiFunction = useCallback(async (userText) => {
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
            frequency: { type: "STRING", description: "Frequency (daily, weekly, monthly). Default to daily." },
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
      - Current Goals: ${JSON.stringify(goals.map(g => ({ id: g.id, title: g.title, completed: g.completed })))}
      - Current Habits: ${JSON.stringify(habits.map(h => ({ id: h.id, text: h.text })))}
      - Current Notes: ${JSON.stringify(notes.map(n => ({ id: n.id, content: n.text })))}
      
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
      const functionCall = parts.find(part => part.functionCall)

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
        playAudio(responseText)
      } else {
        // Normal chat response
        const textResponse = parts.map(p => p.text).join(" ") || "I didn't understand that."
        await displayTypingEffect(textResponse)
        playAudio(textResponse)
      }

    } catch (error) {
      console.error("Error calling Gemini:", error)
      await displayTypingEffect("⚠️ My brain is fuzzy right now. Please try again.")
    }
  }, [userInfo.name, goals, habits, notes, addGoal, deleteGoal, editGoal, toggleComplete, triggerConfetti, onAddHabit, onAddNote, onRemoveNote, onStartPomodoro, displayTypingEffect, playAudio])

  const sendMessage = useCallback(async () => {
    if (!input.trim()) return

    const userMessageId = `user-${Date.now()}`
    addUserMessage({ role: "user", text: input, id: userMessageId })
    const currentInput = input
    setInput("")
    setLoading(true)

    await callGeminiFunction(currentInput)

    setLoading(false)
  }, [input, goals, habits, addUserMessage, displayTypingEffect, addGoal, toggleComplete, deleteGoal, editGoal, onAddHabit, onAddNote, onStartPomodoro, userInfo.name, playAudio])

  const handleInputChange = useCallback((e) => {
    setInput(e.target.value)
  }, [])

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        sendMessage()
      }
    },
    [sendMessage],
  )

  const handleUserNameSubmit = useCallback(() => {
    if (userNameInput.trim()) {
      updateUserInfo({ name: userNameInput })
      setUserNameInput("")
      displayTypingEffect(`Nice to meet you, ${userNameInput}! How can I help you today?`)
    }
  }, [userNameInput, updateUserInfo, displayTypingEffect])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div>
      <motion.button
        onClick={toggleChat}
        className="assistant-button"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <MessageSquare size={24} />
      </motion.button>

      <motion.div
        className={`assistant-container ${open ? "open" : "closed"}`}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{
          opacity: open ? 1 : 0,
          y: open ? 0 : 20,
          scale: open ? 1 : 0.95,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 25,
        }}
      >
        <div className="assistant-header">
          <span>Assist</span>
          <div className="assistant-header-actions">
            <button onClick={handleClearChat} className="assistant-clear-chat">
              Clear Chat
            </button>
            <button onClick={toggleChat} className="assistant-close">
              <X size={20} />
            </button>
          </div>
        </div>

        <motion.div
          className="assistant-messages"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <AnimatePresence mode="wait">
            {messages.length === 0 ? (
              <motion.div
                key="empty-state"
                className="assistant-empty-state"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <p>How can I assist you today?</p>
              </motion.div>
            ) : (
              messages.map((msg) => (
                <motion.div
                  key={msg.id || `message-${msg.role}-${Date.now()}-${Math.random()}`}
                  className={`assistant-message ${msg.role}`}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                  }}
                >
                  {msg.text}
                </motion.div>
              ))
            )}
          </AnimatePresence>
          {loading && <TypingIndicator key="typing-indicator" />}
          <div ref={messagesEndRef} />
        </motion.div>

        {!userInfo.name ? (
          <div className="assistant-input-container">
            <input
              className="assistant-input"
              value={userNameInput}
              onChange={(e) => setUserNameInput(e.target.value)}
              placeholder="Enter your name..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleUserNameSubmit()
                }
              }}
            />
            <motion.button
              className="assistant-send-button"
              onClick={handleUserNameSubmit}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Set Name
            </motion.button>
          </div>
        ) : (
          <div className="assistant-input-container">
            <input
              className="assistant-input"
              value={input}
              onChange={handleInputChange}
              placeholder="Ask me anything..."
              onKeyDown={handleKeyDown}
            />
            <motion.button
              className={`assistant-mic-button ${isListening ? "recording" : ""}`}
              onClick={handleMicClick}
              disabled={loading}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              animate={
                isListening
                  ? {
                    boxShadow: ["0 0 0 0 rgba(255, 0, 0, 0.7)", "0 0 0 10px rgba(255, 0, 0, 0)"],
                  }
                  : {}
              }
              transition={
                isListening
                  ? {
                    duration: 1.5,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "loop",
                  }
                  : {}
              }
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
              {isListening && (
                <div className="dots">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <motion.span
                      key={`mic-dot-${i}`}
                      animate={{
                        y: [0, -4, 0],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 0.6,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: "loop",
                        delay: i * 0.1,
                        ease: "easeInOut",
                      }}
                    ></motion.span>
                  ))}
                </div>
              )}
            </motion.button>
            <motion.button
              className="assistant-send-button"
              onClick={sendMessage}
              disabled={loading}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Send size={20} />
            </motion.button>
          </div>
        )}
        <audio ref={audioRef} style={{ display: "none" }} />
      </motion.div>
    </div>
  )
}

export default Assistant
