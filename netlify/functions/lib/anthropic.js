/* ------------------------------------------------------------------
   Anthropic Messages API 호출 헬퍼 (서버리스 전용)
   서버리스 함수는 번들을 가볍게 유지하려고 SDK 대신 fetch 사용.
------------------------------------------------------------------ */

const API_URL = "https://api.anthropic.com/v1/messages";
const VERSION = "2023-06-01";

export function jsonResponse(status, obj) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export function hasKey() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function callClaude({ model, max_tokens, system, messages }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": VERSION,
    },
    body: JSON.stringify({ model, max_tokens, system, messages }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic ${res.status}: ${body.slice(0, 400)}`);
  }

  const data = await res.json();
  return (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");
}

/* 모델 응답에서 JSON 배열/객체만 안전하게 뽑아 파싱 */
export function extractJson(text) {
  if (!text) return null;
  // ```json ... ``` 코드펜스 제거
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();

  // 첫 [ 또는 { 부터 마지막 ] 또는 } 까지
  const firstArr = t.indexOf("[");
  const firstObj = t.indexOf("{");
  let start = -1;
  if (firstArr === -1) start = firstObj;
  else if (firstObj === -1) start = firstArr;
  else start = Math.min(firstArr, firstObj);
  if (start === -1) return null;

  const open = t[start];
  const close = open === "[" ? "]" : "}";
  const end = t.lastIndexOf(close);
  if (end === -1 || end < start) return null;

  try {
    return JSON.parse(t.slice(start, end + 1));
  } catch {
    return null;
  }
}
