/* ------------------------------------------------------------------
   POST /api/coach
   body: {
     entry: { type, initialNote, emotionTags[], bodyFeelings[], sourceTitle, sourceExtra },
     messages: [{ role: "student" | "assistant", content }],
     mode: "question" | "options"
   }
   → { message } 또는 { options: [string] }

   AI 가 완성된 글을 쓰지 못하도록 서버에서 한 번 더 잘라낸다.
------------------------------------------------------------------ */

import { callClaude, extractJson, hasKey, ok, fail } from "./anthropic.js";
import { COACH_SYSTEM } from "./prompts.js";

const TYPE_LABEL = {
  daily_emotion: "오늘의 감정과 일상",
  attraction: "마음이 끌린 것",
  thought: "문득 떠오른 생각",
  book: "책을 읽고 든 생각",
  movie: "영화를 보고 든 생각",
  news: "뉴스와 세상 이야기",
  career: "나와 진로에 관한 생각",
};

/* 학생이 읽는 답변은 짧아야 한다.
   문장 3개 + 물음표 1개까지만 남기고 나머지는 버린다. */
function enforceOneQuestion(raw) {
  let text = String(raw || "").trim();
  if (!text) return "";

  // 코드블록·목록 기호는 대화에 어울리지 않으므로 제거
  text = text.replace(/```[\s\S]*?```/g, "").replace(/^[-*•]\s*/gm, "");

  const sentences = text.match(/[^.!?…]+[.!?…]*/g) || [text];
  const kept = [];
  for (const s of sentences) {
    kept.push(s.trim());
    if (s.includes("?")) break; // 첫 질문에서 멈춘다
    if (kept.length >= 3) break;
  }
  let out = kept.join(" ").trim();
  if (out.length > 220) out = out.slice(0, 220).trim();
  return out;
}

function describeEntry(entry) {
  if (!entry) return "";
  const lines = [];
  lines.push(`기록 유형: ${TYPE_LABEL[entry.type] || "기록"}`);
  if (entry.sourceTitle) lines.push(`작품/기사: ${entry.sourceTitle}${entry.sourceExtra ? ` (${entry.sourceExtra})` : ""}`);
  if (Array.isArray(entry.emotionTags) && entry.emotionTags.length)
    lines.push(`학생이 고른 감정: ${entry.emotionTags.join(", ")}`);
  if (Array.isArray(entry.bodyFeelings) && entry.bodyFeelings.length)
    lines.push(`몸의 느낌: ${entry.bodyFeelings.join(", ")}`);
  lines.push(`학생이 처음 적은 기록: ${entry.initialNote || "(비어 있음)"}`);
  return lines.join("\n");
}

/* 대화 이력을 Messages API 형식으로 바꾼다.
   첫 번째 user 메시지에 기록 내용을 붙인다. */
function toMessages(entry, history) {
  const rows = Array.isArray(history) ? history.filter((m) => m && m.content) : [];
  const out = [
    {
      role: "user",
      content: `${describeEntry(entry)}\n\n이 기록을 읽고 첫 질문을 하나만 해줘.`,
    },
  ];
  for (const m of rows.slice(-24)) {
    const role = m.role === "assistant" ? "assistant" : "user";
    const content = String(m.content).slice(0, 2000);
    // 같은 역할이 연달아 오면 합친다 (API 는 교대를 요구하지 않지만 맥락이 깔끔해진다)
    const last = out[out.length - 1];
    if (last && last.role === role) last.content += `\n${content}`;
    else out.push({ role, content });
  }
  if (out[out.length - 1].role === "assistant") {
    out.push({ role: "user", content: "(학생이 답을 이어가지 못했어요. 다른 방향으로 질문 하나만 해줘.)" });
  }
  return out;
}

const OPTIONS_FORMAT = {
  type: "json_schema",
  schema: {
    type: "object",
    properties: {
      options: {
        type: "array",
        items: { type: "string" },
      },
    },
    required: ["options"],
    additionalProperties: false,
  },
};

export async function handleCoach(body) {
  if (!hasKey()) return fail(503, "ANTHROPIC_API_KEY 미설정");

  const entry = body?.entry;
  const history = body?.messages;
  const mode = body?.mode === "options" ? "options" : "question";

  if (!entry || typeof entry !== "object") return fail(400, "entry 필요");

  const messages = toMessages(entry, history);

  try {
    if (mode === "options") {
      const { text } = await callClaude({
        system: `${COACH_SYSTEM}

지금 학생이 "잘 모르겠어"라고 답했다. 방금 네가 한 질문에 대해 학생이 고를 수 있는
짧은 선택지 3개를 만들어라. 각 선택지는 12자 이내의 학생 말투 표현이다.
학생이 하지 않은 경험을 만들어 내지 않는다. JSON 으로만 답한다.`,
        messages,
        maxTokens: 1200,
        effort: "low",
        format: OPTIONS_FORMAT,
      });
      const parsed = extractJson(text);
      const options = Array.isArray(parsed?.options)
        ? parsed.options.map((s) => String(s).trim().slice(0, 24)).filter(Boolean).slice(0, 4)
        : [];
      return ok({ options });
    }

    const { text } = await callClaude({
      system: COACH_SYSTEM,
      messages,
      maxTokens: 1600,
      effort: "low",
    });

    const message = enforceOneQuestion(text);
    if (!message) return fail(502, "AI 응답이 비어 있어요.");
    return ok({ message });
  } catch (e) {
    return fail(e.status || 502, e.message || "AI 요청 실패");
  }
}
