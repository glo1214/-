/* ------------------------------------------------------------------
   POST /.netlify/functions/meanings
   body: { words: [{ word }] }
   → 뜻이 없는 단어의 뜻/품사 자동 생성 (기획서 6절, 뜻 자동 생성 옵션)
   반환: { words: [{ word, meaning, pos }] }
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

  const words = Array.isArray(body.words) ? body.words.slice(0, 60) : [];
  if (words.length === 0) return jsonResponse(400, { error: "words 필요" });

  const list = words.map((w) => w.word).filter(Boolean).join(", ");

  const system = `너는 한국 수능 영어 단어의 뜻을 다는 도우미다.
주어진 영단어 각각에 수능에서 자주 쓰이는 핵심 한국어 뜻과 품사를 단다.
규칙:
- meaning은 간결한 한국어 뜻(1~2개), pos는 n/v/a/ad 중 하나.
- 반드시 아래 JSON 배열만 출력. 설명 금지.
[{"word":"abandon","meaning":"버리다, 포기하다","pos":"v"}]`;

  try {
    const text = await callClaude({
      model: MODEL,
      max_tokens: 2000,
      system,
      messages: [{ role: "user", content: `단어: ${list}` }],
    });
    const parsed = extractJson(text);
    if (!Array.isArray(parsed)) return jsonResponse(502, { error: "뜻 파싱 실패" });

    const out = parsed
      .filter((w) => w && w.word)
      .map((w) => ({
        word: String(w.word).trim(),
        meaning: String(w.meaning || "").trim(),
        pos: String(w.pos || "").trim().toLowerCase().slice(0, 2),
      }));

    return jsonResponse(200, { words: out });
  } catch (e) {
    return jsonResponse(502, { error: "뜻 생성 실패", detail: String(e.message || e) });
  }
};
