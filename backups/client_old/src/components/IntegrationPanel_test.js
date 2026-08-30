"use client"

import { useState, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Check, Loader, ExternalLink, Settings, Zap, Search } from "lucide-react"

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
        [integrations]
    )

    // Filter integrations based on search
    const filteredIntegrations = useMemo(() => {
        if (!searchTerm) return integrationData
        return integrationData.filter(
            (integration) =>
                integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                integration.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                integration.category.toLowerCase().includes(searchTerm.toLowerCase())
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
        [connecting, onToggle]
    )

    // Stats calculation
    const stats = useMemo(() => {
        const connected = integrationData.filter((i) => i.status === "connected").length
        const total = integrationData.length
        return { connected, total, percentage: (connected / total) * 100 }
    }, [integrationData])

    return (
        <motion.div
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(142,68,173,0.2)] overflow-hidden max-h-[90vh] flex flex-col"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/40">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-[#8e44ad]/20 rounded-xl border border-[#8e44ad]/30">
                            <Zap className="text-[#8e44ad]" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-wide">INTEGRATIONS</h2>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-white/40 font-medium">
                                    {stats.connected}/{stats.total} CONNECTED
                                </span>
                                <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-[#8e44ad] to-[#f1c40f]"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${stats.percentage}%` }}
                                        transition={{ duration: 1, delay: 0.5 }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-white"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Controls */}
                <div className="p-6 pb-2">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                        <input
                            type="text"
                            placeholder="Search integrations..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#8e44ad]/50 transition-colors"
                        />
                    </div>
                    <p className="text-white/40 text-sm mt-4 ml-1">
                        Connect your favorite services to enhance your productivity dashboard.
                    </p>
                </div>

                {/* Grid */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto custom-scrollbar">
                    <AnimatePresence mode="popLayout">
                        {filteredIntegrations.map((integration) => {
                            const isConnecting = connecting && activeIntegration === integration.id
                            const isConnected = integration.status === "connected"

                            return (
                                <motion.div
                                    key={integration.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className={`p-5 rounded-2xl border transition-all relative overflow-hidden group ${isConnected
                                            ? "bg-[#8e44ad]/5 border-[#8e44ad]/30"
                                            : "bg-white/5 border-white/5 hover:border-white/10"
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
                                                style={{ backgroundColor: integration.color }}
                                            >
                                                {integration.icon}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white">{integration.name}</h3>
                                                <span className="text-[10px] uppercase tracking-wider text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
                                                    {integration.category}
                                                </span>
                                            </div>
                                        </div>
                                        {isConnected && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="bg-[#2ecc71] text-black p-1 rounded-full"
                                            >
                                                <Check size={12} strokeWidth={3} />
                                            </motion.div>
                                        )}
                                    </div>

                                    <p className="text-sm text-white/60 mb-4 line-clamp-2 h-10">
                                        {integration.description}
                                    </p>

                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {integration.features.map((feature, index) => (
                                            <span
                                                key={index}
                                                className="text-[10px] text-white/40 bg-white/5 px-2 py-1 rounded border border-white/5"
                                            >
                                                {feature}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-2 mt-auto">
                                        <button
                                            onClick={() => handleConnect(integration.id)}
                                            disabled={connecting && activeIntegration !== integration.id}
                                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${isConnected
                                                    ? "bg-[#2ecc71]/10 text-[#2ecc71] hover:bg-[#2ecc71]/20"
                                                    : "bg-white/10 text-white hover:bg-white/20 hover:scale-[1.02]"
                                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            {isConnecting ? (
                                                <>
                                                    <Loader size={14} className="animate-spin" />
                                                    Connecting...
                                                </>
                                            ) : isConnected ? (
                                                <>
                                                    <Check size={14} />
                                                    Connected
                                                </>
                                            ) : (
                                                <>
                                                    <ExternalLink size={14} />
                                                    Connect
                                                </>
                                            )}
                                        </button>
                                        {isConnected && (
                                            <button className="p-2.5 rounded-xl bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-colors">
                                                <Settings size={18} />
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 bg-black/40 flex justify-between items-center text-xs text-white/30">
                    <div className="flex items-center gap-2">
                        <span>🔒 End-to-end encrypted</span>
                    </div>
                    <a href="#" className="hover:text-[#8e44ad] transition-colors">
                        View Documentation
                    </a>
                </div>
            </motion.div>
        </motion.div>
    )
}

export default IntegrationPanel
