/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#0f0f0f",
                secondary: "#1a1a1a",
                accent: "#f1c40f",
                "purple-accent": "#8e44ad",
                text: "#fff",
                error: "#c0392b",
                success: "#2ecc71",
                hover: "#d4a60d",
            },
            fontFamily: {
                orbitron: ["Orbitron", "sans-serif"],
            },
            backgroundImage: {
                "card-gradient": "linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(26, 26, 26, 0.6))",
                "main-gradient": "linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%)",
            },
            boxShadow: {
                "glow": "0 8px 32px rgba(0, 0, 0, 0.5)",
                "neon": "0 0 10px var(--accent-color)",
            },
        },
    },
    plugins: [],
}
