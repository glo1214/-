/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          900: "#0d1020",
          800: "#141830",
          700: "#1b2140",
          600: "#262d54",
          500: "#374071",
        },
        line: "rgba(255,255,255,0.08)",
        brand: {
          DEFAULT: "#818cf8",
          soft: "#a5b4fc",
          deep: "#6366f1",
        },
        warm: {
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
        serif: ["'Lora'", "Georgia", "'Times New Roman'", "serif"],
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
        fadein: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        pulseSoft: {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
      },
      animation: {
        pop: "pop 0.18s ease-out",
        slideup: "slideup 0.26s ease-out",
        fadein: "fadein 0.4s ease-out",
        pulseSoft: "pulseSoft 1.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
