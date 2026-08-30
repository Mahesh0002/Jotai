"use client"

import { useState } from "react"
import { BarChart3, Target, TrendingUp, Clock, Award, Activity, Zap } from "lucide-react"
import "./AnalyticsDashboard.css"

function EnhancedAnalyticsDashboard({
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

  const getDayLabel = (index) => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    const today = new Date().getDay()
    const dayIndex = (today - 6 + index) % 7
    return days[dayIndex < 0 ? dayIndex + 7 : dayIndex]
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "goals", label: "Objectives", icon: Target },
    { id: "habits", label: "Habits", icon: TrendingUp },
    { id: "focus", label: "Focus", icon: Clock },
  ]

  return (
    <div className="enhanced-analytics-dashboard">
      <div className="analytics-header">
        <div className="header-info">
          <Activity className="header-icon" />
          <div>
            <h2 className="analytics-title">ANALYTICS CENTER</h2>
            <p className="analytics-subtitle">PERFORMANCE METRICS</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
            >
              <tab.icon className="tab-icon" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="analytics-content">
        {activeTab === "overview" && (
          <div className="overview-tab">
            {/* Key Metrics */}
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-header">
                  <div>
                    <p className="metric-label">COMPLETION RATE</p>
                    <p className="metric-value">{completionRate}%</p>
                  </div>
                  <Award className="metric-icon" />
                </div>
                <div className="metric-progress">
                  <div className="metric-progress-fill" style={{ width: `${completionRate}%` }} />
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-header">
                  <div>
                    <p className="metric-label">ACTIVE STREAK</p>
                    <p className="metric-value">{data.streaks}</p>
                  </div>
                  <Zap className="metric-icon" />
                </div>
                <p className="metric-subtitle">days consecutive</p>
              </div>

              <div className="metric-card">
                <div className="metric-header">
                  <div>
                    <p className="metric-label">ACTIVE GOALS</p>
                    <p className="metric-value">{activeGoals}</p>
                  </div>
                  <Target className="metric-icon" />
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-header">
                  <div>
                    <p className="metric-label">FOCUS TIME</p>
                    <p className="metric-value">{formatTime(data.focusTime)}</p>
                  </div>
                  <Clock className="metric-icon" />
                </div>
              </div>
            </div>

            {/* Activity Chart */}
            <div className="activity-chart">
              <h3 className="chart-title">WEEKLY ACTIVITY</h3>
              <div className="chart-container">
                {data.dailyActivity.map((value, index) => (
                  <div key={index} className="chart-bar-wrapper">
                    <div className="chart-bar">
                      <div
                        className="chart-bar-fill"
                        style={{
                          height: `${Math.max((value / Math.max(...data.dailyActivity)) * 100, 5)}%`,
                        }}
                      >
                        {value > 0 && <span className="chart-value">{value}</span>}
                      </div>
                    </div>
                    <span className="chart-label">{getDayLabel(index)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "goals" && (
          <div className="goals-tab">
            <div className="goals-stats">
              <div className="stat-card">
                <p className="stat-label">TOTAL</p>
                <p className="stat-value">{data.totalGoalsCreated}</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">COMPLETED</p>
                <p className="stat-value completed">{data.completedGoals}</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">ACTIVE</p>
                <p className="stat-value">{activeGoals}</p>
              </div>
            </div>

            <div className="goals-list-section">
              <h3 className="section-title">RECENT OBJECTIVES</h3>
              <div className="goals-list">
                {goals.slice(0, 5).map((goal) => (
                  <div key={goal.id} className="goal-item">
                    <span className={`goal-text ${goal.completed ? "completed" : ""}`}>{goal.title}</span>
                    <div className={`goal-badge ${goal.completed ? "completed" : ""}`}>
                      {goal.completed ? "Complete" : `${goal.progress}%`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "habits" && (
          <div className="habits-tab">
            <div className="habits-stats">
              <div className="stat-card">
                <p className="stat-label">ACTIVE HABITS</p>
                <p className="stat-value">{activeHabits}</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">STREAK</p>
                <p className="stat-value completed">{data.streaks}</p>
              </div>
            </div>

            <div className="habits-list-section">
              <h3 className="section-title">HABIT TRACKER</h3>
              <div className="habits-list">
                {habits.map((habit) => (
                  <div key={habit.id} className="habit-item">
                    <span className="habit-text">{habit.text}</span>
                    <div className="habit-info">
                      <div className="frequency-badge">{habit.frequency}</div>
                      <div className={`status-dot ${habit.completed ? "completed" : ""}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "focus" && (
          <div className="focus-tab">
            <div className="focus-main-stat">
              <h3 className="focus-title">TOTAL FOCUS TIME</h3>
              <p className="focus-value">{formatTime(data.focusTime)}</p>
              <p className="focus-subtitle">this week</p>
            </div>

            <div className="focus-stats">
              <div className="stat-card">
                <p className="stat-label">SESSIONS</p>
                <p className="stat-value">{Math.ceil(data.focusTime / 25)}</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">DAILY AVG</p>
                <p className="stat-value">{data.focusTime > 0 ? formatTime(Math.round(data.focusTime / 7)) : "0m"}</p>
              </div>
            </div>

            <div className="focus-tips">
              <h3 className="section-title">FOCUS OPTIMIZATION</h3>
              <div className="tips-list">
                <div className="tip-item">
                  <div className="tip-bullet" />
                  <span>Take 5-minute breaks between sessions</span>
                </div>
                <div className="tip-item">
                  <div className="tip-bullet" />
                  <span>Maintain hydration during focus time</span>
                </div>
                <div className="tip-item">
                  <div className="tip-bullet" />
                  <span>Set clear objectives before starting</span>
                </div>
                <div className="tip-item">
                  <div className="tip-bullet" />
                  <span>Eliminate environmental distractions</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EnhancedAnalyticsDashboard
