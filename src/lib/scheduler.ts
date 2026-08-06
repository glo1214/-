/* ------------------------------------------------------------------
   Leitner 5박스 + 응답시간 판정. 이 앱의 핵심.
   순수 함수만 둔다(랜덤·시계 없음) — 테스트로 먼저 검증한다.
------------------------------------------------------------------ */
import type { Answer, CardType, Meaning, Progress, Word } from "../types";
import { addDays, todayKey } from "./date";

/** 박스별 복습 간격(일). 1 / 3 / 7 / 16 / 35 */
export const BOX_INTERVAL: Record<number, number> = { 1: 1, 2: 3, 3: 7, 4: 16, 5: 35 };
export const MAX_BOX = 5;

export function progressKey(word: string, meaningIndex: number): string {
  return `${word}#${meaningIndex}`;
}

/** splitBox면 뜻별로, 아니면 #0 하나만. */
export function meaningIndices(word: Word): number[] {
  if (word.splitBox && word.meanings.length > 1) {
    return word.meanings.map((_, i) => i);
  }
  return [0];
}

export function newProgress(today: string = todayKey()): Progress {
  return {
    box: 1,
    nextDue: today, // 오늘 바로 노출
    wrongCount: 0,
    avgMs: 0,
    weak: false,
    lastSeen: null,
    confusedWith: {},
  };
}

/** nextDue <= today 면 복습 대상. */
export function isDue(p: Progress, today: string = todayKey()): boolean {
  const [y1, m1, d1] = p.nextDue.split("-").map(Number);
  const [y2, m2, d2] = today.split("-").map(Number);
  const due = new Date(y1, m1 - 1, d1).getTime();
  const now = new Date(y2, m2 - 1, d2).getTime();
  return due <= now;
}

/* ---------- 판정 ---------- */

export interface JudgeInput {
  answer: Answer;
  ms: number; // 문제 표시~응답 경과 시간
  selfWord: string; // 이 문제의 정답 단어 (confusedWith 자기제외)
  chosenWord?: string; // 오답으로 고른 단어
  isReinsert: boolean; // 세션 내 재삽입분 → 승급 금지
  threshold: { fast: number; slow: number };
  today: string;
}

export interface JudgeResult {
  next: Progress;
  promoted: boolean; // 박스가 올랐는가
  requeue: boolean; // 세션 큐에 재삽입할 것인가
}

function avg(prev: number, ms: number): number {
  return prev > 0 ? Math.round((prev + ms) / 2) : ms;
}

/**
 * 응답 하나를 판정한다.
 * 승급은 "재삽입 아님 && 오늘 처음(lastSeen !== today)"일 때만 내린다.
 */
export function judge(p: Progress, input: JudgeInput): JudgeResult {
  const { answer, ms, selfWord, chosenWord, isReinsert, threshold, today } = input;
  const avgMs = avg(p.avgMs, ms);
  const canPromote = !isReinsert && p.lastSeen !== today;

  if (answer === "wrong" || answer === "dunno") {
    const confusedWith = { ...p.confusedWith };
    // 오답만 confusedWith를 늘린다. 모름은 건드리지 않는다.
    if (answer === "wrong" && chosenWord && chosenWord !== selfWord) {
      confusedWith[chosenWord] = (confusedWith[chosenWord] ?? 0) + 1;
    }
    return {
      next: {
        ...p,
        box: 1,
        weak: true,
        wrongCount: p.wrongCount + 1,
        avgMs,
        confusedWith,
        lastSeen: today,
        nextDue: addDays(today, BOX_INTERVAL[1]),
      },
      promoted: false,
      requeue: true, // 4~6문제 뒤 재삽입 (위치는 session 계층)
    };
  }

  // ----- 정답 -----
  const base: Progress = { ...p, avgMs, lastSeen: today };

  // 재삽입분 / 오늘 이미 본 문제: 오답 표시만 풀고 박스는 그대로. 재삽입 없음.
  if (!canPromote) {
    return { next: base, promoted: false, requeue: false };
  }

  if (ms < threshold.fast) {
    const box = Math.min(p.box + 1, MAX_BOX);
    return {
      next: { ...base, box, weak: false, nextDue: addDays(today, BOX_INTERVAL[box]) },
      promoted: box > p.box,
      requeue: false,
    };
  }
  if (ms <= threshold.slow) {
    const box = Math.min(p.box + 1, MAX_BOX);
    return {
      next: { ...base, box, weak: true, nextDue: addDays(today, BOX_INTERVAL[box]) },
      promoted: box > p.box,
      requeue: false,
    };
  }
  // ms > slow: 박스 유지, nextDue = 3일 후
  return {
    next: { ...base, weak: true, nextDue: addDays(today, 3) },
    promoted: false,
    requeue: false,
  };
}

/* ---------- 박스별 출제 카드 ----------
   v1 카드셋(1,2,3)에 맞춘 매핑:
     box 1 → 카드1(영단어→뜻)
     box 2 → 카드2(한글 문장 빈칸)
     box 3+ → splitBox면 카드3(문맥 속 뜻), 아니면 카드2
   profile.cardsEnabled 로 끈 카드는 건너뛴다.
*/
type Enabled = { card1: boolean; card2: boolean; card3: boolean };

function candidates(box: number, word: Word): CardType[] {
  const out: CardType[] = [];
  const push = (c: CardType) => {
    if (!out.includes(c)) out.push(c);
  };
  if (box <= 1) {
    push(1);
    push(2);
  } else if (box === 2) {
    push(2);
    push(1);
  } else {
    if (word.splitBox) push(3);
    push(2);
    push(1);
  }
  return out;
}

function cardUsable(c: CardType, word: Word, meaning: Meaning, en: Enabled): boolean {
  if (c === 1) return en.card1;
  if (c === 2) return en.card2 && meaning.koSentence.includes("____");
  return en.card3 && word.splitBox;
}

export function pickCard(box: number, word: Word, meaning: Meaning, en: Enabled): CardType {
  for (const c of candidates(box, word)) {
    if (cardUsable(c, word, meaning, en)) return c;
  }
  // 폴백: 활성화된 아무 카드
  for (const c of [1, 2, 3] as CardType[]) {
    if (cardUsable(c, word, meaning, en)) return c;
  }
  return 1;
}
