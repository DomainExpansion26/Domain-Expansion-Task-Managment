/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0D0D0D",
        foreground: "#F3F4F6",
        surface: {
          50: "#1A1A1A",
          100: "#141414",
          200: "#0D0D0D",
          300: "#080808",
          border: "#2E2E2E",
          hover: "#222222",
        },
        brand: {
          orange: "#FF6200",
          orangeLight: "#FF8C42",
          orangeHover: "#E55800",
          purple: "#6D28D9",
          purpleLight: "#8B5CF6",
          cyan: "#06B6D4",
        },
        priority: {
          critical: "#EF4444",
          high: "#F97316",
          medium: "#EAB308",
          low: "#10B981",
        },
        status: {
          todo: "#64748B",
          inProgress: "#3B82F6",
          inReview: "#8B5CF6",
          blocked: "#EF4444",
          done: "#10B981",
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-outfit)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      animation: {
        "pulse-subtle": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 15px rgba(255, 98, 0, 0.2)" },
          "100%": { boxShadow: "0 0 30px rgba(255, 98, 0, 0.5)" },
        }
      }
    },
  },
  plugins: [],
};
