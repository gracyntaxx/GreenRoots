/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        forest: "#15803D",
        growth: "#22C55E",
        meadow: "#DCFCE7",
        escrow: "#0070BA",
        navy: "#003087",
        settle: "#F59E0B",
        error: "#DC2626",
        ai: "#6D5BD0",
        aitint: "#F1EEFF",
        canvas: "#F8FAFC",
        surface: "#FFFFFF",
        ink: "#0F172A",
        muted: "#475569",
        line: "#CBD5E1",
        "portal-bg": "#0B1220",
        "portal-surface": "#111C2E",
        "portal-line": "#243449",
        "portal-ink": "#E2E8F0",
        "portal-muted": "#94A3B8",
      },
      fontFamily: {
        sans: ["Inter", "Noto Sans Devanagari", "Noto Sans Gurmukhi", "Noto Sans Telugu", "Noto Sans Tamil", "system-ui", "sans-serif"],
        num: ["Space Grotesk", "Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        field: "14px",
        portal: "10px",
      },
      boxShadow: {
        field: "0 1px 2px rgba(15,23,42,0.06), 0 2px 8px rgba(15,23,42,0.04)",
        sheet: "0 -8px 30px rgba(15,23,42,0.18)",
        float: "0 8px 24px rgba(21,128,61,0.35)",
      },
      keyframes: {
        "pulse-ring": {
          "0%": { transform: "scale(0.85)", opacity: "0.7" },
          "70%": { transform: "scale(1.6)", opacity: "0" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
        "sheet-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "bar-wave": {
          "0%, 100%": { transform: "scaleY(0.3)" },
          "50%": { transform: "scaleY(1)" },
        },
      },
      animation: {
        "pulse-ring": "pulse-ring 1.6s cubic-bezier(0.4,0,0.6,1) infinite",
        "sheet-up": "sheet-up 180ms ease-out",
        "fade-in": "fade-in 160ms ease-out",
        "bar-wave": "bar-wave 900ms ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
