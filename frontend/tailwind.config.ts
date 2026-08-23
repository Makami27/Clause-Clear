import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0D0F16",
          900: "#12141C",
          800: "#1B1E29",
          700: "#262A38",
          600: "#3A3F52",
        },
        paper: {
          100: "#F5F3EE",
          200: "#E8E6E1",
          400: "#B8B5AD",
        },
        highlight: {
          DEFAULT: "#F5B942",
          dim: "#8A6A2A",
        },
        redline: {
          DEFAULT: "#E85D4C",
          dim: "#7A362D",
        },
        clear: {
          DEFAULT: "#5FBF8F",
          dim: "#356B4F",
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-plex)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
