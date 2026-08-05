/* ------------------------------------------------------------------
   AI 기능 클라이언트 — Netlify Functions 호출
   (기획서 5절 예문 생성, 6절 사진 OCR)

   서버에 ANTHROPIC_API_KEY 가 없으면 함수가 503 을 돌려주고,
   앱은 수동 입력/기본 예문으로 정상 동작(우아한 열화)한다.
------------------------------------------------------------------ */

const BASE = "/.netlify/functions";

async function callFn(name, body) {
  let res;
  try {
    res = await fetch(`${BASE}/${name}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new AIError("네트워크 오류로 AI 서버에 연결하지 못했어요.", "network");
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* noop */
  }
  if (res.status === 503) {
    throw new AIError(
      "AI 기능이 아직 켜져 있지 않아요. (Netlify 환경변수 ANTHROPIC_API_KEY 필요)",
      "no_key"
    );
  }
  if (!res.ok || !data || data.error) {
    throw new AIError((data && data.error) || `AI 요청 실패 (${res.status})`, "failed");
  }
  return data;
}

export class AIError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

/* 오늘 틀린 단어 3~5개 → 예문 (인터리빙) */
export async function generateSentences(words) {
  const data = await callFn("sentences", { words });
  return Array.isArray(data.sentences) ? data.sentences : [];
}

/* 사진(base64) 여러 장 → 단어 목록 JSON */
export async function ocrWords(images) {
  const data = await callFn("ocr", { images });
  return Array.isArray(data.words) ? data.words : [];
}

/* 뜻이 비어있는 단어들의 뜻 자동 생성 */
export async function fillMeanings(words) {
  const data = await callFn("meanings", { words });
  return Array.isArray(data.words) ? data.words : [];
}
