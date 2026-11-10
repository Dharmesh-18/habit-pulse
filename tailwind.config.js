/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        neu: {
          bg: "#e6ecf4",
          surface: "#e6ecf4",
          accent: "#4f46e5",
          accentHover: "#4338ca",
          text: "#334155",
          muted: "#64748b",
          dark: "#1e293b",
          danger: "#ef4444",
          success: "#10b981",
        },
      },
      boxShadow: {
        // Raised surface
        "neu-flat": "6px 6px 14px #c2c9d2, -6px -6px 14px #ffffff",
        "neu-flat-sm": "3px 3px 7px #c2c9d2, -3px -3px 7px #ffffff",
        "neu-flat-lg": "10px 10px 22px #c2c9d2, -10px -10px 22px #ffffff",
        // Recessed / Inset for inputs & active buttons
        "neu-pressed": "inset 4px 4px 8px #c2c9d2, inset -4px -4px 8px #ffffff",
        "neu-pressed-sm": "inset 2px 2px 4px #c2c9d2, inset -2px -2px 4px #ffffff",
      },
    },
  },
  plugins: [],
};