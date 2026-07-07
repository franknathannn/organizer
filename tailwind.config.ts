import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "var(--color-base)",
        panel: "var(--color-panel)",
        "panel-raised": "var(--color-panel-raised)",
        border: "var(--color-border)",
        "border-bright": "var(--color-border-bright)",
        muted: "var(--color-muted)",
        ink: "var(--color-ink)",
        amber: {
          DEFAULT: "var(--color-amber)",
          dim: "var(--color-amber-dim)",
        },
        teal: {
          DEFAULT: "var(--color-teal)",
          dim: "var(--color-teal-dim)",
        },
        danger: "var(--color-danger)",
        urgent: "var(--color-urgent)",
        soon: "var(--color-soon)",
        later: "var(--color-later)",
        done: "var(--color-done)",
        input: "var(--color-input-bg)",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,180,84,0.15), 0 0 24px rgba(255,180,84,0.06)",
        panel: "0 1px 0 rgba(255,255,255,0.02) inset, 0 12px 32px -16px rgba(0,0,0,0.6)",
      },
      backgroundImage: {
        scanlines:
          "repeating-linear-gradient(180deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 3px)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
