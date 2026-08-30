"use client"

import { useState, useEffect, useMemo, useCallback, memo } from "react"
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion"
import "./App.css" // Keeping for child components
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
    faCat,
    faChartLine,
    faHome,
    faNewspaper,
    faHeart,
    faTrophy,
} from "@fortawesome/free-solid-svg-icons"
import { faYoutube, faReddit, faInstagram, faLinkedin, faSpotify, faDiscord } from "@fortawesome/free-brands-svg-icons"
import { Zap } from "lucide-react"

// Import components
import DailyGoals from "./components/DailyGoals_test"
import ProgressVisualization from "./components/ProgressVisualization_test"
import HabitTracker from "./components/HabitTracker_test"
import NewsInsights from "./components/NewsFeed_test"
import PomodoroTimer from "./components/PomodoroTimer_test"
import QuickNotes from "./components/QuickNotes_test"
import WeatherWidget from "./components/WeatherWidget_test"
import CurrencyExchange from "./components/StockUpdates_test"
import WordOfTheDay from "./components/WordOfTheDay_test"
import MusicPlayer from "./components/MusicPlayer"
import SmartAssistant from "./components/SmartAssistant_test"
import AnalyticsDashboard from "./components/AnalyticsDashboard_test"
// import IntegrationPanel from "./components/IntegrationPanel"
import IntegrationPanel from "./components/IntegrationPanel_test"
import Footer from "./components/Footer_test"
import AboutModal from "./components/AboutModal_test"
import backgroundImage from "./wp4814086-cyberpunk-minimal-wallpapers.jpg"

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
    <div className="h-full flex flex-col bg-transparent">
        <div className="flex items-center gap-2.5 mb-5 pb-2.5 border-b border-[#f1c40f33]">
            <span className="text-[1.2rem]">🎮</span>
            <h3 className="m-0 text-[1.1rem] font-bold tracking-[1px] text-accent">PLAYER PROGRESS</h3>
        </div>
        <div className="flex flex-col gap-[15px] md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col items-center justify-center p-2.5 bg-black/30 rounded-lg border border-[#f1c40f33] min-w-[100px]">
                <span className="text-[2rem] font-bold text-accent drop-shadow-[0_0_10px_var(--accent-color)]">47</span>
                <span className="text-[0.8rem] text-purple-accent tracking-[1px]">LEVEL</span>
            </div>
            <div className="flex-1 flex flex-col gap-2.5">
                <div className="flex justify-between items-center text-[0.9rem]">
                    <span className="text-purple-accent font-bold">XP</span>
                    <span className="text-accent font-bold">2,847/3,000</span>
                </div>
                <div className="flex justify-between items-center text-[0.9rem]">
                    <span className="text-purple-accent font-bold">Streak</span>
                    <span className="text-accent font-bold">12 days</span>
                </div>
            </div>
        </div>
        <div className="mt-4 h-2 bg-black/30 rounded overflow-hidden relative">
            <div className="h-full bg-gradient-to-r from-accent to-purple-accent transition-all duration-800 relative w-[95%] after:content-[''] after:absolute after:top-0 after:left-[-100%] after:w-full after:h-full after:bg-gradient-to-r after:from-transparent after:via-white/30 after:to-transparent"></div>
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
const WelcomeSection = memo(() => {
    const { scrollY } = useScroll()
    const opacity = useTransform(scrollY, [0, 100], [1, 0])
    const scale = useTransform(scrollY, [0, 100], [1, 0.95])
    const y = useTransform(scrollY, [0, 100], [0, -20])

    return (
        <motion.div
            style={{ opacity, scale, y }}
            className="w-[100%] relative mt-[5px] mx-auto mb-[30px] bg-card-gradient rounded-[15px] p-[30px] border border-[#f1c40f33] h-[70px] max-w-[900px] shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden flex items-center before:content-[''] before:absolute before:inset-0 before:bg-inherit"
        >
            <div className="flex items-center gap-[20px] relative z-10">
                <div className="w-[60px] h-[60px] rounded-full overflow-hidden border-[3px] border-accent shadow-[0_0_20px_rgba(241,196,15,0.3)]">
                    <img src="/logoman.jpg?height=60&width=60" alt="User Avatar" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col justify-center">
                    <h2 className="text-[1.8rem] m-0 mb-[5px] text-accent font-bold uppercase tracking-[2px]">
                        Welcome back, <span className="bg-gradient-to-br from-[#f1c40f] via-[#e74c3c] to-[#9b59b6] bg-clip-text text-transparent">PLAYER</span>
                    </h2>
                </div>
            </div>
        </motion.div>
    )
})

