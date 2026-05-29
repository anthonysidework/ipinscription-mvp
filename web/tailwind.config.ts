import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // IP Inscription dark-web3 palette.
        ink: {
          100: "#e6e8f0",
          200: "#c7cbdc",
          300: "#a3a9c4",
          400: "#7c83a6",
          500: "#5b6285",
          600: "#2b3357",
          700: "#1f2640",
          800: "#161b30",
          850: "#101426",
          900: "#0b0e1a",
          950: "#070912",
        },
        brand: {
          400: "#8b9cff",
          500: "#6d7dff",
          600: "#5563f5",
        },
        accent: {
          400: "#5eead4",
          500: "#2dd4bf",
        },
      },
      fontFamily: {
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
