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

// Define keywords for different actions
const actionKeywords = {
  add: ["add goal", "create goal", "new goal", "add task", "create task", "new task"],
  delete: ["delete goal", "remove goal", "delete task", "remove task"],
  edit: ["edit goal", "update goal", "change goal", "edit task", "update task", "change task"],
  complete: [
    "complete goal",
    "finish goal",
    "mark goal as done",
    "goal completed",
    "complete task",
    "finish task",
    "mark task as done",
    "task completed",
  ],
  habit: ["add habit", "create habit", "new habit", "track habit"],
  pomodoro: ["start timer", "set timer", "pomodoro timer", "focus timer", "start pomodoro"],
}

const aiAddedKeywords = ["i've added the goal", "i've added a goal", "i'm adding", "created a new"]

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

// Improved goal finding function
const findGoalByText = (goals, searchText) => {
  if (!goals || !searchText) return null

  const lowerSearchText = searchText.toLowerCase().trim()

  // First try exact match
  let foundGoal = goals.find((g) => g.title.toLowerCase() === lowerSearchText)
  if (foundGoal) return foundGoal

  // Then try partial match
  foundGoal = goals.find((g) => g.title.toLowerCase().includes(lowerSearchText))
  if (foundGoal) return foundGoal

  // Try matching with description
  foundGoal = goals.find((g) => g.description && g.description.toLowerCase().includes(lowerSearchText))
  if (foundGoal) return foundGoal

  // Try matching individual words
  const searchWords = lowerSearchText.split(" ")
  foundGoal = goals.find((g) => searchWords.some((word) => g.title.toLowerCase().includes(word)))

  return foundGoal
}

