/* ------------------------------------------------------------------
   POST /api/proofread
   body: { text }
   → { items: [{ original, suggestion, reason }] }

   학생이 '맞춤법 확인'을 눌렀을 때만 호출된다. (기획서 3.4)
   글을 대신 고쳐 쓰지 않고, 원문·제안·이유를 나란히 돌려줄 뿐이다.
   무엇을 반영할지는 학생이 고른다.
------------------------------------------------------------------ */

import { callClaude, extractJson, hasKey, ok, fail } from "./anthropic.js";
import { PROOFREAD_SYSTEM } from "./prompts.js";

const FORMAT = {
  type: "json_schema",
  schema: {
    type: "object",
    properties: {
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            original: { type: "string" },
            suggestion: { type: "string" },
            reason: { type: "string" },
          },
          required: ["original", "suggestion", "reason"],
          additionalProperties: false,
        },
      },
    },
    required: ["items"],
    additionalProperties: false,
  },
};

export async function handleProofread(body) {
  if (!hasKey()) return fail(503, "ANTHROPIC_API_KEY 미설정");

  const text = String(body?.text || "").trim();
  if (!text) return fail(400, "확인할 글이 없어요.");
  if (text.length > 6000) return fail(413, "글이 너무 길어요. 문단을 나누어 확인해 주세요.");

  try {
    const res = await callClaude({
      system: PROOFREAD_SYSTEM,
      messages: [{ role: "user", content: `다음 글에서 맞춤법과 띄어쓰기만 확인해줘.\n\n${text}` }],
      maxTokens: 2500,
      effort: "low",
      format: FORMAT,
    });

    const parsed = extractJson(res.text);
    const rows = Array.isArray(parsed?.items) ? parsed.items : [];

    const items = rows
      .map((r) => ({
        original: String(r?.original || "").trim(),
        suggestion: String(r?.suggestion || "").trim(),
        reason: String(r?.reason || "").trim().slice(0, 120),
      }))
      /* 원문에 실제로 있는 부분만 남긴다.
         모델이 없는 문장을 만들어 내면 학생 글을 바꿔치기하게 되므로 버린다. */
      .filter((r) => r.original && r.suggestion && r.original !== r.suggestion && text.includes(r.original))
      .slice(0, 8);

    return ok({ items });
  } catch (e) {
    return fail(e.status || 502, e.message || "맞춤법 확인 실패");
  }
}
