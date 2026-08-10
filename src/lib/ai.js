/* ------------------------------------------------------------------
   AI 기능 클라이언트 — 서버리스 함수(/api/*) 호출

   클라이언트에서 Anthropic API 를 직접 부르지 않는다. API 키는 서버에만 있다.
   서버에 키가 없으면 503 이 오고, 앱은 규칙 기반 질문(fallback.js)으로
   대화를 이어간다. AI 없이도 기록·대화·글쓰기 흐름 전체가 동작한다.
------------------------------------------------------------------ */

const BASE = "/api";

export class AIError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code; // "no_key" | "network" | "failed"
  }
}

async function callFn(name, body) {
  let res;
  try {
    res = await fetch(`${BASE}/${name}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AIError("연결이 불안정해요. 잠시 뒤에 다시 해볼까요?", "network");
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* 본문이 비어 있을 수 있다 */
  }

  if (res.status === 503) {
    throw new AIError("AI 기능이 아직 켜져 있지 않아요.", "no_key");
  }
  if (!res.ok || !data || data.error) {
    throw new AIError((data && data.error) || "AI 요청에 실패했어요.", "failed");
  }
  return data;
}

/* 다음 질문 하나 */
export async function askCoach({ entry, messages }) {
  const data = await callFn("coach", { entry: slimEntry(entry), messages: slimMessages(messages) });
  return String(data.message || "");
}

/* 학생이 '잘 모르겠어'를 눌렀을 때 보여줄 선택지 */
export async function askOptions({ entry, messages }) {
  const data = await callFn("coach", {
    entry: slimEntry(entry),
    messages: slimMessages(messages),
    mode: "options",
  });
  return Array.isArray(data.options) ? data.options : [];
}

/* 대화 종료 후 생각 설계 카드 */
export async function buildCard({ entry, messages, fallbackFrameType }) {
  const data = await callFn("card", {
    entry: slimEntry(entry),
    messages: slimMessages(messages),
    fallbackFrameType,
  });
  return data.card || null;
}

/* 맞춤법 확인 — 학생이 요청했을 때만 호출한다 */
export async function proofread(text) {
  const data = await callFn("proofread", { text });
  return Array.isArray(data.items) ? data.items : [];
}

/* 서버로는 대화에 필요한 필드만 보낸다 (ownerId·id 등은 보내지 않는다) */
function slimEntry(entry) {
  if (!entry) return null;
  return {
    type: entry.type,
    initialNote: entry.initialNote,
    emotionTags: entry.emotionLabels || [],
    bodyFeelings: entry.bodyFeelings || [],
    sourceTitle: entry.sourceTitle || "",
    sourceExtra: entry.sourceExtra || "",
  };
}

function slimMessages(messages) {
  return (messages || [])
    .filter((m) => m.role === "student" || m.role === "assistant")
    .map((m) => ({ role: m.role === "assistant" ? "assistant" : "student", content: m.content }));
}
