/* ------------------------------------------------------------------
   세션 큐 구성 + 문제 생성.
   - 복습 대상(due) + 오늘의 새 단어(dailyNew)로 큐를 만든다.
   - 새 단어는 word 단위로 도입 → splitBox면 뜻별 progress가 함께 생긴다.
------------------------------------------------------------------ */
import type { Deck, Profile, ProgressMap, Question, QueueItem, Word } from "../types";
import { buildChoices } from "./distractors";
import { isDue, isRetired, meaningIndices, newProgress, pickCard, progressKey } from "./scheduler";
import { daysBetween } from "./date";

export interface BuiltSession {
  queue: QueueItem[];
  /** 새로 만들어진 progress 항목들(도입된 새 단어). 저장에 반영해야 한다. */
  seeded: ProgressMap;
  /** 이번에 도입한 '새 단어' 수(하루 상한 집계용). */
  newWords: number;
}

interface WordRef {
  deck: Deck;
  word: Word;
}

function allWords(decks: Deck[]): WordRef[] {
  const out: WordRef[] = [];
  decks.forEach((deck) => deck.words.forEach((word) => out.push({ deck, word })));
  return out;
}

/** 오늘의 세션 큐를 만든다. */
export function buildSession(
  decks: Deck[],
  progress: ProgressMap,
  profile: Profile,
  today: string,
  introducedToday = 0,
): BuiltSession {
  const refs = allWords(decks);
  const seeded: ProgressMap = {};
  const en = profile.cardsEnabled;
  // 하루 상한 - 오늘 이미 도입한 수 = 남은 새 단어 예산
  const newBudget = Math.max(0, profile.dailyNew - introducedToday);

  const reviews: QueueItem[] = [];
  const fresh: QueueItem[] = [];
  let newWordCount = 0;

  const item = (ref: WordRef, mi: number, box: number): QueueItem => ({
    key: progressKey(ref.word.word, mi),
    word: ref.word,
    meaningIndex: mi,
    card: pickCard(box, ref.word, ref.word.meanings[mi], en),
    isReinsert: false,
  });

  for (const ref of refs) {
    const indices = meaningIndices(ref.word);
    const firstKey = progressKey(ref.word.word, indices[0]);
    const isNew = !progress[firstKey];

    if (isNew) {
      if (newWordCount >= newBudget) continue;
      newWordCount++;
      // 새 단어: 모든 뜻 인덱스에 progress 생성(오늘 due)
      indices.forEach((mi) => {
        const p = newProgress(today);
        seeded[progressKey(ref.word.word, mi)] = p;
        fresh.push(item(ref, mi, p.box));
      });
    } else {
      // 복습: due 이고 '제외'되지 않은 뜻만
      indices.forEach((mi) => {
        const p = progress[progressKey(ref.word.word, mi)];
        if (p && isDue(p, today) && !isRetired(p, profile.retireAfter)) {
          reviews.push(item(ref, mi, p.box));
        }
      });
    }
  }

  // 복습은 nextDue 이른 순, 상한 적용
  reviews.sort((a, b) => {
    const pa = progress[a.key];
    const pb = progress[b.key];
    return daysBetween(today, pa.nextDue) - daysBetween(today, pb.nextDue);
  });
  const cappedReviews = reviews.slice(0, profile.dailyReviewCap);

  return { queue: [...cappedReviews, ...fresh], seeded, newWords: newWordCount };
}

/** 재삽입 위치 오프셋: 현재로부터 4~6문제 뒤. */
export function reinsertOffset(): number {
  return 4 + Math.floor(Math.random() * 3); // 4,5,6
}

/* ---------- 문제 생성 ---------- */

function deckOf(decks: Deck[], word: Word): Deck {
  return decks.find((d) => d.words.some((w) => w.word === word.word)) ?? decks[0];
}

export function makeQuestion(decks: Deck[], it: QueueItem, progress: ProgressMap): Question {
  const deck = deckOf(decks, it.word);
  const meaning = it.word.meanings[it.meaningIndex];
  const choices = buildChoices(deck, it.word, it.meaningIndex, progress, it.card);

  let prompt: string;
  if (it.card === 1) {
    // 영단어 → 뜻
    prompt = it.word.word;
  } else if (it.card === 2) {
    // 한글 문장 빈칸 — koSentence의 ____ 자리를 맞힌다
    prompt = meaning.koSentence;
  } else {
    // 문맥 속 뜻 고르기 — 문맥은 영단어를 채워 보여주고, 그 뜻을 고른다
    prompt = meaning.koSentence.replace("____", `〔${it.word.word}〕`);
  }

  return { ...it, prompt, choices };
}

/** 세션 마지막 채움용: 오늘 틀린 key들 중 존재하는 것으로 복습 아이템 생성. */
export function makeReviewTail(
  decks: Deck[],
  keys: string[],
  progress: ProgressMap,
  en: Profile["cardsEnabled"],
  limit: number,
): QueueItem[] {
  const refs = allWords(decks);
  const out: QueueItem[] = [];
  for (const key of keys) {
    if (out.length >= limit) break;
    const [w, miStr] = key.split("#");
    const mi = Number(miStr);
    const ref = refs.find((r) => r.word.word === w);
    const p = progress[key];
    if (!ref || !p) continue;
    out.push({
      key,
      word: ref.word,
      meaningIndex: mi,
      card: pickCard(p.box, ref.word, ref.word.meanings[mi], en),
      isReinsert: true, // 꼬리 복습은 승급시키지 않는다
    });
  }
  return out;
}
