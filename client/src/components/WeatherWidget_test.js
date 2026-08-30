"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

export default function WeatherWidget() {
    const [weatherData, setWeatherData] = useState(null)
    const [prevWeatherData, setPrevWeatherData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [city, setCity] = useState("New Delhi")
    const [alert, setAlert] = useState(null)

    useEffect(() => {
        const fetchWeatherData = async () => {
            setLoading(true)
            setError(null)

            // Mock Data for Cyberpunk Theme
            const mockData = {
                location: { name: "Neo-Tokyo", country: "Jōtai" },
                current: {
                    temp_c: 24,
                    condition: { text: "Neon Rain", icon: "//cdn.weatherapi.com/weather/64x64/night/296.png" },
                    humidity: 85,
                    wind_kph: 12,
                    feelslike_c: 26,
                    uv: 0
                }
            }

            setTimeout(() => {
                setWeatherData(mockData)
                setLoading(false)
            }, 1000)
        }

        fetchWeatherData()
    }, [])

    const checkForSuddenChange = (prevData, newData) => {
        const tempChange = Math.abs(newData.current.temp_c - prevData.current.temp_c)
        const windChange = Math.abs(newData.current.wind_kph - prevData.current.wind_kph)

        if (tempChange >= 5) {
            triggerAlert("Sudden Temperature Change", `Temperature changed by ${tempChange}°C!`)
        }

        if (windChange >= 20) {
            triggerAlert("High Wind Alert", `Wind speed changed by ${windChange} km/h!`)
        }
    }

    const triggerAlert = (title, message) => {
        setAlert({ title, message })
        setTimeout(() => setAlert(null), 5000)
    }

    return (
        <motion.div
            className="p-6 bg-black/90 rounded-3xl border border-white/10 w-full relative overflow-hidden flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.5)] h-full"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        >
            <div className="flex items-center justify-center mb-6">
                <h3 className="text-[1.5rem] font-bold text-[#8e44ad] m-0 text-center tracking-[2px] uppercase">
                    WEATHER RADAR
                </h3>
            </div>

            <div className="mb-6">
                <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Enter city name"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white font-bold focus:outline-none focus:border-[#8e44ad] focus:bg-white/10 transition-all text-center tracking-wider placeholder-white/30"
                />
            </div>

            <div className="flex-1 flex flex-col justify-center min-h-[200px]">
                <AnimatePresence mode="wait">
                    {loading && !weatherData ? (
                        <motion.div
                            key="loading"
                            className="flex flex-col items-center justify-center gap-3"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="w-8 h-8 border-2 border-[#8e44ad] border-t-transparent rounded-full animate-spin" />
                            <p className="text-white/40 text-sm font-medium">Scanning atmosphere...</p>
                        </motion.div>
                    ) : error ? (
                        <motion.div
                            key="error"
                            className="text-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <p className="text-[#e74c3c] text-sm font-bold mb-4">{error}</p>
                        </motion.div>
                    ) : weatherData ? (
                        <motion.div
                            key={weatherData.location.name}
                            className="flex flex-col gap-4"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.4 }}
                        >
                            <div className="text-center mb-2">
                                <div className="text-white/60 text-sm font-bold uppercase tracking-widest mb-1">
                                    {weatherData.location.name}, {weatherData.location.country}
                                </div>
                                <div className="text-5xl font-black text-white mb-2 tracking-tight flex items-center justify-center gap-2">
                                    <img
                                        src={`https:${weatherData.current.condition.icon}`}
                                        alt={weatherData.current.condition.text}
                                        className="w-12 h-12"
                                    />
                                    {weatherData.current.temp_c}°C
                                </div>
                                <div className="text-[#f1c40f] text-sm font-bold uppercase tracking-wider">
                                    {weatherData.current.condition.text}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                                    <div className="text-white/40 text-xs font-bold uppercase mb-1">Humidity</div>
                                    <div className="text-white font-mono">{weatherData.current.humidity}%</div>
                                </div>
                                <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                                    <div className="text-white/40 text-xs font-bold uppercase mb-1">Wind</div>
                                    <div className="text-white font-mono">{weatherData.current.wind_kph} km/h</div>
                                </div>
                                <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                                    <div className="text-white/40 text-xs font-bold uppercase mb-1">Feels Like</div>
                                    <div className="text-white font-mono">{weatherData.current.feelslike_c}°C</div>
                                </div>
                                <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                                    <div className="text-white/40 text-xs font-bold uppercase mb-1">UV Index</div>
                                    <div className="text-white font-mono">{weatherData.current.uv}</div>
                                </div>
                            </div>
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {alert && (
                    <motion.div
                        className="absolute bottom-4 left-4 right-4 bg-[#e74c3c]/90 text-white p-4 rounded-xl border border-[#e74c3c] shadow-lg backdrop-blur-md z-50"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                    >
                        <h4 className="font-bold text-sm uppercase tracking-wider mb-1 flex items-center gap-2">
                            ⚠️ {alert.title}
                        </h4>
                        <p className="text-xs font-medium opacity-90">{alert.message}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
