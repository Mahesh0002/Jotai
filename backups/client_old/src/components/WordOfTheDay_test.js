"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Volume2, BookOpen, ChevronDown, ChevronUp, RefreshCw } from "lucide-react"

export default function WordOfTheDay() {
    const [kanjiData, setKanjiData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [isExpanded, setIsExpanded] = useState(false)

    // Fallback data in case API fails or for initial load
    const fallbackKanji = [
        {
            kanji: "愛",
            grade: 4,
            meanings: ["love", "affection", "favourite"],
            kun_readings: ["いと.しい"],
            on_readings: ["アイ"],
            name_readings: ["あ", "あし", "え", "かな", "まな", "めぐ", "めぐみ", "よし"],
        },
        {
            kanji: "勇",
            grade: 4,
            meanings: ["courage", "cheer up", "be in high spirits", "bravery", "heroism"],
            kun_readings: ["いさ.む"],
            on_readings: ["ユウ"],
            name_readings: ["いさ", "いさお", "いさみ", "そよ", "たけ", "と", "はや", "よ"],
        },
        {
            kanji: "夢",
            grade: 5,
            meanings: ["dream", "vision", "illusion"],
            kun_readings: ["ゆめ", "ゆめ.みる", "くら.い"],
            on_readings: ["ム"],
            name_readings: ["あゆむ"],
        },
        {
            kanji: "光",
            grade: 2,
            meanings: ["ray", "light"],
            kun_readings: ["ひか.る", "ひかり"],
            on_readings: ["コウ"],
            name_readings: ["あき", "あきら", "こ", "てる", "ひこ", "み", "みつ"],
        },
    ]

    const fetchKanjiDetails = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            // Using kanjiapi.dev which is free and reliable
            // First, get a random grade 1-6 kanji to keep it relatively common
            const grade = Math.floor(Math.random() * 6) + 1
            const listResponse = await fetch(`https://kanjiapi.dev/v1/kanji/grade-${grade}`)

            if (!listResponse.ok) throw new Error("Failed to fetch kanji list")

            const kanjiList = await listResponse.json()
            const randomKanji = kanjiList[Math.floor(Math.random() * kanjiList.length)]

            const detailResponse = await fetch(`https://kanjiapi.dev/v1/kanji/${randomKanji}`)

            if (!detailResponse.ok) throw new Error("Failed to fetch kanji details")

            const data = await detailResponse.json()
            setKanjiData(data)
        } catch (err) {
            console.error("Error fetching Kanji:", err)
            setError(err.message || "Failed to fetch Kanji")
            // Fallback to a random local kanji
            const randomFallback = fallbackKanji[Math.floor(Math.random() * fallbackKanji.length)]
            setKanjiData(randomFallback)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchKanjiDetails()
    }, [fetchKanjiDetails])

    const [audioUrl, setAudioUrl] = useState(null)
    const audioRef = useRef(null)
    const DEEPGRAM_API_KEY = process.env.REACT_APP_DEEPGRAM_API_KEY

    const speakText = useCallback(async (text) => {
        if (!text) return
        console.log("🔊 Attempting to speak with Deepgram:", text)

        try {
            if (!DEEPGRAM_API_KEY) {
                console.warn("⚠️ Deepgram API key is missing")
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
                console.error("❌ Deepgram TTS error:", response.status, await response.text())
                return
            }

            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            setAudioUrl(url)

            if (audioRef.current) {
                audioRef.current.src = url
                audioRef.current.play().catch((e) => console.error("❌ Audio play error:", e))
                console.log("▶️ Playing Deepgram audio")
            }
        } catch (error) {
            console.error("❌ Error generating audio:", error)
        }
    }, [DEEPGRAM_API_KEY])

    return (
        <motion.div
            className="p-6 bg-black/90 rounded-3xl border border-white/10 w-full relative overflow-hidden flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.5)] h-full"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        >
            <audio ref={audioRef} className="hidden" />
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <BookOpen className="text-[#8e44ad]" size={20} />
                    <h3 className="text-sm font-bold text-white tracking-[2px] uppercase">
                        DAILY LORE
                    </h3>
                </div>
                <button
                    onClick={fetchKanjiDetails}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                    title="New Word"
                >
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center min-h-[200px]">
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            key="loading"
                            className="flex flex-col items-center justify-center gap-3"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="w-8 h-8 border-2 border-[#8e44ad] border-t-transparent rounded-full animate-spin" />
                            <p className="text-white/40 text-sm font-medium">Deciphering scrolls...</p>
                        </motion.div>
                    ) : kanjiData ? (
                        <motion.div
                            key={kanjiData.kanji}
                            className="w-full flex flex-col items-center"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.4 }}
                        >
                            {/* Main Kanji Display */}
                            <div className="relative group cursor-pointer mb-6" onClick={() => speakText(kanjiData.kanji)}>
                                <div className="text-[6rem] leading-none font-black text-white drop-shadow-[0_0_15px_rgba(142,68,173,0.5)] transition-transform group-hover:scale-110 duration-300">
                                    {kanjiData.kanji}
                                </div>
                                <div className="absolute -right-4 -bottom-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 p-2 rounded-full backdrop-blur-sm">
                                    <Volume2 size={20} className="text-[#f1c40f]" />
                                </div>
                            </div>

                            {/* Meanings */}
                            <div className="text-center mb-6">
                                <h4 className="text-[#f1c40f] font-bold text-lg uppercase tracking-wide mb-1">
                                    {kanjiData.meanings[0]}
                                </h4>
                                <p className="text-white/60 text-sm">
                                    {kanjiData.meanings.slice(1, 4).join(", ")}
                                </p>
                            </div>

                            {/* Readings Grid */}
                            <div className="w-full grid grid-cols-2 gap-4 mb-4">
                                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                    <div className="text-white/40 text-xs font-bold uppercase mb-2">Kun-yomi</div>
                                    <div className="flex flex-wrap gap-2">
                                        {kanjiData.kun_readings.slice(0, 3).map((reading, i) => (
                                            <span
                                                key={i}
                                                className="text-white font-medium text-sm bg-white/5 px-2 py-1 rounded cursor-pointer hover:bg-white/10 hover:text-[#8e44ad] transition-colors"
                                                onClick={() => speakText(reading)}
                                            >
                                                {reading}
                                            </span>
                                        ))}
                                        {kanjiData.kun_readings.length === 0 && <span className="text-white/20 text-sm">-</span>}
                                    </div>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                    <div className="text-white/40 text-xs font-bold uppercase mb-2">On-yomi</div>
                                    <div className="flex flex-wrap gap-2">
                                        {kanjiData.on_readings.slice(0, 3).map((reading, i) => (
                                            <span
                                                key={i}
                                                className="text-white font-medium text-sm bg-white/5 px-2 py-1 rounded cursor-pointer hover:bg-white/10 hover:text-[#f1c40f] transition-colors"
                                                onClick={() => speakText(reading)}
                                            >
                                                {reading}
                                            </span>
                                        ))}
                                        {kanjiData.on_readings.length === 0 && <span className="text-white/20 text-sm">-</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="w-full overflow-hidden"
                                    >
                                        <div className="pt-2 pb-4 space-y-3 border-t border-white/10 mt-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-white/40 text-sm">JLPT Level</span>
                                                <span className="text-white font-bold">N{5 - Math.floor(kanjiData.grade / 2)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-white/40 text-sm">Stroke Count</span>
                                                <span className="text-white font-bold">{kanjiData.stroke_count || "N/A"}</span>
                                            </div>
                                            {kanjiData.name_readings && kanjiData.name_readings.length > 0 && (
                                                <div>
                                                    <div className="text-white/40 text-xs font-bold uppercase mb-1">Name Readings</div>
                                                    <p className="text-white/80 text-sm leading-relaxed">
                                                        {kanjiData.name_readings.slice(0, 5).join(", ")}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ) : (
                        <div className="text-center text-white/40">Failed to load data</div>
                    )}
                </AnimatePresence>
            </div>

            <motion.button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full py-3 flex items-center justify-center gap-2 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all text-xs font-bold uppercase tracking-wider border border-transparent hover:border-white/10"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
            >
                {isExpanded ? (
                    <>
                        Less Details <ChevronUp size={14} />
                    </>
                ) : (
                    <>
                        More Details <ChevronDown size={14} />
                    </>
                )}
            </motion.button>
        </motion.div >
    )
}
