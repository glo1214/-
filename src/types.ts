/* ------------------------------------------------------------------
   v1 데이터 모델. 시드 JSON 구조를 그대로 쓴다.
   저장 키는 profile / decks / progress 세 개.
------------------------------------------------------------------ */

export type Pos = "n" | "v" | "a" | "ad" | string;

export interface EtymPart {
  text: string; // 어근/접사 표기
  gloss: string; // 뜻풀이
}

export interface Meaning {
  def: string; // 한글 뜻
  pos: Pos; // 품사 (오답 선지: 같은 품사 우선)
  koSentence: string; // 카드2용 한글 예문. 빈칸은 "____"
}

export interface Word {
  word: string;
  ipa: string; // 발음기호
  ko: string[]; // 한글 발음 음절 — "·"로 이어 표시
  koStress: number; // 강세 음절 인덱스 (강조색)
  splitBox: boolean; // true면 뜻별로 progress 분리(#0,#1,...)
  meanings: Meaning[]; // splitBox false면 항상 length 1
  parts?: EtymPart[]; // 어원 카드 (표시만; 생성은 v2)
  story?: string; // 어원 스토리
  mnemonic?: string; // 연상 문구
}

export interface Deck {
  id: string;
  name: string;
  words: Word[];
}

/** progress 키는 `단어#뜻인덱스`. splitBox:false면 항상 `#0`. */
export interface Progress {
  box: number; // 1..5 (Leitner)
  nextDue: string; // "YYYY-MM-DD"
  wrongCount: number;
  avgMs: number; // 평균 응답 시간
  weak: boolean; // 정답이지만 느렸던 이력
  lastSeen: string | null; // "YYYY-MM-DD" — 오늘이면 승급 판정 안 함
  confusedWith: Record<string, number>; // 고른 오답 단어 -> 횟수
  reps?: number; // 총 등장(응답) 횟수 — retireAfter 이상이면 자동 제외
}

export type ProgressMap = Record<string, Progress>;

export interface Profile {
  examDate: string | null; // "YYYY-MM-DD" — D-day 표시용
  dailyNew: number; // 하루 새 단어 수
  dailyReviewCap: number; // 하루 복습 상한
  cardsEnabled: { card1: boolean; card2: boolean; card3: boolean };
  useEtymology: boolean; // 어원 카드 표시
  useKoPron: boolean; // 한글 발음 표기 표시
  timeThreshold: { fast: number; slow: number }; // ms 판정 임계값
  retireAfter: number; // 반복(reps) 이 값 이상이면 자동 제외. 0이면 끔
}

/* ---------- 학습 세션 ---------- */

export type CardType = 1 | 2 | 3;
export type Answer = "correct" | "wrong" | "dunno";

/** 세션 큐 아이템. isReinsert를 명시적으로 들고 다닌다. */
export interface QueueItem {
  key: string; // 단어#뜻인덱스
  word: Word;
  meaningIndex: number;
  card: CardType;
  isReinsert: boolean; // 세션 내 재삽입분 → 승급 금지
}

export interface Choice {
  label: string; // 화면에 보이는 텍스트
  word: string; // 이 선지가 가리키는 단어(오답 기록용)
  correct: boolean;
  explain: string; // 뒤집었을 때 보여줄 해설
}

export interface Question extends QueueItem {
  prompt: string; // 문제 지시문/본문
  choices: Choice[];
}
