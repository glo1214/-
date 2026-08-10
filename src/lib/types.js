/* ------------------------------------------------------------------
   기록 유형 · 감정 · 글쓰기 구조 정의 (기획서 5·6·7·9절)

   이모지는 src/lib/emoji.js 에서 붙인다. (한곳에서 고칠 수 있게)
------------------------------------------------------------------ */

import { EMOTION_EMOJI, ENTRY_TYPE_EMOJI, ENTRY_FALLBACK } from "./emoji.js";

const ENTRY_TYPE_DEFS = [
  {
    id: "daily_emotion",
    label: "오늘의 감정과 일상",
    short: "일상",
    hint: "오늘 마음이 잠깐 멈췄던 순간 하나를 적어보세요.",
    placeholder: "예) 학원 끝나고 비 오는 길을 혼자 걸었다.",
    emotion: true,
  },
  {
    id: "attraction",
    label: "마음이 끌린 것",
    short: "끌림",
    hint: "이유를 몰라도 괜찮아요. 눈이 오래 머문 것을 적어보세요.",
    placeholder: "예) 지하철에서 본 오래된 간판 글씨체",
    emotion: false,
  },
  {
    id: "thought",
    label: "문득 떠오른 생각",
    short: "생각",
    hint: "한 문장이어도 괜찮아요.",
    placeholder: "예) 사람들은 왜 모르는 사람 앞에서 더 예의를 지킬까?",
    emotion: false,
  },
  {
    id: "book",
    label: "책을 읽고 든 생각",
    short: "독서",
    hint: "줄거리는 안 적어도 돼요. 마음이 오래 머문 장면부터 적어보세요.",
    placeholder: "예) 주인공이 친구를 두고 먼저 도망친 장면",
    emotion: false,
    source: { titleLabel: "책 제목", extraLabel: "지은이" },
  },
  {
    id: "movie",
    label: "영화를 보고 든 생각",
    short: "영화",
    hint: "장면 하나면 충분해요. 자꾸 다시 떠오르는 그 장면.",
    placeholder: "예) 마지막에 아무 말 없이 돌아서던 장면",
    emotion: false,
    source: { titleLabel: "영화 제목", extraLabel: "감독 (몰라도 괜찮아요)" },
  },
  {
    id: "news",
    label: "뉴스와 세상 이야기",
    short: "뉴스",
    hint: "무슨 일이 있었는지, 그리고 어떤 부분에서 마음이 멈췄는지 적어보세요.",
    placeholder: "예) 길고양이 급식소를 두고 주민들이 갈라졌다는 기사",
    emotion: false,
    source: { titleLabel: "기사 제목", extraLabel: "언론사 / 날짜", url: true },
  },
  {
    id: "career",
    label: "나와 진로에 관한 생각",
    short: "진로",
    hint: "직업 이름이 아니어도 좋아요. 하고 있을 때 시간이 빨리 가는 일을 떠올려보세요.",
    placeholder: "예) 친구들 사진 고르고 순서 정하는 걸 오래 붙잡고 있었다.",
    emotion: false,
  },
];

export const ENTRY_TYPES = ENTRY_TYPE_DEFS.map((t) => ({ ...t, emoji: ENTRY_TYPE_EMOJI[t.id] || "" }));

export const ENTRY_TYPE_MAP = Object.fromEntries(ENTRY_TYPES.map((t) => [t.id, t]));

export function typeLabel(id) {
  return ENTRY_TYPE_MAP[id]?.short || "기록";
}

export function typeEmoji(id) {
  return ENTRY_TYPE_EMOJI[id] ?? ENTRY_FALLBACK;
}

/* 감정 — 좋음/나쁨 2분법 대신 구체적인 단어로 (기획서 7.1) */
const EMOTION_DEFS = [
  { id: "joy", label: "기쁨", tone: "warm" },
  { id: "calm", label: "편안함", tone: "warm" },
  { id: "proud", label: "뿌듯함", tone: "warm" },
  { id: "expect", label: "기대", tone: "warm" },
  { id: "flutter", label: "설렘", tone: "warm" },
  { id: "stuffy", label: "답답함", tone: "cool" },
  { id: "hurt", label: "서운함", tone: "cool" },
  { id: "unfair", label: "억울함", tone: "cool" },
  { id: "envy", label: "질투", tone: "cool" },
  { id: "anxious", label: "불안", tone: "cool" },
  { id: "tense", label: "긴장", tone: "cool" },
  { id: "lonely", label: "외로움", tone: "cool" },
  { id: "empty", label: "허무함", tone: "cool" },
  { id: "confused", label: "혼란스러움", tone: "cool" },
  { id: "unknown", label: "아직 잘 모르겠음", tone: "neutral" },
];

export const EMOTIONS = EMOTION_DEFS.map((e) => ({ ...e, emoji: EMOTION_EMOJI[e.id] || "" }));