// Enhanced to handle different types of goals and actions
const extractAction = (text, goals, habits) => {
  const lowerText = text.toLowerCase()
  console.log("Extracting action from:", text)
  console.log(
    "Available goals:",
    goals?.map((g) => g.title),
  )

  // Check for habit-related commands
  for (const keyword of actionKeywords.habit) {
    if (lowerText.includes(keyword)) {
      const habitText = text
        .substring(lowerText.indexOf(keyword) + keyword.length)
        .trim()
        .replace(/["']/g, "")
      return { action: "add_habit", data: habitText }
    }
  }

  // Check for pomodoro-related commands
  for (const keyword of actionKeywords.pomodoro) {
    if (lowerText.includes(keyword)) {
      const durationMatch = lowerText.match(/(\d+)\s*minutes?/i)
      const duration = durationMatch ? Number.parseInt(durationMatch[1]) : 25
      return { action: "start_pomodoro", data: duration }
    }
  }

  // Check for goal completion
  for (const keyword of actionKeywords.complete) {
    if (lowerText.includes(keyword)) {
      const goalText = text
        .substring(lowerText.indexOf(keyword) + keyword.length)
        .trim()
        .replace(/["']/g, "")

      console.log("Looking for goal to complete:", goalText)
      const goalToComplete = findGoalByText(goals, goalText)
      console.log("Found goal to complete:", goalToComplete)

      return { action: "complete", data: goalToComplete?.id }
    }
  }

  // Check for goal deletion
  for (const keyword of actionKeywords.delete) {
    if (lowerText.includes(keyword)) {
      const goalText = text
        .substring(lowerText.indexOf(keyword) + keyword.length)
        .trim()
        .replace(/["']/g, "")

      console.log("Looking for goal to delete:", goalText)
      const goalToDelete = findGoalByText(goals, goalText)
      console.log("Found goal to delete:", goalToDelete)

      return { action: "delete", data: goalToDelete?.id }
    }
  }

  // Check for goal editing
  for (const keyword of actionKeywords.edit) {
    if (lowerText.includes(keyword)) {
      // Try to find quoted old text and new text
      const quotedMatch = text.match(/'([^']+)' to '([^']+)'/i) || text.match(/"([^"]+)" to "([^"]+)"/i)
      if (quotedMatch) {
        const oldText = quotedMatch[1]
        const newText = quotedMatch[2]
        const goalToEdit = findGoalByText(goals, oldText)
        if (goalToEdit) {
          return { action: "edit", data: { id: goalToEdit.id, newText } }
        }
      }

      // Fallback to less strict parsing
      const simpleMatch = text.match(/(.+) to (.+)/i)
      if (simpleMatch) {
        const oldTextCandidate = simpleMatch[1].substring(lowerText.indexOf(keyword) + keyword.length).trim()
        const newText = simpleMatch[2].trim()
        const goalToEdit = findGoalByText(goals, oldTextCandidate)
        if (goalToEdit) {
          return { action: "edit", data: { id: goalToEdit.id, newText } }
        }
      }
    }
  }

  // Check for goal addition
  for (const keyword of actionKeywords.add) {
    if (lowerText.includes(keyword)) {
      const goalText = text
        .substring(lowerText.indexOf(keyword) + keyword.length)
        .trim()
        .replace(/["']/g, "")
      return { action: "add", data: goalText }
    }
  }

  return { action: null, data: null }
}

const extractGoalFromText = (text) => {
  console.log("Checking text for keywords:", text)
  const lowerText = text.toLowerCase()

  // Check if this is a user request to add a goal
  for (const keyword of actionKeywords.add) {
    if (lowerText.includes(keyword)) {
      const trimmedText = text.substring(lowerText.indexOf(keyword) + keyword.length).trim()
      return trimmedText.replace(/^["'](.+(?=["']$))["']$/, "$1")
    }
  }

  // Check if the AI is confirming it added a goal
  for (const keyword of aiAddedKeywords) {
    if (lowerText.includes(keyword)) {
      console.log("AI added keyword found:", keyword)

      const colonIndex = lowerText.indexOf(":")
      if (colonIndex !== -1) {
        const goalText = text.substring(colonIndex + 1).trim()
        return goalText.replace(/\*\*/g, "").trim()
      }

      const quoteMatch = text.match(/["']([^"']+)["']/)
      if (quoteMatch) {
        return quoteMatch[1]
      }

      const keywordIndex = lowerText.indexOf(keyword) + keyword.length
      const goalText = text.substring(keywordIndex).trim()
      return goalText.replace(/\*\*/g, "").trim()
    }
  }

  if (lowerText.includes("create a goal") || lowerText.includes("set a goal")) {
    return "Set up a goal"
  }

  console.log("No keywords detected in text.")
  return null
}

function Assistant({ onClose, onAddHabit, onAddNote, onStartPomodoro, goals = [], habits = [], notes = [] }) {
  const [open, setOpen] = useState(true)
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

  const sendMessage = useCallback(async () => {
    console.log("User input:", input)
    if (!input.trim()) return

    const userMessageId = `user-${Date.now()}`
    addUserMessage({ role: "user", text: input, id: userMessageId })
    setInput("")
    setLoading(true)

    try {
      // First check for direct commands
      const userAction = extractAction(input, goals, habits)
      if (userAction.action) {
        handleAction(userAction)
        setLoading(false)
        return
      }

      if (!GEMINI_API_KEY) {
        await displayTypingEffect("⚠️ API key is missing. I'll try to help with basic functionality.")
        setLoading(false)
        return
      }

      const response = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${userInfo.name ? `[User: ${userInfo.name}]` : ""} ${input}`,
                },
              ],
            },
          ],
        }),
      })

      const data = await response.json()
      const aiText =
        data?.candidates?.[0]?.content?.parts?.map((part) => part.text).join(" ") || "I couldn't process that request."

      await displayTypingEffect(aiText)
      playAudio(aiText)

      const aiAction = extractAction(aiText, goals, habits)
      if (aiAction.action) {
        handleAction(aiAction)
      } else {
        const extractedGoal = extractGoalFromText(aiText)
        if (extractedGoal) {
          addGoal(extractedGoal)
          displayTypingEffect(`I've added "${extractedGoal}" to your goals.`)
        }
      }
    } catch (error) {
      console.error("Error fetching AI response:", error)
      await displayTypingEffect("⚠️ Error fetching response. Please try again later.")
    } finally {
      setLoading(false)
    }
  }, [
    input,
    goals,
    habits,
    addUserMessage,
    displayTypingEffect,
    addGoal,
    toggleComplete,
    deleteGoal,
    editGoal,
    onAddHabit,
    onAddNote,
    onStartPomodoro,
    userInfo.name,
    playAudio,
  ])

  const handleAction = (action) => {
    console.log("Handling action:", action)

    switch (action.action) {
      case "add":
        if (action.data) {
          addGoal(action.data)
          displayTypingEffect(`I've added "${action.data}" to your goals.`)
        } else {
          displayTypingEffect("Couldn't understand the goal to add")
        }
        break
      case "delete":
        if (action.data) {
          deleteGoal(action.data)
          displayTypingEffect(`Goal deleted successfully`)
        } else {
          displayTypingEffect("Couldn't find that goal to delete. Try being more specific with the goal title.")
        }
        break
      case "edit":
        if (action.data?.id && action.data.newText) {
          editGoal(action.data.id, action.data.newText)
          displayTypingEffect(`Goal updated to: "${action.data.newText}"`)
        } else {
          displayTypingEffect("Couldn't find that goal to edit or new text is missing")
        }
        break
      case "complete":
        if (action.data) {
          toggleComplete(action.data)
          displayTypingEffect(`🎉 Congratulations! Goal completed successfully!`)
          triggerConfetti()
        } else {
          displayTypingEffect("Couldn't find that goal to complete. Try being more specific with the goal title.")
        }
        break
      case "add_habit":
        if (action.data) {
          onAddHabit(action.data)
          displayTypingEffect(`I've added "${action.data}" to your habits.`)
        } else {
          displayTypingEffect("Couldn't understand the habit to add")
        }
        break
      case "start_pomodoro":
        if (action.data) {
          onStartPomodoro(action.data)
          displayTypingEffect(`Starting a ${action.data}-minute Pomodoro timer.`)
        } else {
          onStartPomodoro(25)
          displayTypingEffect(`Starting a 25-minute Pomodoro timer.`)
        }
        break
      default:
        break
    }
  }

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
