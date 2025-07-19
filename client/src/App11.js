"use client"

import { useState, useEffect, useMemo } from "react"
import "./App.css"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCat, faChartLine,faPaperPlane } from "@fortawesome/free-solid-svg-icons"
import { faYoutube, faReddit, faInstagram, faLinkedin, faSpotify, faDiscord } from "@fortawesome/free-brands-svg-icons"

// Import components
import DailyGoals from "./components/DailyGoals"
import ProgressVisualization from "./components/ProgressVisualization"
import HabitTracker from "./components/HabitTracker"
import NewsInsights from "./components/NewsFeed"
import PomodoroTimer from "./components/PomodoroTimer"
import QuickNotes from "./components/QuickNotes"
import WeatherWidget from "./components/WeatherWidget"
import CurrencyExchange from "./components/StockUpdates"
import WordOfTheDay from "./components/WordOfTheDay"
import MusicPlayer from "./components/MusicPlayer"
import SmartAssistant from "./components/SmartAssistant"
import AnalyticsDashboard from "./components/AnalyticsDashboard"
import IntegrationPanel from "./components/IntegrationPanel"
import VideoBackground from "./VideoBackground"

// Import the QuestContext provider
import { QuestProvider } from "./components/QuestContext"

function App() {
  // Goals State with error handling
  const [goals, setGoals] = useState(() => {
    try {
      const storedGoals = localStorage.getItem("goals")
      return storedGoals ? JSON.parse(storedGoals) : []
    } catch (error) {
      console.error("Error loading goals:", error)
      return []
    }
  })

  // Habits State with error handling
  const [habits, setHabits] = useState(() => {
    try {
      const storedHabits = localStorage.getItem("habits")
      return storedHabits ? JSON.parse(storedHabits) : []
    } catch (error) {
      console.error("Error loading habits:", error)
      return []
    }
  })

  // Notes State with error handling
  const [notes, setNotes] = useState(() => {
    try {
      const storedNotes = localStorage.getItem("quickNotes")
      return storedNotes ? JSON.parse(storedNotes) : []
    } catch (error) {
      console.error("Error loading notes:", error)
      return []
    }
  })

  // Analytics Data with error handling
  const [analyticsData, setAnalyticsData] = useState(() => {
    try {
      const storedData = localStorage.getItem("analyticsData")
      return storedData ? JSON.parse(storedData) : {
        completedGoals: 0,
        totalGoalsCreated: 0,
        streaks: 0,
        focusTime: 0,
        dailyActivity: Array(7).fill(0),
      }
    } catch (error) {
      console.error("Error loading analytics data:", error)
      return {
        completedGoals: 0,
        totalGoalsCreated: 0,
        streaks: 0,
        focusTime: 0,
        dailyActivity: Array(7).fill(0),
      }
    }
  })

  // Integrations State with error handling
  const [integrations, setIntegrations] = useState(() => {
    try {
      const storedIntegrations = localStorage.getItem("integrations")
      return storedIntegrations ? JSON.parse(storedIntegrations) : {
        google: false,
        notion: false,
        spotify: false,
        github: false,
        trello: false,
      }
    } catch (error) {
      console.error("Error loading integrations:", error)
      return {
        google: false,
        notion: false,
        spotify: false,
        github: false,
        trello: false,
      }
    }
  })

  // Assistant State
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [showIntegrations, setShowIntegrations] = useState(false)

  // Save data to localStorage with error handling
  useEffect(() => {
    try {
      localStorage.setItem("goals", JSON.stringify(goals))
    } catch (error) {
      console.error("Error saving goals:", error)
    }
  }, [goals])

  useEffect(() => {
    try {
      localStorage.setItem("habits", JSON.stringify(habits))
    } catch (error) {
      console.error("Error saving habits:", error)
    }
  }, [habits])

  useEffect(() => {
    try {
      localStorage.setItem("quickNotes", JSON.stringify(notes))
    } catch (error) {
      console.error("Error saving notes:", error)
    }
  }, [notes])

  useEffect(() => {
    try {
      localStorage.setItem("analyticsData", JSON.stringify(analyticsData))
    } catch (error) {
      console.error("Error saving analytics data:", error)
    }
  }, [analyticsData])

  useEffect(() => {
    try {
      localStorage.setItem("integrations", JSON.stringify(integrations))
    } catch (error) {
      console.error("Error saving integrations:", error)
    }
  }, [integrations])

  // Quick Links (Memoized for Performance)
  const quickLinks = useMemo(
    () => [
      { name: "YouTube", url: "https://www.youtube.com", icon: faYoutube },
      { name: "Instagram", url: "https://www.instagram.com", icon: faInstagram },
      { name: "LinkedIn", url: "https://www.linkedin.com", icon: faLinkedin },
      { name: "Reddit", url: "https://www.reddit.com", icon: faReddit },
      { name: "Spotify", url: "https://www.spotify.com", icon: faSpotify },
      { name: "Discord", url: "https://www.discord.com", icon: faDiscord },
      { name: "Anime/Manga", url: "https://www.asurascans.com", icon: faCat },
    ],
    [],
  )

  // Goal Management Functions
  const addGoalFromAssistant = (newGoalText) => {
    console.log("New goal received from SmartAssistant:", newGoalText)
    const newGoal = {
      id: Date.now(),
      text: newGoalText,
      completed: false,
      progress: 0,
      createdAt: new Date().toISOString(),
    }
    setGoals((prevGoals) => {
      const updatedGoals = [...prevGoals, newGoal]
      console.log("Updated goals:", updatedGoals)
      return updatedGoals
    })
    
    // Update analytics
    setAnalyticsData(prev => ({
      ...prev,
      totalGoalsCreated: prev.totalGoalsCreated + 1
    }))
    
    return newGoal.id
  }

  const deleteGoal = (goalId) => {
    setGoals((prevGoals) => prevGoals.filter((g) => g.id !== goalId))
  }

  const editGoal = (goalId, newGoalData) => {
    setGoals((prevGoals) => prevGoals.map((g) => (g.id === goalId ? { ...g, ...newGoalData } : g)))
  }

  const completeGoal = (goalId) => {
    setGoals((prevGoals) => prevGoals.map((g) => (g.id === goalId ? { ...g, completed: true, progress: 100 } : g)))
    
    // Update analytics
    setAnalyticsData(prev => ({
      ...prev,
      completedGoals: prev.completedGoals + 1,
      streaks: prev.streaks + 1,
      dailyActivity: prev.dailyActivity.map((val, i) => 
        i === prev.dailyActivity.length - 1 ? val + 1 : val
      )
    }))
  }

  // Habit Management Functions
  const addHabitFromAssistant = (habitText) => {
    console.log("New habit received from SmartAssistant:", habitText)
    const newHabit = {
      id: Date.now(),
      text: habitText,
      completed: false,
      frequency: "daily",
      createdAt: new Date().toISOString(),
    }
    setHabits((prevHabits) => [...prevHabits, newHabit])

    // Trigger custom event for HabitTracker component
    const event = new CustomEvent("addHabitFromAssistant", {
      detail: { habitText },
    })
    document.dispatchEvent(event)

    return newHabit.id
  }

  // Note Management Functions
  const addNoteFromAssistant = (noteText) => {
    console.log("New note received from SmartAssistant:", noteText)
    const newNote = {
      id: Date.now(),
      text: noteText,
      createdAt: new Date().toISOString(),
    }
    setNotes((prevNotes) => [...prevNotes, newNote])

    // Trigger custom event for QuickNotes component
    const event = new CustomEvent("addNoteFromAssistant", {
      detail: { noteText },
    })
    document.dispatchEvent(event)

    return newNote.id
  }

  // Pomodoro Management Functions
  const startPomodoroFromAssistant = (duration = 25) => {
    console.log("Starting Pomodoro from SmartAssistant:", duration)
    
    // Update analytics
    setAnalyticsData(prev => ({
      ...prev,
      focusTime: prev.focusTime + duration
    }))

    // Trigger custom event for PomodoroTimer component
    const event = new CustomEvent("startPomodoroFromAssistant", {
      detail: { duration },
    })
    document.dispatchEvent(event)
  }

  // Integration Management
  const toggleIntegration = (name) => {
    setIntegrations(prev => ({
      ...prev,
      [name]: !prev[name]
    }))
  }

  // Toggle Analytics Dashboard
  const toggleAnalytics = () => {
    setShowAnalytics(prev => !prev)
    if (showIntegrations) setShowIntegrations(false)
  }

  // Toggle Integrations Panel
  const toggleIntegrations = () => {
    setShowIntegrations(prev => !prev)
    if (showAnalytics) setShowAnalytics(false)
  }

  console.log("Rendering App with goals:", goals)

  return (
    <div className="App">
      {/* Video background - corrected path */}
      <VideoBackground src="./background.mp4" opacity={1} />
      
      <header className="App-header">
        <h1 aria-label="Personal Assistant Dashboard">Personal Assistant</h1>
        <div className="header-actions">
          <button 
            className={`analytics-button ${showAnalytics ? 'active' : ''}`} 
            onClick={toggleAnalytics}
            title="Analytics Dashboard"
          >
            <FontAwesomeIcon icon={faChartLine} />
          </button>
          <button 
            className={`integrations-button ${showIntegrations ? 'active' : ''}`} 
            onClick={toggleIntegrations}
            title="Integrations"
          >
            <span className="integration-icon">⚙️</span>
          </button>
        </div>
      </header>

      {/* Sticky Quick Links */}
      <div className="quick-links-container">
        {quickLinks.map((link, index) => (
          <a
            key={index}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="quick-link-button"
            title={link.name}
            aria-label={`Open ${link.name}`}
          >
            <FontAwesomeIcon icon={link.icon} />
          </a>
        ))}
      </div>

      {/* Analytics Dashboard (Overlay) */}
      {showAnalytics && (
        <div className="overlay-panel">
          <AnalyticsDashboard 
            data={analyticsData} 
            goals={goals}
            habits={habits}
            onClose={() => setShowAnalytics(false)}
          />
        </div>
      )}

      {/* Integrations Panel (Overlay) */}
      {showIntegrations && (
        <div className="overlay-panel">
          <IntegrationPanel 
            integrations={integrations}
            onToggle={toggleIntegration}
            onClose={() => setShowIntegrations(false)}
          />
        </div>
      )}

      {/* Main Dashboard Layout */}
      <main className="main-grid">
        {/* Daily Goals section */}
        <section className="card" style={{ gridColumn: "span 2" }}>
          <div className="quest-component-container">
            <QuestProvider>
              <div className="quest-modules">
                <DailyGoals />
                <ProgressVisualization />
              </div>
            </QuestProvider>
          </div>
        </section>
        <section className="card">
          <CurrencyExchange />
        </section>
        <section className="card">
          <WeatherWidget />
        </section>
        <section className="card">
          <NewsInsights />
        </section>
        <section className="card">
          <PomodoroTimer />
        </section>
        <section className="card">
          <QuickNotes />
        </section>
        <section className="card">
          <HabitTracker />
        </section>
        <section className="card">
          <WordOfTheDay />
        </section>
      </main>

      {/* Music Player Button */}
      <MusicPlayer />

      {/* Smart Assistant Button & Popup */}
      <button
        className={`assistant-button ${assistantOpen ? "active" : ""}`}
        onClick={() => setAssistantOpen(!assistantOpen)}
        aria-label="Open Smart Assistant"
        title="Smart Assistant"
      >
        <FontAwesomeIcon icon={faPaperPlane} className="icon" />
        {goals.filter((g) => !g.completed).length > 0 && (
          <span className="notification-badge">{goals.filter((g) => !g.completed).length}</span>
        )}
      </button>

      {assistantOpen && (
        <SmartAssistant
          onClose={() => setAssistantOpen(false)}
          onNewGoal={addGoalFromAssistant}
          onDeleteGoal={deleteGoal}
          onEditGoal={editGoal}
          onCompleteGoal={completeGoal}
          onNewHabit={addHabitFromAssistant}
          onNewNote={addNoteFromAssistant}
          onStartPomodoro={startPomodoroFromAssistant}
          goals={goals}
          habits={habits}
        />
      )}
    </div>
  )
}

export default App;