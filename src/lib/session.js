/* ------------------------------------------------------------------
   세션 엔진 — 오늘의 복습 큐 구성 + 단계별 문제 생성
   (기획서 2절 문제 형식, 3절 즉시 재삽입, 5절 예문 재활용)
------------------------------------------------------------------ */

import { isDue, newProgress, stageForProgress, todayKey } from "./srs.js";
import { pickDistractors, shuffle } from "./distractors.js";

/* 모든 단어를 deckId 포함 평평하게 */
export function flattenWords(decks) {
  const out = [];
  for (const id of Object.keys(decks || {})) {
    const deck = decks[id];
    if (!deck || !Array.isArray(deck.words)) continue;
    for (const w of deck.words) out.push({ ...w, deckId: id, deckName: deck.name });
  }
  return out;
}

/*
  오늘 학습 대상 구성
  - 복습(due): progress 있고 nextDue<=오늘
  - 신규(new): progress 없는 단어, dailyNew 만큼
  반환 { due:[word], fresh:[word], all:[word] }
*/
export function buildToday(decks, progress, settings, today = todayKey()) {
  const words = flattenWords(decks);
  const due = [];
  const fresh = [];
  for (const w of words) {
    const p = progress[w.id];
    if (!p) fresh.push(w);
    else if (isDue(p, today)) due.push(w);
  }
  const dailyNew = settings?.dailyNew ?? 20;
  const freshLimited = shuffle(fresh).slice(0, dailyNew);
  return { due, fresh: freshLimited, all: [...due, ...freshLimited] };
}

/* 오늘 남은 복습 개수 (홈 화면 숫자) */
export function todayCount(decks, progress, settings, today = todayKey()) {
  const { due, fresh } = buildToday(decks, progress, settings, today);
  return due.length + fresh.length;
}

/* 한 세션에 담을 단어 목록 (sessionSize 만큼, 복습 우선) */
export function pickSessionWords(decks, progress, settings, today = todayKey()) {
  const { due, fresh } = buildToday(decks, progress, settings, today);
  const size = settings?.sessionSize ?? 20;
  const ordered = [...shuffle(due), ...fresh]; // 복습 먼저, 그다음 신규
  return ordered.slice(0, size);
}

/* ---------- 빈칸 예문 ---------- */

/* 품사별 기본 캐리어 문장 (예문이 없을 때) */
const FRAMES = {
  v: (blank) => `They decided to ${blank} the whole thing.`,
  n: (blank) => `It turned out to be an important ${blank}.`,
  a: (blank) => `It was a truly ${blank} moment for everyone.`,
  ad: (blank) => `She handled the situation ${blank}.`,
};

const BLANK = "_____";

/* text 안에서 word 를 빈칸으로 (첫 등장, 대소문자 무시, 단어 경계) */
function blankOut(text, word) {
  const re = new RegExp(`\\b${escapeReg(word)}\\b`, "i");
  if (re.test(text)) return text.replace(re, BLANK);
  return null;
}
function escapeReg(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* 이 단어에 쓸 예문 찾기 (재활용). 없으면 프레임 생성 */
function carrierFor(word, sentences) {
  // 1) 이 단어를 타깃으로 만든 예문
  for (const s of sentences || []) {
    if (Array.isArray(s.targetWordIds) && s.targetWordIds.includes(word.id)) {
      const blanked = blankOut(s.text, word.word);
      if (blanked) return { text: blanked, sentenceId: s.id, reused: true };
    }
  }
  // 2) 텍스트에 단어가 들어있는 아무 예문
  for (const s of sentences || []) {
    const blanked = blankOut(s.text, word.word);
    if (blanked) return { text: blanked, sentenceId: s.id, reused: true };
  }
  // 3) 프레임
  const frame = (FRAMES[word.pos] || FRAMES.v)(BLANK);
  return { text: frame, sentenceId: null, reused: false };
}

/* 첫 글자 힌트 + 밑줄 (a______) */
export function firstLetterHint(word) {
  if (!word) return "";
  return word[0] + "_".repeat(Math.max(word.length - 1, 1));
}

/* ---------- 문제 생성 ---------- */
/*
  반환:
  {
    wordId, stage, kind: "choice"|"type",
    promptLabel,       // 상단 안내 (예: "빈칸에 알맞은 단어")
    promptMain,        // 문제 본문
    options: [{key,text,correct}] (choice)
    answer,            // 정답 문자열
    hint,              // 타이핑 힌트
    reusedSentence,    // 재활용 예문 여부
    word               // 원본 단어 객체 (해설용)
  }
*/
export function makeQuestion(word, pool, progress, sentences) {
  const p = progress[word.id] || newProgress();
  const stage = stageForProgress(p);

  if (stage === 1) {
    // 영단어 → 뜻 (4지선다)
    const ds = pickDistractors(word, pool, progress, { n: 3, key: "meaning" });
    const options = shuffle(
      [
        { text: word.meaning, correct: true, srcId: word.id },
        ...ds.map((d) => ({ text: d.meaning, correct: false, srcId: d.id })),
      ]
    ).map((o, i) => ({ key: i, ...o }));
    return {
      wordId: word.id,
      stage,
      kind: "choice",
      promptLabel: "뜻을 고르세요",
      promptMain: word.word,
      options,
      answer: word.meaning,
      word,
    };
  }

  if (stage === 2) {
    // 뜻 → 영단어 (4지선다)
    const ds = pickDistractors(word, pool, progress, { n: 3, key: "word" });
    const options = shuffle(
      [
        { text: word.word, correct: true, srcId: word.id },
        ...ds.map((d) => ({ text: d.word, correct: false, srcId: d.id })),
      ]
    ).map((o, i) => ({ key: i, ...o }));
    return {
      wordId: word.id,
      stage,
      kind: "choice",
      promptLabel: "알맞은 영단어를 고르세요",
      promptMain: word.meaning,
      options,
      answer: word.word,
      word,
    };
  }

  // stage 3, 4 — 빈칸
  const carrier = carrierFor(word, sentences);

  if (stage === 3) {
    const ds = pickDistractors(word, pool, progress, { n: 3, key: "word" });
    const options = shuffle(
      [
        { text: word.word, correct: true, srcId: word.id },
        ...ds.map((d) => ({ text: d.word, correct: false, srcId: d.id })),
      ]
    ).map((o, i) => ({ key: i, ...o }));
    return {
      wordId: word.id,
      stage,
      kind: "choice",
      promptLabel: "빈칸에 알맞은 단어",
      promptMain: carrier.text,
      subLabel: word.meaning,
      options,
      answer: word.word,
      reusedSentence: carrier.reused,
      word,
    };
  }

  // stage 4 — 빈칸 + 첫 글자 힌트, 타이핑
  return {
    wordId: word.id,
    stage: 4,
    kind: "type",
    promptLabel: "빈칸에 단어를 입력",
    promptMain: carrier.text,
    subLabel: word.meaning,
    answer: word.word,
    hint: firstLetterHint(word.word),
    reusedSentence: carrier.reused,
    word,
  };
}

/* 타이핑 정답 판정 (대소문자/공백 무시) */
export function checkTyped(input, answer) {
  return String(input || "").trim().toLowerCase() === String(answer || "").trim().toLowerCase();
}
