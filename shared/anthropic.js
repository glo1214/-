/* ------------------------------------------------------------------
   Claude Messages API 호출 헬퍼 (서버 전용)

   서버리스 함수 번들을 가볍게 유지하려고 SDK 대신 fetch 를 쓴다.
   이 파일은 Vercel(/api) 과 Netlify(/netlify/functions) 양쪽에서 함께 쓴다.

   API 키는 서버 환경변수(ANTHROPIC_API_KEY)에서만 읽는다.
   클라이언트 번들에는 이 파일이 절대 포함되지 않는다.
------------------------------------------------------------------ */

const API_URL = "https://api.anthropic.com/v1/messages";
const VERSION = "2023-06-01";

/* 모델은 환경변수로 바꿀 수 있게 열어둔다 */
export const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5";

export function hasKey() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export class ClaudeError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

/**
 * Messages API 호출.
 * effort 로 답변 깊이를 조절한다. (claude-opus-5 는 temperature/top_p 를 받지 않는다)
 * max_tokens 는 사고 토큰 + 응답 토큰의 합을 덮는 상한이므로 여유 있게 잡는다.
 */
export async function callClaude({
  system,
  messages,
  maxTokens = 2000,
  effort = "low",
  format = null,
}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new ClaudeError("ANTHROPIC_API_KEY 미설정", 503);

  const outputConfig = { effort };
  if (format) outputConfig.format = format;

  let res;
  try {
    res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": VERSION,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        system,
        messages,
        output_config: outputConfig,
      }),
    });
  } catch (e) {
    throw new ClaudeError("AI 서버에 연결하지 못했습니다.", 502);
  }

  if (!res.ok) {
    const body = await res.text();
    // 자세한 오류는 서버 로그로만 남기고 사용자 화면에는 짧게 전달한다.
    console.error(`Anthropic ${res.status}: ${body.slice(0, 500)}`);
    if (res.status === 429) throw new ClaudeError("지금 요청이 몰려 있어요. 잠시 뒤에 다시 시도해 주세요.", 429);
    throw new ClaudeError("AI 응답을 받지 못했습니다.", 502);
  }

  const data = await res.json();

  /* 안전 분류기가 요청을 거절한 경우 content 가 비어 있을 수 있다.
     content[0] 을 바로 읽지 않는다. */
  if (data.stop_reason === "refusal") {
    throw new ClaudeError("이 내용은 AI가 답변하기 어려워요. 다른 방식으로 적어볼까요?", 422);
  }

  const text = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  return { text, stopReason: data.stop_reason };
}

/* 모델 응답에서 JSON 객체만 안전하게 뽑아 파싱 */
export function extractJson(text) {
  if (!text) return null;
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();

  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;

  try {
    return JSON.parse(t.slice(start, end + 1));
  } catch {
    return null;
  }
}

/* 서버리스 응답 공통 형태 — 어댑터(api/, netlify/functions/)에서 변환한다 */
export function ok(body) {
  return { status: 200, body };
}

export function fail(status, message) {
  return { status, body: { error: message } };
}
