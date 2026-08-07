/* ------------------------------------------------------------------
   AI 첨삭 클라이언트 — Netlify Function(/correct) 호출.
   서버에 ANTHROPIC_API_KEY 가 있으면 원어민 첨삭 + 영어식 사고 설명을
   받아오고, 없거나(503) 네트워크 오류면 오프라인 폴백으로 우아하게 전환.
------------------------------------------------------------------ */
import { offlineCorrect } from "./heuristic.js";

const ENDPOINT = "/.netlify/functions/correct";

export class AIError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

/* AI 첨삭 사용 가능 여부 점검.
   반환: 'ready' | 'no_key' | 'offline' */
export async function checkAIStatus() {
  let res;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "" }),
    });
  } catch {
    return "offline";
  }
  if (res.status === 503) return "no_key";
  // 함수는 존재하고 키가 있으면 빈 text 로 400 이 온다 → 준비됨
  if (res.status === 400) return "ready";
  // 404 등 = 함수가 배포되지 않은 환경(로컬 프리뷰 등)
  return "offline";
}

/* 반환: { result, source: 'ai' | 'offline', note? } */
export async function correctDiary(text, { name = "" } = {}) {
  const clean = (text || "").trim();
  if (!clean) throw new AIError("먼저 일기를 작성해 주세요.", "empty");

  let res;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: clean, name }),
    });
  } catch {
    return {
      result: offlineCorrect(clean),
      source: "offline",
      note: "네트워크에 연결하지 못해 오프라인 연습 모드로 첨삭했어요.",
    };
  }

  if (res.status === 503) {
    return {
      result: offlineCorrect(clean),
      source: "offline",
      note: "AI 첨삭이 아직 켜지지 않았어요(서버에 ANTHROPIC_API_KEY 필요). 오프라인 연습 모드로 보여드려요.",
    };
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* noop */
  }

  if (!res.ok || !data || data.error || !data.corrected) {
    return {
      result: offlineCorrect(clean),
      source: "offline",
      note:
        (data && data.error) ||
        "AI 첨삭 중 문제가 생겨 오프라인 연습 모드로 전환했어요.",
    };
  }

  return { result: normalize(data), source: "ai" };
}

/* 서버 응답을 앱 내부 스키마로 정규화(누락 필드 방어) */
function normalize(d) {
  return {
    corrected: String(d.corrected || ""),
    sentences: Array.isArray(d.sentences)
      ? d.sentences
          .filter((s) => s && (s.corrected || s.original))
          .map((s) => ({
            original: String(s.original || ""),
            corrected: String(s.corrected || ""),
            reason: String(s.reason || ""),
          }))
      : [],
    thinkingExplanation: String(d.thinkingExplanation || ""),
    thinkingMap: Array.isArray(d.thinkingMap)
      ? d.thinkingMap
          .map((m) =>
            typeof m === "string"
              ? { step: "", en: m }
              : { step: String(m.step || ""), en: String(m.en || m.text || "") }
          )
          .filter((m) => m.en || m.step)
      : [],
    patterns: Array.isArray(d.patterns)
      ? d.patterns
          .filter((p) => p && p.pattern)
          .map((p) => ({
            pattern: String(p.pattern),
            example: String(p.example || ""),
            meaningKo: String(p.meaningKo || ""),
          }))
      : [],
    expressions: Array.isArray(d.expressions)
      ? d.expressions.map((e) => String(e)).filter(Boolean).slice(0, 8)
      : [],
    habit: d.habit && typeof d.habit === "object" ? normalizeHabit(d.habit) : null,
  };
}

function normalizeHabit(h) {
  return {
    strengths: Array.isArray(h.strengths) ? h.strengths.map(String) : [],
    weaknesses: Array.isArray(h.weaknesses) ? h.weaknesses.map(String) : [],
    recommendation: String(h.recommendation || ""),
    scores:
      h.scores && typeof h.scores === "object"
        ? Object.fromEntries(
            Object.entries(h.scores).map(([k, v]) => [k, clampScore(v)])
          )
        : {},
  };
}

function clampScore(v) {
  const n = Math.round(Number(v) || 0);
  return Math.max(1, Math.min(5, n));
}
