"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Newspaper, ExternalLink, ChevronDown, ChevronUp, RefreshCw, AlertCircle } from "lucide-react"

export default function NewsFeed() {
    const [articles, setArticles] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [isExpanded, setIsExpanded] = useState(false)

    const apiKey = process.env.REACT_APP_NEWS_API_KEY

    const filterArticles = (articles, prevArticles) => {
        const filtered = articles.filter(
            (article) =>
                article.title &&
                article.description &&
                !article.title.toLowerCase().includes("removed") &&
                !article.description.toLowerCase().includes("removed"),
        )

        return filtered.filter((article) => !prevArticles.some((prev) => prev.title === article.title))
    }

    const fetchNews = useCallback(async () => {
        if (!apiKey) {
            setError("API key is missing! Please check your environment variables.")
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            const response = await fetch(
                `https://newsapi.org/v2/everything?q=technology&domains=cnn.com,bbc.com,techcrunch.com&sortBy=publishedAt&pageSize=5&apiKey=${apiKey}`,
            )

            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`)

            const data = await response.json()
            if (!data.articles || data.articles.length === 0) throw new Error("No articles found.")

            const newArticles = filterArticles(data.articles, articles)
            setArticles((prevArticles) => (newArticles.length > 0 ? [...prevArticles, ...newArticles] : prevArticles))
            setError(null)
        } catch (err) {
            console.error("Error fetching news:", err)
            setError(`Failed to fetch news. ${err.message}`)
        } finally {
            setLoading(false)
        }
    }, [apiKey, articles])

    useEffect(() => {
        fetchNews()
        const interval = setInterval(fetchNews, 1800000) // Refresh every 30 min
        return () => clearInterval(interval)
    }, [])

    const handleRetry = () => {
        setLoading(true)
        setError(null)
        fetchNews()
    }

    const toggleExpand = () => setIsExpanded(!isExpanded)

    const displayedArticles = isExpanded ? articles : articles.slice(0, 1)

    return (
        <motion.div
            className="p-6 bg-black/90 rounded-3xl border border-white/10 w-full relative overflow-hidden flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
        >
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-[#8e44ad] tracking-wider">NEWS DISPATCH</h2>
                    <p className="text-xs text-white/40 font-medium tracking-widest uppercase">Latest Tech Updates</p>
                </div>
                <button
                    onClick={handleRetry}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                    title="Refresh News"
                >
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            <AnimatePresence mode="wait">
                {loading && articles.length === 0 ? (
                    <motion.div
                        key="loading"
                        className="flex flex-col items-center justify-center py-12"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="w-8 h-8 border-2 border-[#8e44ad] border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-white/40 text-sm">Fetching latest updates...</p>
                    </motion.div>
                ) : error ? (
                    <motion.div
                        key="error"
                        className="flex flex-col items-center justify-center py-8 text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <AlertCircle className="text-[#e74c3c] mb-3" size={32} />
                        <p className="text-white/80 mb-4 max-w-xs">{error}</p>
                        <button
                            onClick={handleRetry}
                            className="px-4 py-2 bg-[#e74c3c]/20 text-[#e74c3c] rounded-lg border border-[#e74c3c]/30 hover:bg-[#e74c3c]/30 transition-colors text-sm font-bold"
                        >
                            Retry Connection
                        </button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="content"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col gap-4"
                    >
                        <div className="flex flex-col gap-4">
                            <AnimatePresence mode="popLayout">
                                {displayedArticles.map((article, index) => (
                                    <motion.article
                                        key={`${article.url}-${index}`}
                                        className="group relative bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition-colors"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        layout
                                    >
                                        <div className="flex flex-col md:flex-row gap-4 p-4">
                                            {article.urlToImage && (
                                                <div className="w-full md:w-32 h-32 shrink-0 rounded-lg overflow-hidden bg-black/50">
                                                    <img
                                                        src={article.urlToImage}
                                                        alt={article.title}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                </div>
                                            )}
                                            <div className="flex-1 flex flex-col justify-between">
                                                <div>
                                                    <a
                                                        href={article.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-white font-bold text-lg leading-tight mb-2 block hover:text-[#f1c40f] transition-colors line-clamp-2"
                                                    >
                                                        {article.title}
                                                    </a>
                                                    <p className="text-white/60 text-sm line-clamp-2 mb-3">
                                                        {article.description}
                                                    </p>
                                                </div>
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-xs text-white/30 font-mono">
                                                        {new Date(article.publishedAt).toLocaleDateString()}
                                                    </span>
                                                    <a
                                                        href={article.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1 text-xs font-bold text-[#8e44ad] hover:text-[#9b59b6] transition-colors"
                                                    >
                                                        READ MORE <ExternalLink size={12} />
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.article>
                                ))}
                            </AnimatePresence>
                        </div>

                        {articles.length > 1 && (
                            <motion.button
                                onClick={toggleExpand}
                                className="w-full py-3 flex items-center justify-center gap-2 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all text-sm font-bold uppercase tracking-wider border border-transparent hover:border-white/10"
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                            >
                                {isExpanded ? (
                                    <>
                                        Show Less <ChevronUp size={16} />
                                    </>
                                ) : (
                                    <>
                                        Show More ({articles.length - 1} hidden) <ChevronDown size={16} />
                                    </>
                                )}
                            </motion.button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
