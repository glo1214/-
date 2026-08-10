/* ------------------------------------------------------------------
   AI 없이도 동작하는 대체 경로

   서버에 API 키가 없거나 연결이 끊겼을 때 쓰인다.
   - 질문: 단계별 질문 은행에서 아직 하지 않은 질문을 하나 고른다.
   - 생각 카드: 학생이 실제로 쓴 문장에서만 뽑아 만든다.
     (없는 내용을 지어내지 않는다는 원칙은 여기서도 똑같이 지킨다)
------------------------------------------------------------------ */

import { EMOTIONS, defaultFrameFor, frameOf } from "./types.js";

/* 1단계 장면 → 2단계 감정 → 3단계 이유 → 4단계 연결 → 5단계 의미 */
const QUESTION_BANK = {
  common: [
    ["언제 있었던 일이야?", "어디에서 있었던 일이야?", "그때 누가 함께 있었어?", "지금도 눈앞에 그려지는 장면은 어떤 모습이야?"],
    ["그때 처음에는 어떤 기분이었어?", "그 기분이 중간에 달라진 순간이 있었어?", "그 감정을 다른 말로 바꾸면 어떤 말에 가까울까?", "그때 몸에서는 어떤 느낌이 났어?"],
    ["그게 왜 마음에 남았을까?", "네가 기대했던 것과 무엇이 달랐어?", "그 순간 네가 중요하게 생각한 건 뭐였을까?"],
    ["비슷한 일이 전에도 있었어?", "이 일을 다른 사람은 어떻게 봤을까?", "책이나 영화에서 비슷한 장면을 본 적 있어?"],
    ["이 일을 겪고 새로 알게 된 게 있어?", "아직 답을 못 내린 질문이 있다면 뭐야?", "다음에 비슷한 일이 생기면 어떻게 하고 싶어?"],
  ],
  book: [
    ["그 장면에서 인물은 무엇을 하고 있었어?", "책에서 가장 오래 멈춰 읽은 부분은 어디야?"],
    ["그 장면을 읽을 때 어떤 기분이 들었어?", "인물의 선택을 보고 마음이 어땠어?"],
    ["인물은 왜 그렇게 했을까?", "너라면 그 상황에서 어떻게 했을 것 같아?"],
    ["네 경험 중에 이 장면과 이어지는 게 있어?", "이 이야기가 요즘 세상과 닿아 있는 부분이 있을까?"],
    ["읽기 전과 후에 달라진 생각이 있어?", "작가가 던지고 싶었던 질문은 뭐였을까?"],
  ],
  movie: [
    ["그 장면에서 화면에 무엇이 보였어?", "인물은 그때 무슨 말을 했어?"],
    ["그 장면을 보면서 어떤 감정이 들었어?", "영화가 끝나고 남은 기분은 어땠어?"],
    ["인물은 왜 그런 선택을 했을까?", "그 선택에 대해 너는 어떻게 생각해?"],
    ["네 경험이나 주변에서 본 일과 이어지는 부분이 있어?", "다른 사람은 이 장면을 다르게 볼 수도 있을까?"],
    ["결말에 대해 너는 어떻게 판단해?", "이 영화가 남긴 질문은 뭐야?"],
  ],
  news: [
    ["기사에서 무슨 일이 일어났어?", "그 일은 어디에서 언제 일어났어?"],
    ["그 기사를 읽고 어떤 마음이 들었어?", "특히 어떤 문장에서 멈췄어?"],
    ["왜 이런 일이 일어났을까?", "이 일이 왜 중요한 문제라고 생각해?"],
    ["이 일로 영향을 받는 사람은 누구일까?", "반대 입장에서는 뭐라고 말할까?"],
    ["기사에서 사실과 의견을 나눈다면 어디까지가 사실일까?", "더 확인해보고 싶은 정보가 있어?"],
  ],
  career: [
    ["그 일을 할 때 어떤 장면이 떠올라?", "최근에 그 일을 한 건 언제였어?"],
    ["그걸 할 때 기분이 어때?", "다 하고 났을 때는 어떤 느낌이야?"],
    ["그중에서 특히 어떤 부분이 재미있어?", "그 일을 할 때 가장 시간이 빨리 가는 부분은 어디야?"],
    ["다른 사람들은 너에게 무엇을 자주 부탁해?", "부러워하는 사람이 있다면 어떤 모습이 부러워?"],
    ["힘들어도 계속하고 싶은 이유가 있어?", "더 알아보려면 무엇을 해볼 수 있을까?"],
  ],
  attraction: [
    ["그중에서 가장 먼저 눈에 들어온 부분은 뭐야?", "그걸 처음 본 게 언제였어?"],
    ["그걸 볼 때 마음이 어때?", "끌리면서도 불편했던 부분이 있었어?"],
    ["왜 그게 마음에 남았을까?", "비슷한 느낌을 받은 다른 것이 또 있어?"],
    ["그걸 처음 좋아하게 된 순간이 기억나?", "주변에 같은 걸 좋아하는 사람이 있어?"],
    ["네가 직접 만든다면 어떤 점을 바꾸고 싶어?", "더 알아보고 싶은 게 생겼어?"],
  ],
};

