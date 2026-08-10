/* ------------------------------------------------------------------
   생각 설계 카드 스키마 (기획서 10절 JSON)

   AI 응답을 그대로 믿지 않는다. 서버에서 한 번, 클라이언트에서 한 번
   같은 검증기를 통과시킨다. 형식이 어긋나면 통째로 버리는 대신
   어긋난 항목만 떨어내고(빈 배열로) 나머지를 살린다 — 학생 화면에
   "오류"만 남기지 않기 위해서다.

   의존성 없이 손으로 쓴 검증기다. (zod 를 쓰고 싶다면 이 파일의
   validateThinkingCard 만 교체하면 된다.)
------------------------------------------------------------------ */

const MAX_ITEM = 120; // 한 항목이 문단이 되어버리는 것을 막는다 (AI가 글을 대신 쓰지 못하게)
const MAX_LIST = 8;

function str(v, max = MAX_ITEM) {
  if (typeof v !== "string") return null;
  const s = v.trim().replace(/\s+/g, " ");
  if (!s) return null;
  return s.length > max ? s.slice(0, max) : s;
}

function strList(v, max = MAX_LIST, maxLen = MAX_ITEM) {
  if (!Array.isArray(v)) return [];
  const out = [];
  for (const item of v) {
    const s = str(item, maxLen);
    if (s && !out.includes(s)) out.push(s);
    if (out.length >= max) break;
  }
  return out;
}

export const FRAME_TYPES = [
  "experience_reflection",
  "review_reflection",
  "news_opinion",
  "career_exploration",
];

export function validateThinkingCard(raw, { fallbackFrameType = "experience_reflection" } = {}) {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "카드 형식이 아닙니다." };
  }

  const words = raw.studentWords && typeof raw.studentWords === "object" ? raw.studentWords : {};

  const emotionFlow = Array.isArray(words.emotionFlow)
    ? words.emotionFlow
        .map((e) => {
          if (!e || typeof e !== "object") return null;
          const emotion = str(e.emotion, 24);
          const evidence = str(e.evidence, MAX_ITEM);
          return emotion ? { emotion, evidence: evidence || "" } : null;
        })
        .filter(Boolean)
        .slice(0, 6)
    : [];

  const frame = raw.writingFrame && typeof raw.writingFrame === "object" ? raw.writingFrame : {};
  const frameType = FRAME_TYPES.includes(frame.frameType) ? frame.frameType : fallbackFrameType;

  const sections = Array.isArray(frame.sections)
    ? frame.sections
        .map((s) => {
          if (!s || typeof s !== "object") return null;
          const label = str(s.label, 24);
          const guide = str(s.guide, 90);
          return label ? { label, guide: guide || "" } : null;
        })
        .filter(Boolean)
        .slice(0, 6)
    : [];

  /* 문장 시작점은 반드시 빈칸이 있어야 한다.
     완성된 문장이 넘어오면 학생이 그대로 베낄 수 있으므로 버린다. */
  const sentenceStarters = strList(raw.sentenceStarters, 5, 80).filter((s) => /_{3,}/.test(s));

  const card = {
    sessionType: str(raw.sessionType, 40) || "daily_emotion",
    studentWords: {
      coreKeywords: strList(words.coreKeywords, MAX_LIST, 30),
      emotionFlow,
      memorableScenes: strList(words.memorableScenes, 4, MAX_ITEM),
      studentQuestions: strList(words.studentQuestions, 4, MAX_ITEM),
      connections: strList(words.connections, 4, MAX_ITEM),
    },
    writingFrame: { frameType, sections },
    sentenceStarters,
  };

  const w = card.studentWords;
  const empty =
    w.coreKeywords.length === 0 &&
    w.emotionFlow.length === 0 &&
    w.memorableScenes.length === 0 &&
    w.studentQuestions.length === 0 &&
    w.connections.length === 0;

  if (empty) return { ok: false, error: "카드에 담을 내용이 없습니다." };

  return { ok: true, card };
}
