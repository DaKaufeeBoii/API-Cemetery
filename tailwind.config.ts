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
        background:  "var(--background)",
        surface:     "var(--surface)",
        foreground:  "var(--foreground)",
        muted:       "var(--muted)",
        "muted-fg":  "var(--muted-fg)",
        card:        "var(--card)",
        "card-hover":"var(--card-hover)",
        border:      "var(--border)",
        accent:      "var(--accent)",
        "accent-fg": "var(--accent-fg)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl2: "1rem",
      },
      boxShadow: {
        "card": "0 2px 8px rgba(0,0,0,0.3)",
        "card-lg": "0 8px 24px rgba(0,0,0,0.4)",
        "glow-blue": "0 0 20px rgba(59,130,246,0.3)",
        "glow-red": "0 0 20px rgba(239,68,68,0.3)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-mesh": "linear-gradient(135deg, #090d14 0%, #0e1420 50%, #090d14 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
