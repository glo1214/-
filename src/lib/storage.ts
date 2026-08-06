/* ------------------------------------------------------------------
   localStorage 저장 계층. 저장 키 세 개: profile / decks / progress.
   (기획서의 window.storage 제약은 아티팩트 전용이므로 무시한다)

   저장 정책: 매 문제마다 저장하지 않는다. 세션 종료 시 한 번,
   이탈 대비로 5문제마다 중간 저장(progress만)한다. — session 계층이 호출.
------------------------------------------------------------------ */
import type { Deck, Profile, ProgressMap, Word } from "../types";
import unit04 from "../data/unit04.json";

const K_PROFILE = "wr.profile";
const K_DECKS = "wr.decks";
const K_PROGRESS = "wr.progress";

export const DEFAULT_PROFILE: Profile = {
  examDate: null,
  dailyNew: 12,
  dailyReviewCap: 60,
  cardsEnabled: { card1: true, card2: true, card3: true },
  useEtymology: true,
  useKoPron: true,
  timeThreshold: { fast: 2000, slow: 6000 },
};

/** 시드 덱 (어휘끝 Unit04). JSON 구조를 그대로 쓴다. */
export function seedDeck(): Deck {
  return structuredClone(unit04) as Deck;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 저장 실패(용량 등)는 조용히 무시 — 앱은 계속 동작 */
  }
}

/* ---------- profile ---------- */
export function loadProfile(): Profile {
  const p = read<Partial<Profile>>(K_PROFILE, {});
  // 누락 필드는 기본값으로 보정 (스키마 진화 대비)
  return {
    ...DEFAULT_PROFILE,
    ...p,
    cardsEnabled: { ...DEFAULT_PROFILE.cardsEnabled, ...(p.cardsEnabled ?? {}) },
    timeThreshold: { ...DEFAULT_PROFILE.timeThreshold, ...(p.timeThreshold ?? {}) },
  };
}
export function saveProfile(p: Profile): void {
  write(K_PROFILE, p);
}

/* ---------- decks ---------- */
export function loadDecks(): Deck[] {
  const existing = localStorage.getItem(K_DECKS);
  if (!existing) {
    const decks = [seedDeck()];
    write(K_DECKS, decks);
    return decks;
  }
  return read<Deck[]>(K_DECKS, [seedDeck()]);
}
export function saveDecks(decks: Deck[]): void {
  write(K_DECKS, decks);
}

/* ---------- progress ---------- */
export function loadProgress(): ProgressMap {
  return read<ProgressMap>(K_PROGRESS, {});
}
export function saveProgress(m: ProgressMap): void {
  write(K_PROGRESS, m);
}

/* ---------- 전체 초기화(테스트/재시작용) ---------- */
export function resetAll(): void {
  [K_PROFILE, K_DECKS, K_PROGRESS].forEach((k) => localStorage.removeItem(k));
}

/* ---------- JSON 임포트 ----------
   시드 JSON과 동일한 { id, name, words[] } 구조를 받는다.
   같은 id의 덱이 있으면 단어를 병합(중복 word는 갱신)한다. */
export function importDeckJSON(raw: string, decks: Deck[]): Deck[] {
  const parsed = JSON.parse(raw) as Partial<Deck>;
  if (!parsed || !Array.isArray(parsed.words)) {
    throw new Error("올바른 단어장 JSON이 아닙니다 (words 배열이 필요).");
  }
  const deck: Deck = {
    id: parsed.id || `deck-${decks.length + 1}`,
    name: parsed.name || "가져온 단어장",
    words: parsed.words.map(normalizeWord),
  };
  const idx = decks.findIndex((d) => d.id === deck.id);
  if (idx < 0) return [...decks, deck];
  const merged = [...decks];
  const byWord = new Map(merged[idx].words.map((w) => [w.word, w]));
  deck.words.forEach((w) => byWord.set(w.word, w));
  merged[idx] = { ...merged[idx], name: deck.name, words: [...byWord.values()] };
  return merged;
}

/** 느슨한 입력을 안전한 Word로 보정한다. */
export function normalizeWord(w: Partial<Word> & { word: string }): Word {
  const meanings =
    Array.isArray(w.meanings) && w.meanings.length
      ? w.meanings.map((m) => ({
          def: m.def ?? "",
          pos: m.pos ?? "",
          koSentence: m.koSentence ?? "",
        }))
      : [{ def: "", pos: "", koSentence: "" }];
  return {
    word: w.word,
    ipa: w.ipa ?? "",
    ko: Array.isArray(w.ko) ? w.ko : [],
    koStress: typeof w.koStress === "number" ? w.koStress : 0,
    splitBox: !!w.splitBox && meanings.length > 1,
    meanings,
    parts: w.parts,
    story: w.story,
    mnemonic: w.mnemonic,
  };
}
