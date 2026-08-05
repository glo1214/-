/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // 라이트 테마 표면 (900=페이지 배경, 800=카드)
        ink: {
          900: "#eef1f6",
          800: "#ffffff",
          700: "#e7ebf1",
          600: "#dbe1ea",
          500: "#c7cfda",
        },
        line: "rgba(15,23,42,0.10)",
        accent: {
          DEFAULT: "#f59e0b", // 버튼 배경 (밝은 앰버)
          soft: "#fbbf24", // hover
          deep: "#b45309", // 밝은 배경 위 텍스트용 (진한 앰버)
          ink: "#3a2a05", // 앰버 배경 위 텍스트
        },
        good: "#16a34a",
        bad: "#e11d48",
        muted: "#64748b",
        // 텍스트 회색조 반전: text-gray-50 이 가장 진한 글자색
        gray: {
          50: "#0f172a",
          100: "#1e293b",
          200: "#334155",
          300: "#475569",
          400: "#64748b",
        },
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
