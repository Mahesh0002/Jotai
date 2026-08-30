"use client"

import { useState, useEffect, useMemo, useCallback, memo } from "react"
import "./App.css"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faCat,
  faChartLine,
  faPaperPlane,
  faHome,
  faNewspaper,
  faHeart,
  faTrophy,
} from "@fortawesome/free-solid-svg-icons"
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

// Import the QuestContext provider and hook
import { QuestProvider, useQuests } from "./components/QuestContext"

// Optimized localStorage utilities with debouncing
const createDebouncedSave = (key, delay = 500) => {
  let timeoutId
  return (data) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(data))
      } catch (error) {
        console.error(`Error saving ${key}:`, error)
      }
    }, delay)
  }
}

// Memoized PlayerProgress component
const PlayerProgress = memo(() => (
  <div className="modern-component">
    <div className="component-header">
      <span className="component-icon">🎮</span>
      <h3>PLAYER PROGRESS</h3>
    </div>
    <div className="player-stats">
      <div className="main-stat">
        <span className="level-number">47</span>
        <span className="level-label">LEVEL</span>
      </div>
      <div className="progress-details">
        <div className="progress-item">
          <span className="progress-label">XP</span>
          <span className="progress-value">2,847/3,000</span>
        </div>
        <div className="progress-item">
          <span className="progress-label">Streak</span>
          <span className="progress-value">12 days</span>
        </div>
      </div>
    </div>
    <div className="level-progress-bar">
      <div className="progress-fill" style={{ width: "95%" }}></div>
    </div>
  </div>
))

PlayerProgress.displayName = "PlayerProgress"

// Optimized localStorage loader with error handling
const loadFromStorage = (key, defaultValue) => {
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : defaultValue
  } catch (error) {
    console.error(`Error loading ${key}:`, error)
    return defaultValue
  }
}

// Memoized WelcomeSection component
const WelcomeSection = memo(() => (
  <div className="welcome-section">
    <div className="welcome-content">
      <div className="user-avatar">
        <img src="/placeholder.svg?height=60&width=60" alt="User Avatar" />
      </div>
      <div className="welcome-text">
        <h2>
          Welcome back, <span className="username">PLAYER</span>
        </h2>
      </div>
    </div>
  </div>
))

WelcomeSection.displayName = "WelcomeSection"

// Memoized Navigation component
const Navigation = memo(({ navigationItems, activeSection, onSectionChange }) => (
  <div className="nav-menu">
    {navigationItems.map((item) => (
      <button
        key={item.id}
        className={`nav-item ${activeSection === item.id ? "active" : ""}`}
        onClick={() => onSectionChange(item.id)}
      >
        <FontAwesomeIcon icon={item.icon} className="nav-icon" />
        <span className="nav-label">{item.label}</span>
      </button>
    ))}
  </div>
))

Navigation.displayName = "Navigation"

// Memoized QuickLinks component
const QuickLinks = memo(({ quickLinks }) => (
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
))

QuickLinks.displayName = "QuickLinks"

