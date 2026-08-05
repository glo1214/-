/* ------------------------------------------------------------------
   POST /.netlify/functions/ocr
   body: { images: [{ media_type, data(base64) }] }
   → 사진 속 단어장을 JSON으로 추출 (기획서 6절)
   반환: { words: [{ word, meaning, pos }] }
------------------------------------------------------------------ */

import { callClaude, extractJson, hasKey, jsonResponse } from "./lib/anthropic.js";

const MODEL = "claude-sonnet-5"; // 손글씨/표 정확도를 위해 vision 강한 모델

export default async (req) => {
  if (req.method !== "POST") return jsonResponse(405, { error: "POST only" });
  if (!hasKey()) return jsonResponse(503, { error: "ANTHROPIC_API_KEY 미설정" });

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(400, { error: "잘못된 요청 본문" });
  }

  const images = Array.isArray(body.images) ? body.images.slice(0, 6) : [];
  if (images.length === 0) return jsonResponse(400, { error: "images 필요" });

  const system = `너는 영어 단어장 사진에서 단어를 정확히 추출하는 OCR 도우미다.
사진(단어 시험지, 단어장, 손글씨 등)에서 영단어와 뜻을 읽어 JSON으로만 반환한다.
규칙:
- 영단어(word), 한국어 뜻(meaning), 품사(pos: n/v/a/ad 중 하나, 모르면 "")를 추출.
- 뜻이 사진에 없으면 meaning은 ""로 두되 word는 반드시 채운다.
- 표는 열이 밀릴 수 있으니 단어-뜻 짝을 신중히 맞춘다.
- 확실하지 않은 단어도 최대한 포함하되, 명백한 잡음은 제외.
- 반드시 아래 JSON 배열만 출력. 설명 금지.
[{"word":"abandon","meaning":"버리다, 포기하다","pos":"v"}]`;

  const content = [];
  for (const img of images) {
    if (!img || !img.data) continue;
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: img.media_type || "image/jpeg",
        data: img.data,
      },
    });
  }
  content.push({ type: "text", text: "이 사진들에서 단어를 추출해서 JSON 배열로 줘." });

  try {
    const text = await callClaude({
      model: MODEL,
      max_tokens: 4000,
      system,
      messages: [{ role: "user", content }],
    });
    const parsed = extractJson(text);
    if (!Array.isArray(parsed)) return jsonResponse(502, { error: "추출 파싱 실패" });

    const words = parsed
      .filter((w) => w && w.word)
      .map((w) => ({
        word: String(w.word).trim(),
        meaning: String(w.meaning || "").trim(),
        pos: normalizePos(w.pos),
      }));

    return jsonResponse(200, { words });
  } catch (e) {
    return jsonResponse(502, { error: "OCR 실패", detail: String(e.message || e) });
  }
};

function normalizePos(pos) {
  const p = String(pos || "").trim().toLowerCase();
  if (["n", "v", "a", "ad"].includes(p)) return p;
  if (p.startsWith("noun")) return "n";
  if (p.startsWith("verb")) return "v";
  if (p.startsWith("adj")) return "a";
  if (p.startsWith("adv")) return "ad";
  return "";
}