export const EMOTION_MAP = Object.fromEntries(EMOTIONS.map((e) => [e.id, e]));

/* 몸의 느낌 — 감정을 말로 꺼내기 어려운 학생을 위한 보조 선택지 */
export const BODY_FEELINGS = [
  "가슴이 답답했다",
  "얼굴이 뜨거웠다",
  "속이 울렁였다",
  "어깨에 힘이 들어갔다",
  "몸이 가벼웠다",
  "눈물이 날 것 같았다",
  "아무 느낌이 없었다",
];

/* 대화 후 추천하는 글쓰기 구조 (기획서 9.6) */
export const WRITING_FRAMES = {
  experience_reflection: {
    label: "경험 글",
    sections: [
      { label: "어떤 일이 있었는가", guide: "언제, 어디에서, 누구와 있었는지 적어보세요." },
      { label: "무엇을 보고 들었는가", guide: "그때 눈에 들어온 것과 들린 소리를 적어보세요." },
      { label: "감정이 어떻게 달라졌는가", guide: "처음의 마음과 나중의 마음을 이어서 적어보세요." },
      { label: "알게 된 것", guide: "이 경험을 통해 새로 알게 되었거나 아직 모르겠는 것을 적어보세요." },
    ],
  },
  review_reflection: {
    label: "감상 글",
    sections: [
      { label: "마음이 오래 머문 장면", guide: "그 장면을 본 그대로 적어보세요." },
      { label: "인물의 선택", guide: "그 장면에서 인물이 무엇을 선택했는지 적어보세요." },
      { label: "그 선택에 대한 내 생각", guide: "나는 그 선택을 어떻게 보는지 적어보세요." },
      { label: "내 경험과의 연결", guide: "내 경험이나 주변에서 본 일과 이어지는 부분을 적어보세요." },
      { label: "작품이 남긴 질문", guide: "아직 답을 못 내린 질문을 적어보세요." },
    ],
  },
  news_opinion: {
    label: "뉴스 의견 글",
    sections: [
      { label: "어떤 일이 일어났는가", guide: "사실만 골라 적어보세요." },
      { label: "왜 중요한 문제인가", guide: "이 일이 왜 그냥 넘길 수 없는 일인지 적어보세요." },
      { label: "누구에게 어떤 영향을 주는가", guide: "영향을 받는 사람들을 떠올려 적어보세요." },
      { label: "내가 중요하다고 보는 기준", guide: "판단할 때 내가 무엇을 더 중요하게 보는지 적어보세요." },
      { label: "더 확인해야 할 정보", guide: "아직 확인하지 못한 것을 적어보세요." },
      { label: "지금 나의 판단", guide: "지금 시점의 내 생각을 적어보세요. 나중에 바뀌어도 괜찮습니다." },
    ],
  },
  career_exploration: {
    label: "진로 탐색 글",
    sections: [
      { label: "반복해서 좋아한 활동", guide: "요즘 자주 하게 되는 일을 적어보세요." },
      { label: "특히 즐거운 부분", guide: "그 활동에서 어떤 순간이 제일 좋은지 적어보세요." },
      { label: "내가 중요하게 여기는 것", guide: "그 즐거움 뒤에 있는 내 기준을 적어보세요." },
      { label: "힘들어도 계속하고 싶은 이유", guide: "그만두지 않게 만드는 것이 무엇인지 적어보세요." },
      { label: "해보고 싶은 경험", guide: "더 알아보려면 무엇을 해볼 수 있을지 적어보세요." },
    ],
  },
};

export function frameOf(frameType) {
  return WRITING_FRAMES[frameType] || WRITING_FRAMES.experience_reflection;
}

/* 유형별 기본 추천 구조 */
export function defaultFrameFor(entryType) {
  if (entryType === "book" || entryType === "movie") return "review_reflection";
  if (entryType === "news") return "news_opinion";
  if (entryType === "career") return "career_exploration";
  return "experience_reflection";
}

/* 홈에 띄우는 오늘의 글쓰기 질문 (기획서 6.1) */
export const DAILY_PROMPTS = [
  "오늘 가장 오래 눈이 머문 것은 무엇이었어?",
  "오늘 하루 중에 다시 돌아가고 싶은 1분이 있다면 언제야?",
  "요즘 자꾸 떠오르는 질문이 있어?",
  "다른 사람은 그냥 지나쳤는데 나만 눈에 들어온 게 있었어?",
  "최근에 시간이 빨리 갔던 순간은 언제였어?",
  "오늘 마음속으로만 하고 넘어간 말이 있어?",
  "요즘 나를 웃게 한 아주 사소한 것은 뭐야?",
  "이번 주에 자꾸 다시 떠오르는 장면이 하나 있어?",
  "요즘 새로 좋아하게 된 게 있어?",
  "오늘 고맙다고 생각한 순간이 있었어?",
];
