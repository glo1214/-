/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          900: "#0f1115",
          800: "#161922",
          700: "#1e2230",
          600: "#2a2f40",
          500: "#3a4054",
        },
        line: "rgba(255,255,255,0.08)",
        accent: {
          DEFAULT: "#fbbf24",
          soft: "#fcd34d",
          deep: "#f59e0b",
        },
        good: "#34d399",
        bad: "#fb7185",
        muted: "#8b93a7",
      },
      fontFamily: {
        sans: [
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Roboto",
          "'Apple SD Gothic Neo'",
          "'Noto Sans KR'",
          "sans-serif",
        ],
        mono: ["'IBM Plex Mono'", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        pop: {
          "0%": { transform: "scale(0.96)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        slideup: {
          "0%": { transform: "translateY(12px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        shake: {
          "0%,100%": { transform: "translateX(0)" },
          "20%,60%": { transform: "translateX(-6px)" },
          "40%,80%": { transform: "translateX(6px)" },
        },
      },
      animation: {
        pop: "pop 0.18s ease-out",
        slideup: "slideup 0.22s ease-out",
        shake: "shake 0.32s ease-in-out",
      },
    },
  },
  plugins: [],
};