const STOP_WORDS = new Set([
  "그리고","그래서","그런데","하지만","저는","제가","내가","나는","너무","정말","조금","약간","계속",
  "이렇게","그렇게","무슨","어떤","때문에","같은","같아","같다","있었다","없었다","했다","하는","해서",
  "것을","것이","것도","거는","거를","건데","라고","에서","에게","한테","까지","부터","보다","처럼",
]);

/* 지금까지 하지 않은 질문 하나를 고른다 */
export function nextFallbackQuestion({ entryType, askedQuestions = [], turn = 0 }) {
  const banks = [QUESTION_BANK[entryType], QUESTION_BANK.common].filter(Boolean);
  const stage = Math.min(turn, 4);

  // 현재 단계부터 훑고, 다 썼으면 뒷 단계로 넘어간다
  for (let s = stage; s < 5; s++) {
    for (const bank of banks) {
      const stageQuestions = bank[s] || [];
      const found = stageQuestions.find((q) => !askedQuestions.includes(q));
      if (found) return found;
    }
  }
  for (let s = 0; s < 5; s++) {
    for (const bank of banks) {
      const found = (bank[s] || []).find((q) => !askedQuestions.includes(q));
      if (found) return found;
    }
  }
  return null; // 물어볼 게 남지 않았으면 대화를 마치도록 안내한다
}

/* 학생이 답하기 어려워할 때 보여줄 기본 선택지 */
export function fallbackOptions() {
  return ["잘 기억 안 나", "말로 하기 어려워", "별일 아닌 것 같아", "다른 걸 말하고 싶어"];
}

/* ---------- AI 없이 만드는 생각 카드 ---------- */

function studentText(messages) {
  return (messages || [])
    .filter((m) => m.role === "student")
    .map((m) => m.content)
    .join(" ");
}

function sentencesOf(text) {
  return String(text)
    .split(/(?<=[.!?…])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1);
}

/* 형태소 분석기 없이 쓰는 대략적인 걸러내기.
   '끝나고', '피곤했는데' 같은 활용형은 키워드로 보여주기 어색해서 뺀다. */
const VERBISH = /(했|였|었|겠|니까|는데|아서|어서)/;
const VERB_TAIL = /(고|서|데|까|어|아|지|네|며|만|면)$/;

function looksLikeVerb(word) {
  return VERBISH.test(word) || (word.length > 2 && VERB_TAIL.test(word));
}

function topWords(text, limit = 5) {
  const counts = new Map();
  for (const raw of String(text).split(/[^가-힣a-zA-Z0-9]+/)) {
    const w = raw.trim();
    if (w.length < 2 || w.length > 12) continue;
    if (STOP_WORDS.has(w)) continue;
    if (looksLikeVerb(w)) continue;
    counts.set(w, (counts.get(w) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .slice(0, limit)
    .map(([w]) => w);
}

export function buildLocalCard({ entry, messages }) {
  const all = `${entry?.initialNote || ""} ${studentText(messages)}`.trim();

  /* 답변을 한 덩어리로 잇지 않는다.
     기록 하나와 답변 하나가 각각 별개의 조각이다. */
  const chunks = [
    entry?.initialNote || "",
    ...(messages || []).filter((m) => m.role === "student").map((m) => m.content),
  ]
    .flatMap((c) => sentencesOf(c))
    .map((s) => s.trim())
    .filter(Boolean);

  /* 물음표를 안 찍는 학생이 많아서 '궁금해', '~일까' 같은 표현도 질문으로 본다 */
  const isQuestion = (s) => /\?|궁금|일까|을까|ㄹ까/.test(s);
  const questions = chunks.filter(isQuestion).slice(0, 3);
  const scenes = [...new Set(chunks.filter((s) => !isQuestion(s)))]
    .sort((a, b) => b.length - a.length)
    .slice(0, 2)
    .map((s) => (s.length > 90 ? `${s.slice(0, 90)}…` : s));

  /* 감정은 학생이 고른 태그와, 학생이 실제로 쓴 감정 단어에서만 가져온다 */
  const picked = entry?.emotionLabels || [];
  const written = EMOTIONS.filter((e) => e.id !== "unknown" && all.includes(e.label)).map((e) => e.label);
  const emotions = [...new Set([...picked, ...written])].filter((l) => l !== "아직 잘 모르겠음");

  const frameType = defaultFrameFor(entry?.type);
  const frame = frameOf(frameType);

  return {
    sessionType: entry?.type || "daily_emotion",
    generatedBy: "local", // AI 없이 만든 카드임을 화면에 표시한다
    studentWords: {
      coreKeywords: topWords(all, 5),
      emotionFlow: emotions.slice(0, 4).map((label) => ({ emotion: label, evidence: "" })),
      memorableScenes: scenes,
      studentQuestions: questions,
      connections: [], // 지어내지 않는다
    },
    writingFrame: { frameType, sections: frame.sections },
    sentenceStarters: [
      "마음이 오래 머문 순간은 ________이다.",
      "처음에는 ________했지만 점점 ________했다.",
      "내가 이 일에 계속 마음이 가는 이유는 ________일지도 모른다.",
      "아직 답하지 못한 질문은 ________이다.",
    ],
  };
}
