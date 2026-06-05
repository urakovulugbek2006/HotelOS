import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Ink / surface scale (cool charcoal with a hint of blue) ──────────
        navy: {
          950: "#070b16",
          900: "#0b1020",
          800: "#121829",
          700: "#1b2236",
          600: "#2a3450",
          500: "#3b4768",
        },
        // ── Champagne gold accent — warmer & more refined than raw amber ─────
        gold: {
          600: "#c79a4b",
          500: "#d9b25f",
          400: "#e7c879",
          300: "#f2dca0",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        display: [
          "var(--font-display)",
          "Georgia",
          "Cambria",
          "Times New Roman",
          "serif",
        ],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(231,200,121,0.16), 0 18px 50px -12px rgba(0,0,0,0.65)",
        card: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 20px 40px -24px rgba(0,0,0,0.7)",
        gold: "0 12px 30px -10px rgba(217,178,95,0.45)",
      },
      backgroundImage: {
        "gold-sheen":
          "linear-gradient(135deg, #f2dca0 0%, #e7c879 35%, #c79a4b 100%)",
        "ink-radial":
          "radial-gradient(120% 120% at 50% 0%, #1b2236 0%, #0b1020 55%, #070b16 100%)",
        "hero-glow":
          "radial-gradient(60% 50% at 50% -10%, rgba(231,200,121,0.18) 0%, transparent 70%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.8)", opacity: "0.7" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both",
        "fade-in": "fade-in 0.4s ease-out both",
        "pulse-ring": "pulse-ring 1.8s ease-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
