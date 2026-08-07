/* ------------------------------------------------------------------
   로컬 저장소 — 모든 학습 데이터를 브라우저에 저장(무설정).
   단일 JSON 블롭 + 간단한 구독으로 React 가 상태를 읽는다.
------------------------------------------------------------------ */
import { todayKey, addDays } from "./date.js";

const KEY = "think-in-english/v1";

const DEFAULT = {
  version: 1,
  settings: {
    name: "",
    voiceURI: "",
    rate: 0.95,
    autoTTS: false,
  },
  entries: {}, // { [dateKey]: Entry }
  reviews: {}, // { [id]: ReviewItem }
};

let state = load();
const subs = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT);
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(DEFAULT),
      ...parsed,
      settings: { ...DEFAULT.settings, ...(parsed.settings || {}) },
      entries: parsed.entries || {},
      reviews: parsed.reviews || {},
    };
  } catch {
    return structuredClone(DEFAULT);
  }
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    // 저장 공간 초과 등 — 조용히 무시(앱은 계속 동작)
    console.warn("저장 실패", e);
  }
}

function emit() {
  persist();
  for (const fn of subs) fn(state);
}

export function getState() {
  return state;
}

export function subscribe(fn) {
  subs.add(fn);
  return () => subs.delete(fn);
}

/* ---------- 설정 ---------- */
export function updateSettings(patch) {
  state = { ...state, settings: { ...state.settings, ...patch } };
  emit();
}

/* ---------- 일기 ---------- */
export function getEntry(dateKey) {
  return state.entries[dateKey] || null;
}

export function saveDraft(dateKey, text) {
  const now = Date.now();
  const prev = state.entries[dateKey];
  const entry = {
    date: dateKey,
    text,
    corrected: prev?.corrected || "",
    sentences: prev?.sentences || [],
    thinkingExplanation: prev?.thinkingExplanation || "",
    thinkingMap: prev?.thinkingMap || [],
    patterns: prev?.patterns || [],
    expressions: prev?.expressions || [],
    habit: prev?.habit || null,
    readCounts: prev?.readCounts || {},
    aiSource: prev?.aiSource || null,
    createdAt: prev?.createdAt || now,
    updatedAt: now,
  };
  state = { ...state, entries: { ...state.entries, [dateKey]: entry } };
  emit();
}

/* AI(또는 오프라인) 첨삭 결과 반영 */
export function applyCorrection(dateKey, result, source) {
  const prev = state.entries[dateKey] || { text: "", readCounts: {}, createdAt: Date.now() };
  const entry = {
    ...prev,
    date: dateKey,
    corrected: result.corrected || "",
    sentences: Array.isArray(result.sentences) ? result.sentences : [],
    thinkingExplanation: result.thinkingExplanation || "",
    thinkingMap: Array.isArray(result.thinkingMap) ? result.thinkingMap : [],
    patterns: Array.isArray(result.patterns) ? result.patterns : [],
    expressions: Array.isArray(result.expressions) ? result.expressions : [],
    habit: result.habit || null,
    aiSource: source || "ai",
    readCounts: prev.readCounts || {},
    updatedAt: Date.now(),
  };
  state = { ...state, entries: { ...state.entries, [dateKey]: entry } };
  // 표현·패턴을 복습 큐에 추가
  addExpressionsToReview(dateKey, entry);
  emit();
}

export function bumpRead(dateKey, sentenceIndex) {
  const entry = state.entries[dateKey];
  if (!entry) return;
  const cur = entry.readCounts?.[sentenceIndex] || 0;
  const readCounts = { ...(entry.readCounts || {}), [sentenceIndex]: Math.min(5, cur + 1) };
  state = {
    ...state,
    entries: { ...state.entries, [dateKey]: { ...entry, readCounts } },
  };
  emit();
}

export function deleteEntry(dateKey) {
  const entries = { ...state.entries };
  delete entries[dateKey];
  // 해당 날짜에서 나온 복습 항목도 제거
  const reviews = { ...state.reviews };
  for (const id of Object.keys(reviews)) {
    if (reviews[id].srcDate === dateKey) delete reviews[id];
  }
  state = { ...state, entries, reviews };
  emit();
}

/* ---------- 복습(SRS) ---------- */
function reviewId(text) {
  return "r_" + btoa(unescape(encodeURIComponent(text.toLowerCase().trim()))).slice(0, 24);
}

function addExpressionsToReview(dateKey, entry) {
  const reviews = { ...state.reviews };
  const items = [];
  for (const ex of entry.expressions || []) {
    if (typeof ex === "string" && ex.trim()) items.push({ text: ex.trim(), kind: "expression", meaningKo: "" });
  }
  for (const p of entry.patterns || []) {
    if (p && p.pattern) items.push({ text: p.pattern, kind: "pattern", meaningKo: p.meaningKo || "", example: p.example || "" });
  }
  for (const it of items) {
    const id = reviewId(it.text);
    if (reviews[id]) continue; // 이미 존재하면 유지
    reviews[id] = {
      id,
      text: it.text,
      meaningKo: it.meaningKo || "",
      example: it.example || "",
      kind: it.kind,
      srcDate: dateKey,
      box: 1,
      due: todayKey(),
      reps: 0,
      createdAt: Date.now(),
    };
  }
  state = { ...state, reviews };
}

/* box(1~5) 기반 Leitner 간격(일) */
const INTERVALS = { 1: 1, 2: 2, 3: 4, 4: 7, 5: 14 };

export function gradeReview(id, remembered) {
  const item = state.reviews[id];
  if (!item) return;
  const box = remembered ? Math.min(5, item.box + 1) : 1;
  const due = addDays(todayKey(), INTERVALS[box]);
  const reviews = {
    ...state.reviews,
    [id]: { ...item, box, due, reps: item.reps + 1 },
  };
  state = { ...state, reviews };
  emit();
}

export function dueReviews(dateKey = todayKey()) {
  return Object.values(state.reviews)
    .filter((r) => r.due <= dateKey)
    .sort((a, b) => a.box - b.box || a.createdAt - b.createdAt);
}

export function allReviews() {
  return Object.values(state.reviews).sort((a, b) => b.createdAt - a.createdAt);
}

/* ---------- 통계 ---------- */
export function entryKeysSorted() {
  return Object.keys(state.entries)
    .filter((k) => (state.entries[k].text || "").trim())
    .sort();
}

export function currentStreak() {
  const keys = new Set(entryKeysSorted());
  let streak = 0;
  let cursor = todayKey();
  // 오늘 안 썼으면 어제부터 카운트
  if (!keys.has(cursor)) cursor = addDays(cursor, -1);
  while (keys.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}
