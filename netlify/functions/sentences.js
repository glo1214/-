/* ------------------------------------------------------------------
   POST /.netlify/functions/sentences
   body: { words: [{ word, meaning, pos }] }
   → 오늘 틀린 단어로 예문 생성 (기획서 5절)
   반환: { sentences: [{ text, translation, targetWords:[word] }] }
------------------------------------------------------------------ */

import { callClaude, extractJson, hasKey, jsonResponse } from "./lib/anthropic.js";

const MODEL = "claude-haiku-4-5";

export default async (req) => {
  if (req.method !== "POST") return jsonResponse(405, { error: "POST only" });
  if (!hasKey()) return jsonResponse(503, { error: "ANTHROPIC_API_KEY 미설정" });

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(400, { error: "잘못된 요청 본문" });
  }

  const words = Array.isArray(body.words) ? body.words.slice(0, 8) : [];
  if (words.length === 0) return jsonResponse(400, { error: "words 필요" });

  const list = words
    .map((w, i) => `${i + 1}. ${w.word} (${w.meaning || ""}${w.pos ? ", " + w.pos : ""})`)
    .join("\n");

  const system = `너는 한국 수능 영어를 준비하는 재수생을 위한 영어 예문 작가다.
학생이 오늘 틀린 단어들로, 수능 지문 난이도의 자연스러운 영어 예문을 만든다.
규칙:
- 단어 하나당 예문 하나. 그 단어를 반드시 문장 안에 그대로 포함한다(어형 변화 없이 원형 그대로).
- 문장은 12~18단어, 하나의 자연스러운 맥락.
- 각 문장에 짧은 한국어 해석을 단다.
- 반드시 아래 JSON 배열만 출력. 그 외 설명 금지.
[{"targetWord":"abandon","text":"They had to abandon the project when funding ran out.","translation":"자금이 떨어지자 그들은 그 프로젝트를 포기해야 했다."}]`;

  const user = `다음 단어들로 예문을 만들어줘:\n${list}`;

  try {
    const text = await callClaude({
      model: MODEL,
      max_tokens: 1500,
      system,
      messages: [{ role: "user", content: user }],
    });
    const parsed = extractJson(text);
    if (!Array.isArray(parsed)) return jsonResponse(502, { error: "예문 파싱 실패" });

    const sentences = parsed
      .filter((s) => s && s.text && s.targetWord)
      .map((s) => ({
        text: String(s.text).trim(),
        translation: String(s.translation || "").trim(),
        targetWords: [String(s.targetWord).trim()],
      }));

    return jsonResponse(200, { sentences });
  } catch (e) {
    return jsonResponse(502, { error: "예문 생성 실패", detail: String(e.message || e) });
  }
};
