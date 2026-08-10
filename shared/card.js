/* ------------------------------------------------------------------
   POST /api/card
   body: { entry, messages, fallbackFrameType }
   → { card }  (기획서 10절 JSON)

   완성된 글이 아니라 '학생이 직접 쓰기 위한 재료'만 만든다.
   모델 응답은 구조화 출력으로 형식을 강제하고, 그 위에 다시
   shared/thinkingCard.js 검증기를 통과시킨다.
------------------------------------------------------------------ */

import { callClaude, extractJson, hasKey, ok, fail } from "./anthropic.js";
import { CARD_SYSTEM } from "./prompts.js";
import { validateThinkingCard, FRAME_TYPES } from "./thinkingCard.js";

const CARD_FORMAT = {
  type: "json_schema",
  schema: {
    type: "object",
    properties: {
      sessionType: { type: "string" },
      studentWords: {
        type: "object",
        properties: {
          coreKeywords: { type: "array", items: { type: "string" } },
          emotionFlow: {
            type: "array",
            items: {
              type: "object",
              properties: {
                emotion: { type: "string" },
                evidence: { type: "string" },
              },
              required: ["emotion", "evidence"],
              additionalProperties: false,
            },
          },
          memorableScenes: { type: "array", items: { type: "string" } },
          studentQuestions: { type: "array", items: { type: "string" } },
          connections: { type: "array", items: { type: "string" } },
        },
        required: [
          "coreKeywords",
          "emotionFlow",
          "memorableScenes",
          "studentQuestions",
          "connections",
        ],
        additionalProperties: false,
      },
      writingFrame: {
        type: "object",
        properties: {
          frameType: { type: "string", enum: FRAME_TYPES },
          sections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                label: { type: "string" },
                guide: { type: "string" },
              },
              required: ["label", "guide"],
              additionalProperties: false,
            },
          },
        },
        required: ["frameType", "sections"],
        additionalProperties: false,
      },
      sentenceStarters: { type: "array", items: { type: "string" } },
    },
    required: ["sessionType", "studentWords", "writingFrame", "sentenceStarters"],
    additionalProperties: false,
  },
};

function transcript(entry, messages) {
  const rows = Array.isArray(messages) ? messages : [];
  const lines = rows
    .filter((m) => m && m.content)
    .map((m) => `${m.role === "assistant" ? "코치" : "학생"}: ${String(m.content).slice(0, 1200)}`);
  return [
    `학생이 처음 적은 기록: ${entry?.initialNote || ""}`,
    Array.isArray(entry?.emotionTags) && entry.emotionTags.length
      ? `학생이 고른 감정: ${entry.emotionTags.join(", ")}`
      : null,
    "",
    "대화:",
    ...lines,
  ]
    .filter((l) => l !== null)
    .join("\n");
}

export async function handleCard(body) {
  if (!hasKey()) return fail(503, "ANTHROPIC_API_KEY 미설정");

  const entry = body?.entry;
  const messages = body?.messages;
  if (!entry) return fail(400, "entry 필요");

  const text = transcript(entry, messages);

  try {
    const res = await callClaude({
      system: CARD_SYSTEM,
      messages: [
        {
          role: "user",
          content: `${text}\n\n위 대화에서 학생이 실제로 한 말만 사용해 생각 설계 카드를 만들어줘. sessionType 은 "${entry.type}" 이다.`,
        },
      ],
      maxTokens: 3000,
      effort: "medium",
      format: CARD_FORMAT,
    });

    const parsed = extractJson(res.text);
    const result = validateThinkingCard(parsed, {
      fallbackFrameType: body?.fallbackFrameType,
    });
    if (!result.ok) return fail(502, result.error);

    return ok({ card: result.card });
  } catch (e) {
    return fail(e.status || 502, e.message || "생각 카드 생성 실패");
  }
}
