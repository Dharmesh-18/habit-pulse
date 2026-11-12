/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        neu: {
          bg: "var(--theme-surface)",
          canvas: "var(--theme-bg)",
          elevated: "var(--theme-surface-elevated)",
          accent: "var(--theme-accent)",
          text: "var(--theme-text)",
          muted: "var(--theme-muted)",
          dark: "var(--theme-dark)",
          danger: "#ef4444",
          success: "#10b981",
        },
      },
      boxShadow: {
        "neu-flat": "var(--theme-shadow-flat)",
        "neu-flat-sm": "var(--theme-shadow-flat-sm)",
        "neu-flat-lg": "var(--theme-shadow-flat-lg)",
        "neu-pressed": "var(--theme-shadow-pressed)",
        "neu-pressed-sm": "var(--theme-shadow-pressed-sm)",
        "neu-glow": "0 0 14px var(--theme-accent-glow)",
      },
    },
  },
  plugins: [],
};