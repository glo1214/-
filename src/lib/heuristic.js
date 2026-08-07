/* ------------------------------------------------------------------
   오프라인 첨삭 폴백 — AI 서버 키가 없을 때도 앱이 "쓸모"를 유지하도록
   규칙 기반으로 가벼운 교정과 패턴 추출을 제공한다.
   (원어민 수준 첨삭은 AI 필요 — 아래는 어디까지나 연습용 보조.)
------------------------------------------------------------------ */

function splitSentences(text) {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// 자주 쓰는 콩글리시/오타 최소 교정 사전
const FIXES = [
  [/\bi\b/g, "I"],
  [/\bim\b/gi, "I'm"],
  [/\bdont\b/gi, "don't"],
  [/\bcant\b/gi, "can't"],
  [/\bdidnt\b/gi, "didn't"],
  [/\bwont\b/gi, "won't"],
  [/\bive\b/gi, "I've"],
  [/\bid\b/gi, "I'd"],
  [/\bteh\b/gi, "the"],
  [/\balot\b/gi, "a lot"],
  [/\bwanna\b/gi, "want to"],
  [/\bgonna\b/gi, "going to"],
];

function fixSentence(s) {
  let out = s;
  for (const [re, to] of FIXES) out = out.replace(re, to);
  out = out.replace(/\s+([,.!?])/g, "$1"); // 문장부호 앞 공백 제거
  out = out.replace(/\s{2,}/g, " ").trim();
  if (out) out = out[0].toUpperCase() + out.slice(1);
  if (out && !/[.!?]$/.test(out)) out += ".";
  return out;
}

export function offlineCorrect(text) {
  const sentences = splitSentences(text);
  const outSentences = [];
  const corrected = [];
  for (const s of sentences) {
    const fixed = fixSentence(s);
    corrected.push(fixed);
    if (fixed !== s) {
      outSentences.push({
        original: s,
        corrected: fixed,
        reason: "대문자·문장부호·기본 축약형을 정리했어요. 자연스러운 원어민 표현 첨삭은 AI 첨삭을 켜면 볼 수 있어요.",
      });
    } else {
      outSentences.push({
        original: s,
        corrected: fixed,
        reason: "형태상 큰 문제는 없어요. 더 자연스러운 표현 제안은 AI 첨삭에서!",
      });
    }
  }

  // 표현 추출: 6단어 이하의 짧고 유용한 문장
  const expressions = corrected
    .filter((s) => s.split(/\s+/).length <= 6)
    .slice(0, 5);

  return {
    corrected: corrected.join(" "),
    sentences: outSentences,
    thinkingExplanation:
      "지금은 오프라인 연습 모드예요. 문장을 소리 내어 5번 읽고, 짧은 표현을 통째로 외워 보세요. AI 첨삭을 켜면 '왜 영어는 이렇게 말하는지' 사고방식 설명과 원어민 교정을 받을 수 있어요.",
    thinkingMap: sentences.slice(0, 4).map((s, i) => ({
      step: i === 0 ? "생각" : `문장 ${i}`,
      en: corrected[i] || "",
    })),
    patterns: [],
    expressions,
    habit: null,
  };
}
