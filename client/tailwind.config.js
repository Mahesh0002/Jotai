/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Semantic Colors based on Design System
        background: "#09090B",
        surface: "#0D0D12",
        "surface-elevated": "#12121A",
        border: "rgba(255, 255, 255, 0.08)",

        primary: {
          DEFAULT: "#A855F7", // Neon Purple
          hover: "#9333EA",
          light: "rgba(168, 85, 247, 0.15)",
        },
        success: {
          DEFAULT: "#10B981", // Neon Green
          light: "rgba(16, 185, 129, 0.15)",
        },
        warning: {
          DEFAULT: "#F59E0B", // Amber
          light: "rgba(245, 158, 11, 0.15)",
        },
        error: {
          DEFAULT: "#EF4444", // Red
          light: "rgba(239, 68, 68, 0.15)",
        },

        // Semantic Text
        text: {
          primary: "#FFFFFF",
          secondary: "#A1A1AA", // zinc-400
          muted: "#71717A", // zinc-500
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["Fira Code", "monospace"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(168, 85, 247, 0.2)",
        "glow-strong": "0 0 30px rgba(168, 85, 247, 0.4)",
      },
    },
  },
  plugins: [],
};
