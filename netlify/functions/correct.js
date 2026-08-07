/* ------------------------------------------------------------------
   POST /.netlify/functions/correct
   body: { text: "사용자 영어 일기", name?: "이름" }

   → 원어민 첨삭 + 영어식 사고 설명 + Thinking Map + 핵심 패턴
     + 오늘 배운 표현 + 영어 습관 분석 을 JSON 으로 반환.

   API 키(ANTHROPIC_API_KEY)는 서버 환경변수에만 존재 →
   학생은 키를 보거나 만질 수 없다(안전). 키가 없으면 503 을 돌려주고
   프런트가 오프라인 연습 모드로 우아하게 전환한다.
------------------------------------------------------------------ */
import { callClaude, extractJson, hasKey, jsonResponse } from "./lib/anthropic.js";

const MODEL = process.env.THINK_MODEL || "claude-haiku-4-5";

const SYSTEM = `너는 한국인 학생의 영어 일기를 첨삭하는 다정하고 정확한 원어민 영어 선생님이다.
목표는 "번역"이 아니라 학생이 "영어로 생각하는 습관"을 기르도록 돕는 것이다.

반드시 아래 JSON 객체 하나만 출력한다. 코드펜스·설명·인사말 금지.

{
  "corrected": "일기 전체를 자연스러운 원어민 영어로 다시 쓴 글(문단 유지, 학생의 의도·사실은 바꾸지 않음)",
  "sentences": [
    {
      "original": "학생이 쓴 원래 문장(영어. 한국어로 썼으면 그대로)",
      "corrected": "자연스러운 원어민 버전",
      "reason": "무엇을 왜 고쳤는지 쉬운 한국어 설명 (1~2문장)"
    }
  ],
  "thinkingExplanation": "이 일기에서 드러나는 '한국어식 사고 → 영어식 사고'의 핵심 차이를 쉬운 한국어로 2~4문장 설명. 예: 영어는 원인→결과를 'Now that...'으로 연결한다 등.",
  "thinkingMap": [
    {"step": "사건", "en": "eat breakfast"},
    {"step": "연결", "en": "Now that I've eaten..."},
    {"step": "결과", "en": "I'm getting sleepy"}
  ],
  "patterns": [
    {"pattern": "Now that + 주어 + have/has + p.p.", "example": "Now that I've eaten breakfast, I'm getting sleepy.", "meaningKo": "~하고 나니 (원인→결과)"}
  ],
  "expressions": ["I'm getting sleepy.", "Turn it off.", "Now that ..."],
  "habit": {
    "strengths": ["과거시제를 잘 씀"],
    "weaknesses": ["관사 the/a 를 자주 빠뜨림"],
    "recommendation": "이번 주 목표: 현재완료(have p.p.)를 5번 써 보기",
    "scores": {"현재완료": 2, "관사": 2, "전치사": 3, "어휘 다양성": 3, "문장 연결": 3}
  }
}

규칙:
- corrected 는 학생이 실제로 표현하려던 내용을 살리되 원어민이 실제 쓰는 표현으로.
- sentences 는 의미 있는 교정 위주로 3~8개. 원문이 이미 자연스러우면 reason 에 칭찬을 담아도 된다.
- 학생이 한국어로 쓴 부분이 있으면 영어로 옮기고 reason 에 표시.
- thinkingMap 은 3~5단계, 이 일기에서 가장 대표적인 사고 흐름 하나를 시각화.
- expressions 는 통째로 외우면 좋은 짧은 표현 3~6개.
- scores 는 1~5 정수(5가 가장 좋음). 한국어 항목명 사용.
- 모든 설명(reason, thinkingExplanation, recommendation, strengths, weaknesses)은 한국어.
- 격려하는 따뜻한 톤. 하지만 정확성 우선.`;

export default async (req) => {
  if (req.method !== "POST") return jsonResponse(405, { error: "POST only" });
  if (!hasKey()) return jsonResponse(503, { error: "ANTHROPIC_API_KEY 미설정" });

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(400, { error: "잘못된 요청 본문" });
  }

  const text = String(body.text || "").trim().slice(0, 4000);
  const name = String(body.name || "").trim().slice(0, 40);
  if (!text) return jsonResponse(400, { error: "text 필요" });

  const userMsg = `${name ? `학생 이름: ${name}\n` : ""}오늘의 영어 일기:\n"""\n${text}\n"""`;

  try {
    const out = await callClaude({
      model: MODEL,
      max_tokens: 2200,
      system: SYSTEM,
      messages: [{ role: "user", content: userMsg }],
    });
    const parsed = extractJson(out);
    if (!parsed || typeof parsed !== "object" || !parsed.corrected) {
      return jsonResponse(502, { error: "첨삭 결과를 해석하지 못했어요." });
    }
    return jsonResponse(200, parsed);
  } catch (e) {
    return jsonResponse(502, { error: "AI 첨삭 실패", detail: String(e.message || e) });
  }
};
