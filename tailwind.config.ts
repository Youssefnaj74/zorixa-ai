import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        zorixa: {
          bg: "#0a0a0f",
          /** Fixed video composer bar */
          "bottom-bar": "#0f0f17",
          "bg-secondary": "#111118",
          card: "#16161f",
          preview: "#0d0d14",
          dropdown: "#1a1a24",
          selected: "#1d4ed8",
          accent: "#8338eb",
          "accent-secondary": "#9b5cf6",
          glow: "rgba(131, 56, 235, 0.3)",
          muted: "#6b7280",
          border: "rgba(131, 56, 235, 0.2)",
          tab: "#2563eb",
          "badge-full": "#16a34a",
          "badge-pro": "#2563eb",
          "badge-new": "#0d9488",
        },
        brand: {
          DEFAULT: "#8338eb",
          light: "#9b5cf6",
          dark: "#6a2abf",
          glow: "rgba(131, 56, 235, 0.3)",
        },
        surface: {
          bg: "#0a0a0f",
          card: "#111118",
          elevated: "#16161f",
          border: "rgba(131, 56, 235, 0.15)",
        },
        studio: {
          canvas: "#0a0a0f",
          line: "rgba(131, 56, 235, 0.15)",
          accent: "#8338eb",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Space Grotesk", "sans-serif"],
        sans: ["var(--font-body)", "DM Sans", "system-ui", "sans-serif"],
        heading: ["var(--font-display)", "Space Grotesk", "sans-serif"],
        body: ["var(--font-body)", "DM Sans", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(131, 56, 235, 0.15)",
        "glow-lg": "0 0 40px rgba(131, 56, 235, 0.25)",
        "generate-pulse": "0 0 28px rgba(131, 56, 235, 0.45)",
      },
      backgroundImage: {
        "gradient-brand": "linear-gradient(135deg, #8338eb 0%, #9b5cf6 100%)",
        "gradient-mesh":
          "radial-gradient(at 40% 20%, rgba(131,56,235,0.35) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(37,99,235,0.2) 0px, transparent 45%), radial-gradient(at 10% 90%, rgba(131,56,235,0.15) 0px, transparent 40%)",
      },
      keyframes: {
        "studio-indeterminate": {
          "0%": { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(320%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "studio-indeterminate": "studio-indeterminate 1.4s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
