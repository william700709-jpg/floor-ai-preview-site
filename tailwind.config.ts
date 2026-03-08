import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        sand: "#F7F1E8",
        latte: "#D8C2A8",
        wood: "#C9A27D",
        sage: "#A7B69E",
        stone: "#6F6A62",
        clay: "#B8875A",
        cream: "#FFFDF8"
      },
      fontFamily: {
        sans: ["var(--font-noto-sans-tc)"]
      },
      boxShadow: {
        soft: "0 20px 50px rgba(111, 106, 98, 0.12)"
      },
      backgroundImage: {
        grain: "radial-gradient(circle at 1px 1px, rgba(111, 106, 98, 0.06) 1px, transparent 0)"
      }
    }
  },
  plugins: []
};

export default config;
