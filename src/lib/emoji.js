/* ------------------------------------------------------------------
   이모지 모음 — 화면에 쓰이는 이모지는 전부 여기 있다.

   바꾸고 싶으면 이 파일만 고치면 앱 전체에 반영된다.
   빼고 싶으면 값을 빈 문자열("")로 두면 그 자리에서 사라진다.
   (자리 자체가 없어지므로 여백이 남지 않는다)
------------------------------------------------------------------ */

/* 기록 유형 7가지 */
export const ENTRY_TYPE_EMOJI = {
  daily_emotion: "🌤",
  attraction: "✨",
  thought: "💭",
  book: "📖",
  movie: "🎬",
  news: "📰",
  career: "🧭",
};

/* 감정 15가지 */
export const EMOTION_EMOJI = {
  joy: "😊",
  calm: "🌿",
  proud: "🌟",
  expect: "🎈",
  flutter: "💫",
  stuffy: "😮‍💨",
  hurt: "🥺",
  unfair: "😤",
  envy: "😒",
  anxious: "😰",
  tense: "😬",
  lonely: "🌙",
  empty: "🍂",
  confused: "🌀",
  unknown: "❔",
};

/* 홈 화면 활동 카드 4가지 */
export const HOME_ACTION_EMOJI = {
  new: "✏️",
  chat: "💬",
  media: "📚",
  map: "🗺️",
};

/* 관심 지도의 주제 7가지 */
export const THEME_EMOJI = {
  life: "🐾",
  earth: "🌏",
  people: "🤝",
  fair: "⚖️",
  make: "🔧",
  story: "📚",
  why: "🔍",
};

/* 생각 설계 카드의 항목 제목 */
export const CARD_BLOCK_EMOJI = {
  keywords: "🔑",
  emotionFlow: "🫧",
  scenes: "🖼",
  questions: "❓",
  connections: "🔗",
  frame: "🧱",
  starters: "✍️",
};

/* 그 밖에 한 자리씩 쓰이는 것 */
export const COACH_AVATAR = "🌱"; // 대화 화면에서 코치 말풍선 앞
export const DAILY_PROMPT = "🌱"; // 홈의 '오늘의 글쓰기 질문'
export const ENTRY_FALLBACK = "📝"; // 유형을 알 수 없을 때
