"use client"

import { motion } from "framer-motion"
import { Github, Twitter, Globe, Heart } from "lucide-react"

export default function Footer({ onOpenAbout }) {
    const currentYear = new Date().getFullYear()

    return (
        <motion.footer
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="w-full max-w-[1200px] mx-auto mt-12 mb-8 px-6"
        >
            <div className="relative p-8 bg-black/80 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden">
                {/* Cyberpunk Grid Background */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(142,68,173,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(142,68,173,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    {/* Brand Section */}
                    <div className="flex flex-col items-center md:items-start gap-2">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8e44ad] to-[#2c3e50] flex items-center justify-center shadow-[0_0_10px_rgba(142,68,173,0.5)] border border-[#b7950b]">
                                <img src="./logo_dark.png" alt="" className="w-full h-full object-cover rounded-lg" />
                            </div>
                            <span className="text-xl font-bold tracking-[3px] text-white">JŌTAI</span>
                        </div>
                        <p className="text-xs text-white/40 font-mono tracking-wider uppercase">
                            System Version 2.0.4 • <span className="text-[#2ecc71]">Online</span>
                        </p>
                    </div>

                    {/* Links Section */}
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => {
                                console.log("About button clicked")
                                onOpenAbout()
                            }}
                            className="text-xs text-white/60 hover:text-white font-bold uppercase tracking-wider transition-colors cursor-pointer relative z-50"
                        >
                            About Project
                        </button>
                        <div className="h-4 w-px bg-white/10" />
                        <a href="#" className="text-white/40 hover:text-[#8e44ad] transition-colors">
                            <Github size={20} />
                        </a>
                        <a href="#" className="text-white/40 hover:text-[#f1c40f] transition-colors">
                            <Twitter size={20} />
                        </a>
                        <a href="#" className="text-white/40 hover:text-[#e74c3c] transition-colors">
                            <Globe size={20} />
                        </a>
                    </div>

                    {/* Copyright Section */}
                    <div className="flex flex-col items-center md:items-end gap-1">
                        <p className="text-xs text-white/30 font-medium flex items-center gap-1">
                            Made by <span className="text-white/60">Mahesh</span>
                        </p>
                        <p className="text-[10px] text-white/20 uppercase tracking-widest">
                            © {currentYear} All Rights Reserved
                        </p>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#8e44ad]/30 to-transparent" />
            </div>
        </motion.footer>
    )
}
