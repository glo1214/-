/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        /* 종이 — 아이보리 배경과 카드 */
        paper: {
          DEFAULT: "#FDFBF6",
          card: "#FFFFFF",
          soft: "#F7F2E7",
          sand: "#F0E9DA",
        },
        line: {
          DEFAULT: "#E9E2D4",
          strong: "#D8CDB8",
        },
        /* 먹색에 가까운 짙은 회색 계열 */
        ink: {
          900: "#2A2622",
          700: "#4B443C",
          500: "#7B7268",
          400: "#9C9389",
        },
        /* 포인트 1 — 연한 노랑에서 황토까지 */
        ochre: {
          50: "#FCF6E6",
          100: "#F6E7C2",
          200: "#EDD59A",
          300: "#DEB86A",
          500: "#C08A2E",
          600: "#A87422",
          700: "#8A6019",
        },
        /* 포인트 2 — 차분한 갈색 */
        clay: {
          100: "#EFE4D8",
          500: "#8A6A48",
          700: "#5E482F",
        },
        /* 상태 표시용(최소한으로만 사용) */
        leaf: "#5A7A55",
        rust: "#A5533C",
      },
      fontFamily: {
        sans: [
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "'Apple SD Gothic Neo'",
          "'Noto Sans KR'",
          "sans-serif",
        ],
        serif: ["'Nanum Myeongjo'", "'Apple SD Gothic Neo'", "serif"],
      },
      borderRadius: {
        xl2: "1.125rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(42,38,34,0.04), 0 4px 16px rgba(42,38,34,0.05)",
        lift: "0 2px 6px rgba(42,38,34,0.06), 0 12px 28px rgba(42,38,34,0.08)",
      },
      keyframes: {
        rise: {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fade: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        blink: {
          "0%,100%": { opacity: "0.25" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        rise: "rise 0.24s ease-out",
        fade: "fade 0.3s ease-out",
        blink: "blink 1.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
