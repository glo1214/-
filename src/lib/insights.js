/* ------------------------------------------------------------------
   나의 관심 지도 (기획서 6.6 · 7.3)

   중요한 원칙: 적성을 판정하지 않는다.
   "너는 ○○가 어울려" 같은 결론이나 직업 추천을 만들지 않고,
   반복해서 나타난 관심과 행동의 '경향'과, 더 해볼 수 있는 '경험'만 보여준다.

   계산은 전부 이 기기 안에서 이루어진다. 서버로 보내지 않는다.
------------------------------------------------------------------ */

import { EMOTION_MAP, typeLabel } from "./types.js";

/* 관심 신호 — 키워드가 아니라 '탐색해볼 영역'으로 묶는다 */
const THEMES = [
  {
    id: "life",
    label: "생명과 동물",
    words: ["동물", "강아지", "고양이", "생명", "반려", "유기견", "길고양이", "식물", "곤충"],
    activities: ["동물 복지 기사 한 편 읽고 사실과 의견 나눠보기", "생태 다큐멘터리 보고 기록 남기기", "가까운 보호소·수목원 방문 기록 쓰기"],
  },
  {
    id: "earth",
    label: "환경과 기후",
    words: ["환경", "기후", "쓰레기", "플라스틱", "재활용", "오염", "지구", "탄소", "날씨"],
    activities: ["우리 동네 분리배출 하루 관찰 기록", "기후 관련 기사 두 편 비교해서 읽기", "학교에서 할 수 있는 캠페인 한 가지 기획해보기"],
  },
  {
    id: "people",
    label: "사람과 관계",
    words: ["친구", "관계", "사이", "말투", "오해", "가족", "엄마", "아빠", "선생님", "마음", "감정", "서운", "위로"],
    activities: ["대화 한 장면을 두 사람 입장에서 각각 써보기", "인물의 감정이 중심인 소설·영화 기록하기", "가족에게 궁금했던 것 하나 인터뷰하기"],
  },
  {
    id: "fair",
    label: "공정함과 규칙",
    words: ["공정", "불공정", "억울", "규칙", "차별", "권리", "정의", "법", "평등", "혐오"],
    activities: ["학교 규칙 하나를 정하고 찬반 근거 각각 세 가지 써보기", "같은 사건을 다룬 기사 두 편의 관점 비교하기", "반대 입장에서 글 한 편 써보기"],
  },
  {
    id: "make",
    label: "만들고 고치기",
    words: ["만들", "고치", "조립", "그리", "디자인", "코딩", "프로그램", "게임", "영상", "편집", "요리"],
    activities: ["직접 만든 것의 제작 과정을 단계별로 기록하기", "마음에 든 디자인 세 개 모으고 공통점 찾기", "작게 하나 만들어보고 바꾸고 싶은 점 적기"],
  },
  {
    id: "story",
    label: "이야기와 표현",
    words: ["이야기", "소설", "책", "영화", "드라마", "노래", "가사", "글", "웹툰", "장면", "인물"],
    activities: ["좋아하는 장면의 앞뒤를 상상해서 써보기", "같은 이야기를 다른 인물 시점으로 바꿔 쓰기", "인상 깊은 문장을 모아 이유 적기"],
  },
  {
    id: "why",
    label: "원인과 구조 파헤치기",
    words: ["왜", "이유", "원인", "구조", "과학", "실험", "우주", "수학", "기술", "인공지능", "역사"],
    activities: ["궁금한 질문 하나를 골라 자료 두 개 찾아 비교하기", "직접 작은 실험이나 관찰 기록 남기기", "한 사건의 원인을 세 가지 이상 적어보기"],
  },
];

function inRange(iso, days) {
  if (!days) return true;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) && Date.now() - t <= days * 24 * 60 * 60 * 1000;
}

function countBy(list) {
  const map = new Map();
  for (const item of list) {
    if (!item) continue;
    map.set(item, (map.get(item) || 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

/**
 * entries + thinkingCards 로 관심 지도를 만든다.
 * days: 최근 며칠을 볼지 (null 이면 전체)
 */
export function buildInsights({ entries = [], cards = [], days = 30 } = {}) {
  const recentEntries = entries.filter((e) => inRange(e.createdAt, days));
  const recentIds = new Set(recentEntries.map((e) => e.id));
  const recentCards = cards.filter((c) => recentIds.has(c.entryId));

  const keywords = recentCards.flatMap((c) => c.studentWords?.coreKeywords || []);
  const emotionsFromCards = recentCards.flatMap((c) =>
    (c.studentWords?.emotionFlow || []).map((f) => f.emotion)
  );
  const emotionsFromEntries = recentEntries.flatMap((e) =>
    (e.emotionTags || []).map((id) => EMOTION_MAP[id]?.label).filter(Boolean)
  );
  const questions = recentCards.flatMap((c) => c.studentWords?.studentQuestions || []);

  /* 주제 매칭 — 키워드와 기록 원문을 함께 본다 */
  const haystack = [
    ...keywords,
    ...recentEntries.map((e) => `${e.initialNote} ${e.sourceTitle || ""}`),
  ]
    .join(" ")
    .toLowerCase();

  const themeHits = THEMES.map((t) => {
    const hits = t.words.filter((w) => haystack.includes(w)).length;
    return { ...t, hits };
  })
    .filter((t) => t.hits > 0)
    .sort((a, b) => b.hits - a.hits);

  const byWeek = new Map();
  for (const e of recentEntries) {
    const d = new Date(e.createdAt);
    if (!Number.isFinite(d.getTime())) continue;
    const key = `${d.getMonth() + 1}/${d.getDate()}`;
    byWeek.set(key, (byWeek.get(key) || 0) + 1);
  }

  return {
    entryCount: recentEntries.length,
    cardCount: recentCards.length,
    topTypes: countBy(recentEntries.map((e) => typeLabel(e.type))).slice(0, 4),
    topEmotions: countBy([...emotionsFromEntries, ...emotionsFromCards]).slice(0, 6),
    topKeywords: countBy(keywords).slice(0, 12),
    questions: questions.slice(0, 6),
    themes: themeHits.slice(0, 3),
    suggestions: themeHits.slice(0, 2).flatMap((t) => t.activities.slice(0, 2)),
    days,
  };
}

/* 홈에 쓰는 가벼운 요약 */
export function weeklySummary(entries = []) {
  const week = entries.filter((e) => inRange(e.createdAt, 7));
  const keywords = countBy(
    week.flatMap((e) => String(e.initialNote || "").split(/[^가-힣a-zA-Z]+/).filter((w) => w.length >= 2))
  ).slice(0, 5);
  return { count: week.length, keywords: keywords.map(([w]) => w) };
}