function AppContent() {
  const { goals, addGoal, toggleComplete, deleteGoal } = useQuests()

  const [activeSection, setActiveSection] = useState("dashboard")

  // Optimized state initialization with useMemo
  const [habits, setHabits] = useState(() => loadFromStorage("jotai_habits", []))

  const [notes, setNotes] = useState(() => loadFromStorage("jotai_quickNotes", []))

  const [analyticsData, setAnalyticsData] = useState(() =>
    loadFromStorage("jotai_analyticsData", {
      completedGoals: 0,
      totalGoalsCreated: 0,
      streaks: 0,
      focusTime: 0,
      dailyActivity: Array(7).fill(0),
    }),
  )

  const [integrations, setIntegrations] = useState(() =>
    loadFromStorage("jotai_integrations", {
      google: false,
      notion: false,
      spotify: false,
      github: false,
      trello: false,
    }),
  )

  const [assistantOpen, setAssistantOpen] = useState(false)
  const [integrationPanelOpen, setIntegrationPanelOpen] = useState(false)

  // Create debounced save functions
  const debouncedSaveHabits = useMemo(() => createDebouncedSave("jotai_habits"), [])
  const debouncedSaveNotes = useMemo(() => createDebouncedSave("jotai_quickNotes"), [])
  const debouncedSaveAnalytics = useMemo(() => createDebouncedSave("jotai_analyticsData"), [])
  const debouncedSaveIntegrations = useMemo(() => createDebouncedSave("jotai_integrations"), [])

  // Optimized useEffect with debounced saves
  useEffect(() => {
    debouncedSaveHabits(habits)
  }, [habits, debouncedSaveHabits])

  useEffect(() => {
    debouncedSaveNotes(notes)
  }, [notes, debouncedSaveNotes])

  useEffect(() => {
    debouncedSaveAnalytics(analyticsData)
  }, [analyticsData, debouncedSaveAnalytics])

  useEffect(() => {
    debouncedSaveIntegrations(integrations)
  }, [integrations, debouncedSaveIntegrations])

  // Memoized and optimized habit management functions
  const addHabit = useCallback(
    (habitText, frequency = "daily") => {
      if (!habitText.trim()) return

      const newGoal = addGoal(habitText, `Habit: ${frequency}`)
      if (!newGoal) return

      const newHabit = {
        id: Date.now(),
        goalId: newGoal.id,
        text: habitText,
        completed: false,
        frequency: frequency,
        createdAt: new Date().toISOString(),
      }

      setHabits((prevHabits) => [...prevHabits, newHabit])
      return newHabit.id
    },
    [addGoal],
  )

  const toggleHabitCompletion = useCallback(
    (habitId) => {
      setHabits((prevHabits) =>
        prevHabits.map((habit) => {
          if (habit.id === habitId) {
            const updatedHabit = { ...habit, completed: !habit.completed }
            toggleComplete(habit.goalId)
            return updatedHabit
          }
          return habit
        }),
      )
    },
    [toggleComplete],
  )

  const removeHabit = useCallback(
    (habitId) => {
      setHabits((prevHabits) => {
        const habitToRemove = prevHabits.find((h) => h.id === habitId)
        if (habitToRemove?.goalId) {
          deleteGoal(habitToRemove.goalId)
        }
        return prevHabits.filter((habit) => habit.id !== habitId)
      })
    },
    [deleteGoal],
  )

  const addNote = useCallback((noteText) => {
    const newNote = {
      id: Date.now(),
      text: noteText,
      createdAt: new Date().toISOString(),
    }
    setNotes((prevNotes) => [...prevNotes, newNote])
    return newNote.id
  }, [])

  const startPomodoro = useCallback((duration = 25) => {
    setAnalyticsData((prev) => ({
      ...prev,
      focusTime: prev.focusTime + duration,
    }))

    const event = new CustomEvent("startPomodoroFromAssistant", {
      detail: { duration },
    })
    document.dispatchEvent(event)
  }, [])

  const toggleIntegration = useCallback((name) => {
    setIntegrations((prev) => ({
      ...prev,
      [name]: !prev[name],
    }))
  }, [])

  // Memoized constants
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

  const navigationItems = useMemo(
    () => [
      { id: "dashboard", label: "Dashboard", icon: faHome },
      { id: "news", label: "News & Insights", icon: faNewspaper },
      { id: "health", label: "Health & Productivity", icon: faHeart },
      { id: "quests", label: "Daily Quests", icon: faTrophy },
      { id: "progress", label: "Progress Overview", icon: faChartLine },
    ],
    [],
  )

  // Memoized incomplete goals count
  const incompleteGoalsCount = useMemo(() => goals.filter((g) => !g.completed).length, [goals])

  // Memoized section change handler
  const handleSectionChange = useCallback((section) => {
    setActiveSection(section)
  }, [])

  // Memoized assistant toggle
  const toggleAssistant = useCallback(() => {
    setAssistantOpen((prev) => !prev)
  }, [])

  const closeAssistant = useCallback(() => {
    setAssistantOpen(false)
  }, [])

  const toggleIntegrationPanel = useCallback(() => {
    setIntegrationPanelOpen((prev) => !prev)
  }, [])

  const closeIntegrationPanel = useCallback(() => {
    setIntegrationPanelOpen(false)
  }, [])

  // Memoized section content with lazy loading
  const renderSectionContent = useMemo(() => {
    switch (activeSection) {
      case "dashboard":
        return (
          <>
            <WelcomeSection />
            <div className="main-grid">
              <section className="card" style={{ gridColumn: "span 2" }}>
                <div className="quest-combined">
                  <DailyGoals />
                  <ProgressVisualization />
                </div>
              </section>
              <section className="card">
                <QuickNotes notes={notes} addNote={addNote} />
              </section>
              <section className="card">
                <PlayerProgress />
              </section>
            </div>
          </>
        )

      case "news":
        return (
          <div className="main-grid">
            <section className="card">
              <NewsInsights />
            </section>
            <section className="card">
              <CurrencyExchange />
            </section>
            <section className="card">
              <WeatherWidget />
            </section>
          </div>
        )

      case "health":
        return (
          <div className="main-grid">
            <section className="card">
              <PomodoroTimer />
            </section>
            <section className="card">
              <HabitTracker
                habits={habits}
                addHabit={addHabit}
                toggleHabitCompletion={toggleHabitCompletion}
                removeHabit={removeHabit}
              />
            </section>
            <section className="card">
              <WordOfTheDay />
            </section>
            <section className="card">
              <WeatherWidget />
            </section>
          </div>
        )

      case "quests":
        return (
          <div className="main-grid">
            <section className="card">
              <div className="quest">
                <DailyGoals />
              </div>
            </section>
            <section className="card">
              <HabitTracker
                habits={habits}
                addHabit={addHabit}
                toggleHabitCompletion={toggleHabitCompletion}
                removeHabit={removeHabit}
              />
            </section>
          </div>
        )

      case "progress":
        return (
          <div className="main-grid">
            <section className="card" style={{ gridColumn: "span 2" }}>
              <AnalyticsDashboard data={analyticsData} goals={goals} habits={habits} />
            </section>
          </div>
        )

      default:
        return null
    }
  }, [activeSection, notes, addNote, habits, addHabit, toggleHabitCompletion, removeHabit, analyticsData, goals])

  return (
    <div className="App">
      <VideoBackground src="/background.mp4" opacity={1} />

      <nav className="nav-header">
        <div className="nav-brand">
          <div className="brand-logo">
            <span className="logo-icon"></span>
            <span className="brand-name">Jōtai</span>
          </div>
        </div>

        <Navigation
          navigationItems={navigationItems}
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
        />

        <div className="nav-actions">
          <button className="action-btn" onClick={toggleIntegrationPanel}>
            <FontAwesomeIcon icon={faPaperPlane} />
          </button>
        </div>
      </nav>

      <QuickLinks quickLinks={quickLinks} />

      <main className="main-content">{renderSectionContent}</main>

      <MusicPlayer />

      <button
        className={`assistant-button ${assistantOpen ? "active" : ""}`}
        onClick={toggleAssistant}
        aria-label="Open Smart Assistant"
        title="Smart Assistant"
      >
        <FontAwesomeIcon icon={faPaperPlane} className="icon" />
        {incompleteGoalsCount > 0 && <span className="notification-badge">{incompleteGoalsCount}</span>}
      </button>

      {assistantOpen && (
        <SmartAssistant
          onClose={closeAssistant}
          onAddHabit={addHabit}
          onAddNote={addNote}
          onStartPomodoro={startPomodoro}
          goals={goals}
          habits={habits}
          notes={notes}
        />
      )}

      {integrationPanelOpen && (
        <IntegrationPanel integrations={integrations} onToggle={toggleIntegration} onClose={closeIntegrationPanel} />
      )}
    </div>
  )
}

export default function App() {
  return (
    <QuestProvider>
      <AppContent />
    </QuestProvider>
  )
}
