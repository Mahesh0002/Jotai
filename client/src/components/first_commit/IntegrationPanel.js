"use client"

import { useState, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Check, Loader, ExternalLink, Settings, Zap } from "lucide-react"
import "./IntegrationPanel.css"

const IntegrationPanel = ({ integrations, onToggle, onClose }) => {
  const [connecting, setConnecting] = useState(false)
  const [activeIntegration, setActiveIntegration] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Enhanced integration data with more details
  const integrationData = useMemo(
    () => [
      {
        id: "google",
        name: "Google Calendar",
        description: "Sync your goals with Google Calendar events",
        icon: "G",
        color: "#4285f4",
        category: "productivity",
        features: ["Event sync", "Deadline tracking", "Meeting integration"],
        status: integrations.google ? "connected" : "disconnected",
      },
      {
        id: "notion",
        name: "Notion",
        description: "Import tasks and notes from Notion workspace",
        icon: "N",
        color: "#000000",
        category: "productivity",
        features: ["Task import", "Database sync", "Note integration"],
        status: integrations.notion ? "connected" : "disconnected",
      },
      {
        id: "spotify",
        name: "Spotify",
        description: "Control music during focus sessions",
        icon: "S",
        color: "#1db954",
        category: "entertainment",
        features: ["Music control", "Focus playlists", "Now playing"],
        status: integrations.spotify ? "connected" : "disconnected",
      },
      {
        id: "github",
        name: "GitHub",
        description: "Track coding projects and repository activity",
        icon: "G",
        color: "#333333",
        category: "development",
        features: ["Commit tracking", "Issue sync", "PR notifications"],
        status: integrations.github ? "connected" : "disconnected",
      },
      {
        id: "trello",
        name: "Trello",
        description: "Sync boards and cards with your goals",
        icon: "T",
        color: "#0079bf",
        category: "productivity",
        features: ["Board sync", "Card import", "Progress tracking"],
        status: integrations.trello ? "connected" : "disconnected",
      },
    ],
    [integrations],
  )

  // Filter integrations based on search
  const filteredIntegrations = useMemo(() => {
    if (!searchTerm) return integrationData
    return integrationData.filter(
      (integration) =>
        integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        integration.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        integration.category.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [integrationData, searchTerm])

  // Enhanced connection handler with better UX
  const handleConnect = useCallback(
    async (integrationId) => {
      if (connecting) return

      setConnecting(true)
      setActiveIntegration(integrationId)

      try {
        // Simulate API call with realistic timing
        await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000))

        onToggle(integrationId)

        // Success feedback
        setTimeout(() => {
          setConnecting(false)
          setActiveIntegration(null)
        }, 500)
      } catch (error) {
        console.error("Integration connection failed:", error)
        setConnecting(false)
        setActiveIntegration(null)
      }
    },
    [connecting, onToggle],
  )

  // Stats calculation
  const stats = useMemo(() => {
    const connected = integrationData.filter((i) => i.status === "connected").length
    const total = integrationData.length
    return { connected, total, percentage: (connected / total) * 100 }
  }, [integrationData])

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.2 },
    },
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 25 },
    },
  }

  return (
    <motion.div
      className="integration-panel-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="integration-panel"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Enhanced Header */}
        <div className="integration-header">
          <div className="header-content">
            <div className="header-title">
              <Zap className="header-icon" />
              <h2>Integrations</h2>
            </div>
            <div className="header-stats">
              <span className="stats-text">
                {stats.connected}/{stats.total} connected
              </span>
              <div className="stats-bar">
                <motion.div
                  className="stats-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.percentage}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
            </div>
          </div>
          <motion.button
            className="close-button"
            onClick={onClose}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
          >
            <X size={20} />
          </motion.button>
        </div>

        {/* Search and Description */}
        <motion.div
          className="integration-controls"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="search-container">
            <input
              type="text"
              placeholder="Search integrations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <p className="integration-description">
            Connect your favorite services to enhance your productivity dashboard.
          </p>
        </motion.div>

        {/* Enhanced Integrations Grid */}
        <motion.div
          className="integrations-grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <AnimatePresence mode="popLayout">
            {filteredIntegrations.map((integration) => {
              const isConnecting = connecting && activeIntegration === integration.id
              const isConnected = integration.status === "connected"

              return (
                <motion.div
                  key={integration.id}
                  className={`integration-card ${integration.category} ${isConnected ? "connected" : ""}`}
                  variants={cardVariants}
                  layout
                  whileHover={{
                    scale: 1.02,
                    y: -5,
                    boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="card-header">
                    <div
                      className={`integration-icon ${integration.id}`}
                      style={{ backgroundColor: integration.color }}
                    >
                      {integration.icon}
                    </div>
                    <div className="integration-details">
                      <h3>{integration.name}</h3>
                      <p>{integration.description}</p>
                    </div>
                    {isConnected && (
                      <motion.div
                        className="connected-badge"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500 }}
                      >
                        <Check size={12} />
                      </motion.div>
                    )}
                  </div>

                  <div className="card-features">
                    {integration.features.map((feature, index) => (
                      <span key={index} className="feature-tag">
                        {feature}
                      </span>
                    ))}
                  </div>

                  <div className="card-actions">
                    <motion.button
                      className={`integration-button ${isConnected ? "connected" : ""}`}
                      onClick={() => handleConnect(integration.id)}
                      disabled={connecting && activeIntegration !== integration.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {isConnecting ? (
                        <motion.div
                          className="connecting-state"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        >
                          <Loader size={16} />
                          <span>Connecting...</span>
                        </motion.div>
                      ) : isConnected ? (
                        <div className="connected-state">
                          <Check size={16} />
                          <span>Connected</span>
                        </div>
                      ) : (
                        <div className="disconnected-state">
                          <ExternalLink size={16} />
                          <span>Connect</span>
                        </div>
                      )}
                    </motion.button>

                    {isConnected && (
                      <motion.button
                        className="settings-button"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Settings size={16} />
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>

        {/* Enhanced Footer */}
        <motion.div
          className="integration-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="footer-content">
            <p>
              Need help with integrations?
              <motion.a href="#" className="help-link" whileHover={{ scale: 1.05 }}>
                View documentation
              </motion.a>
            </p>
            <div className="security-note">
              <span>🔒 All connections are secure and encrypted</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

export default IntegrationPanel
