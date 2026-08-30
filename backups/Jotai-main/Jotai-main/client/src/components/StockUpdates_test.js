"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

export default function StockUpdates() {
    const stockSymbols = ["GOOGL", "NVDA", "TSLA", "AAPL", "MSFT", "AMZN", "META"]

    const [stockData, setStockData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [symbol, setSymbol] = useState(stockSymbols[0])

    const fetchStockData = async () => {
        setLoading(true)
        setError(null)

        // Mock Data for Cyberpunk Theme
        const mockPrices = {
            GOOGL: { price: 2800.50, change: 15.20, percent: 0.54 },
            NVDA: { price: 950.00, change: 45.30, percent: 5.01 },
            TSLA: { price: 1200.00, change: -10.50, percent: -0.87 },
            AAPL: { price: 175.30, change: 2.10, percent: 1.21 },
            MSFT: { price: 340.20, change: 5.40, percent: 1.61 },
            AMZN: { price: 3500.00, change: -25.00, percent: -0.71 },
            META: { price: 330.10, change: 8.90, percent: 2.77 }
        }

        const data = mockPrices[symbol] || mockPrices.GOOGL

        setTimeout(() => {
            setStockData({
                symbol: symbol,
                price: data.price,
                change: data.change.toFixed(2),
                percentChange: data.percent.toFixed(2),
                open: data.price - data.change,
                high: data.price + 10,
                low: data.price - 10,
                volume: 15000000,
            })
            setLoading(false)
        }, 1000)
    }

    useEffect(() => {
        fetchStockData()
        // eslint-disable-next-line
    }, [symbol])

    return (
        <motion.div
            className="p-6 bg-black/90 rounded-3xl border border-white/10 w-full relative overflow-hidden flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.5)] h-full"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        >
            <div className="flex items-center justify-center mb-6">
                <h3 className="text-[1.5rem] font-bold text-[#8e44ad] m-0 text-center tracking-[2px] uppercase">
                    MARKET WATCH
                </h3>
            </div>

            <div className="mb-6">
                <select
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white font-bold focus:outline-none focus:border-[#8e44ad] focus:bg-white/10 transition-all cursor-pointer appearance-none text-center tracking-wider"
                >
                    {stockSymbols.map((stock) => (
                        <option key={stock} value={stock} className="bg-black text-white">
                            {stock}
                        </option>
                    ))}
                </select>
            </div>

            <div className="flex-1 flex flex-col justify-center min-h-[200px]">
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
                            <p className="text-white/40 text-sm font-medium">Fetching market data...</p>
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
                            <button
                                onClick={fetchStockData}
                                className="px-4 py-2 bg-[#e74c3c]/10 text-[#e74c3c] rounded-lg border border-[#e74c3c]/30 hover:bg-[#e74c3c]/20 transition-colors text-xs font-bold uppercase tracking-wider"
                            >
                                Retry
                            </button>
                        </motion.div>
                    ) : stockData ? (
                        <motion.div
                            key={stockData.symbol}
                            className="flex flex-col gap-4"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.4 }}
                        >
                            <div className="text-center mb-2">
                                <div className="text-4xl font-black text-white mb-1 tracking-tight">
                                    ${Number(stockData.price).toFixed(2)}
                                </div>
                                <div
                                    className={`text-sm font-bold flex items-center justify-center gap-1 ${Number(stockData.change) >= 0 ? "text-[#2ecc71]" : "text-[#e74c3c]"
                                        }`}
                                >
                                    {Number(stockData.change) >= 0 ? "+" : ""}
                                    {stockData.change} ({stockData.percentChange}%)
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                                    <div className="text-white/40 text-xs font-bold uppercase mb-1">Open</div>
                                    <div className="text-white font-mono">${Number(stockData.open).toFixed(2)}</div>
                                </div>
                                <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                                    <div className="text-white/40 text-xs font-bold uppercase mb-1">Volume</div>
                                    <div className="text-white font-mono">
                                        {(Number(stockData.volume) / 1000000).toFixed(1)}M
                                    </div>
                                </div>
                                <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                                    <div className="text-white/40 text-xs font-bold uppercase mb-1">High</div>
                                    <div className="text-[#2ecc71] font-mono">${Number(stockData.high).toFixed(2)}</div>
                                </div>
                                <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                                    <div className="text-white/40 text-xs font-bold uppercase mb-1">Low</div>
                                    <div className="text-[#e74c3c] font-mono">${Number(stockData.low).toFixed(2)}</div>
                                </div>
                            </div>
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </div>

            <motion.button
                onClick={fetchStockData}
                className="w-full mt-6 py-3 bg-[#8e44ad]/10 text-[#8e44ad] rounded-xl border border-[#8e44ad]/30 hover:bg-[#8e44ad]/20 transition-all text-sm font-bold uppercase tracking-wider"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                Refresh Data
            </motion.button>
        </motion.div>
    )
}