WelcomeSection.displayName = "WelcomeSection"

// Memoized Navigation component
const Navigation = memo(({ navigationItems, activeSection, onSectionChange }) => (
    <div className="flex gap-[5px] bg-black/30 p-[5px] rounded-[25px] hidden md:flex">
        {navigationItems.map((item) => (
            <button
                key={item.id}
                className={`flex items-center gap-[8px] px-[20px] py-[10px] bg-transparent border-none text-accent cursor-pointer rounded-[20px] transition-all duration-500 font-orbitron text-[0.9rem] relative overflow-hidden hover:bg-[#f1c40f1a] hover:-translate-y-[2px] ${activeSection === item.id
                    ? "bg-gradient-to-br from-accent to-purple-accent text-primary shadow-[0_5px_20px_rgba(241,196,15,0.4)]"
                    : ""
                    }`}
                onClick={() => onSectionChange(item.id)}
            >
                {/* <FontAwesomeIcon icon={item.icon} className="text-[1.2rem]" /> */}
                <span className="font-medium whitespace-nowrap">{item.label}</span>
            </button>
        ))}
    </div>
))

Navigation.displayName = "Navigation"

// Memoized QuickLinks component
const QuickLinks = memo(({ quickLinks }) => (
    <div className="fixed top-[80px] right-[10px] flex flex-col gap-[12px] p-[10px] rounded-[15px] z-[1000] md:top-[20px]">
        {quickLinks.map((link, index) => (
            <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gradient-to-br from-primary to-secondary text-accent no-underline rounded-full text-[1.2rem] md:text-[1.5rem] flex items-center justify-center w-[40px] h-[40px] md:w-[45px] md:h-[45px] transition-all duration-500 cursor-pointer border-[2px] border-transparent relative overflow-hidden hover:text-black hover:scale-115 hover:rotate-[5deg] hover:shadow-[0_8px_25px_rgba(241,196,15,0.7)] hover:border-accent group"
                title={link.name}
                aria-label={`Open ${link.name}`}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-accent to-purple-accent opacity-0 transition-opacity duration-300 -z-10 group-hover:opacity-100"></div>
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

    const [integrationPanelOpen, setIntegrationPanelOpen] = useState(false)
    const [isAboutOpen, setIsAboutOpen] = useState(false)

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

    const removeNote = useCallback((noteId) => {
        setNotes((prevNotes) => prevNotes.filter((note) => note.id !== noteId))
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

    const toggleIntegrationPanel = useCallback(() => {
        setIntegrationPanelOpen((prev) => !prev)
    }, [])

    const closeIntegrationPanel = useCallback(() => {
        setIntegrationPanelOpen(false)
    }, [])

    // Common card style
    const cardStyle = "h-[100%] bg-black/85 rounded-[15px] shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-[20px] md:p-[25px] drop-shadow-[0_0_10px_black/] transition-all duration-500 border border-[#f1c40f1a] relative overflow-hidden hover:opacity-100 hover:-translate-y-[8px] hover:scale-[1.02] hover:shadow-[0_15px_40px_rgba(0,0,0,0.6)] hover:border-[#f1c40f4d]"

    // Memoized section content with lazy loading
    const renderSectionContent = useMemo(() => {
        switch (activeSection) {
            case "dashboard":
                return (
                    <>
                        <WelcomeSection />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px] w-[100%] md:w-[100%] max-w-[1200px] mx-auto mb-[30px] p-[10px] md:p-[20px]">
                            <section className={`${cardStyle} md:col-span-2`}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px] h-full">
                                    <DailyGoals />
                                    <ProgressVisualization />
                                </div>
                            </section>
                            <section className={cardStyle}>
                                <QuickNotes notes={notes} addNote={addNote} removeNote={removeNote} />
                            </section>
                            <section className={cardStyle}>
                                <PlayerProgress />
                            </section>
                        </div>
                    </>
                )

            case "news":
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px] w-[95%] md:w-[90%] max-w-[1200px] mx-auto mb-[30px] p-[10px] md:p-[20px]">
                        <section className={cardStyle}>
                            <NewsInsights />
                        </section>
                        <section className={cardStyle}>
                            <CurrencyExchange />
                        </section>
                        <section className={cardStyle}>
                            <WeatherWidget />
                        </section>
                    </div>
                )

            case "health":
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px] w-[95%] md:w-[90%] max-w-[1200px] mx-auto mb-[30px] p-[10px] md:p-[20px]">
                        <section className={cardStyle}>
                            <PomodoroTimer />
                        </section>
                        <section className={cardStyle}>
                            <HabitTracker
                                habits={habits}
                                addHabit={addHabit}
                                toggleHabitCompletion={toggleHabitCompletion}
                                removeHabit={removeHabit}
                            />
                        </section>
                        <section className={cardStyle}>
                            <WordOfTheDay />
                        </section>
                        <section className={cardStyle}>
                            <WeatherWidget />
                        </section>
                    </div>
                )

            case "quests":
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px] w-[95%] md:w-[90%] max-w-[1200px] mx-auto mb-[30px] p-[10px] md:p-[20px]">
                        <section className={cardStyle}>
                            <div className="flex justify-center items-start w-full h-full">
                                <DailyGoals />
                            </div>
                        </section>
                        <section className={cardStyle}>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px] w-[95%] md:w-[90%] max-w-[1200px] mx-auto mb-[30px] p-[10px] md:p-[20px]">
                        <section className={`${cardStyle} md:col-span-2`}>
                            <AnalyticsDashboard data={analyticsData} goals={goals} habits={habits} />
                        </section>
                    </div>
                )

            default:
                return null
        }
    }, [activeSection, notes, addNote, habits, addHabit, toggleHabitCompletion, removeHabit, removeNote, analyticsData, goals])

    return (
        <div className="flex flex-col items-center p-0 min-h-screen justify-start relative">
            <div className="fixed inset-0 z-[-1]">
                <img src={backgroundImage} alt="Background" className="w-full h-full object-cover opacity-100" />
                <div className="absolute inset-0 bg-black/50"></div>
            </div>

            <nav className="fixed top-[10px] left-1/2 -translate-x-1/2 w-[calc(100%-20px)] md:w-[calc(100%-200px)] max-w-[1200px] h-[60px] md:h-[70px] rounded-[20px] bg-black/95 border border-white/10 flex items-center justify-between px-[15px] md:px-[30px] z-[1000] shadow-lg">
                <div className="flex items-center">
                    <div className="flex items-center gap-[10px] text-accent font-bold text-[1.2rem] md:text-[1.5rem]">
                        <span className="text-[1.5rem] md:text-[2rem] drop-shadow-[0_0_10px_var(--accent-color)]"></span>
                        <span className="tracking-[3px] drop-shadow-[0_0_15px_var(--accent-color)]">Jōtai</span>
                    </div>
                </div>

                <Navigation
                    navigationItems={navigationItems}
                    activeSection={activeSection}
                    onSectionChange={handleSectionChange}
                />

                <div className="flex gap-[5px] md:gap-[10px] items-center">
                    <button
                        onClick={toggleIntegrationPanel}
                        className="p-2 bg-[#8e44ad]/20 hover:bg-[#8e44ad]/30 border border-[#8e44ad]/30 rounded-xl text-white transition-all hover:scale-105"
                        title="Integrations"
                    >
                        <Zap size={20} className="text-[#8e44ad]" />
                    </button>
                </div>
            </nav>

            <QuickLinks quickLinks={quickLinks} />

            <main className="w-[100%] max-w-[1200px] mx-auto mb-[30px] p-[20px] mt-[90px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeSection}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                    >
                        {renderSectionContent}
                    </motion.div>
                </AnimatePresence>
            </main>

            <Footer onOpenAbout={() => setIsAboutOpen(true)} />

            <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />

            <MusicPlayer />

            <SmartAssistant
                onAddHabit={addHabit}
                onAddNote={addNote}
                onRemoveNote={removeNote}
                onStartPomodoro={startPomodoro}
                goals={goals}
                habits={habits}
                notes={notes}
            />

            {integrationPanelOpen && (
                <IntegrationPanel integrations={integrations} onToggle={toggleIntegration} onClose={closeIntegrationPanel} />
            )
            }
        </div >
    )
}

export default function AppTest() {
    return (
        <QuestProvider>
            <AppContent />
        </QuestProvider>
    )
}
