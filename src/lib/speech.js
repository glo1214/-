/* ------------------------------------------------------------------
   브라우저 내장 음성 API 래퍼 — API 키 불필요.
   - TTS: speechSynthesis (원어민 음성 듣기)
   - STT: webkitSpeechRecognition (따라 말하기 → 텍스트 인식)
   두 기능 모두 브라우저/OS 지원 여부에 따라 우아하게 비활성화된다.
------------------------------------------------------------------ */

export const ttsSupported =
  typeof window !== "undefined" && "speechSynthesis" in window;

export const sttSupported =
  typeof window !== "undefined" &&
  ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);

/* 사용 가능한 영어 음성 목록(로드가 비동기라 콜백 제공) */
export function listEnglishVoices() {
  if (!ttsSupported) return [];
  return window.speechSynthesis
    .getVoices()
    .filter((v) => /^en(-|_)?/i.test(v.lang));
}

export function onVoicesReady(cb) {
  if (!ttsSupported) return () => {};
  const fire = () => cb(listEnglishVoices());
  fire();
  window.speechSynthesis.addEventListener("voiceschanged", fire);
  return () => window.speechSynthesis.removeEventListener("voiceschanged", fire);
}

let currentUtterance = null;

export function speak(text, { voiceURI = "", rate = 0.95, onend, onstart } = {}) {
  if (!ttsSupported || !text) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const chosen =
      (voiceURI && voices.find((v) => v.voiceURI === voiceURI)) ||
      voices.find((v) => /^en-US/i.test(v.lang)) ||
      voices.find((v) => /^en/i.test(v.lang));
    if (chosen) u.voice = chosen;
    u.lang = chosen?.lang || "en-US";
    u.rate = rate;
    u.pitch = 1;
    if (onstart) u.onstart = onstart;
    if (onend) u.onend = onend;
    currentUtterance = u;
    window.speechSynthesis.speak(u);
  } catch (e) {
    console.warn("TTS 실패", e);
  }
}

export function stopSpeaking() {
  if (ttsSupported) window.speechSynthesis.cancel();
  currentUtterance = null;
}

/* 한 번 듣고 인식 결과(문자열)를 돌려주는 STT.
   반환: { stop() } 컨트롤러. 결과는 onResult/onError 콜백으로. */
export function recognizeOnce({ onResult, onError, onEnd } = {}) {
  if (!sttSupported) {
    onError?.("이 브라우저는 음성 인식을 지원하지 않아요. (Chrome 권장)");
    return { stop() {} };
  }
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  const rec = new Rec();
  rec.lang = "en-US";
  rec.interimResults = true;
  rec.maxAlternatives = 1;
  rec.continuous = false;
  let finalText = "";
  rec.onresult = (e) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) finalText += r[0].transcript;
      else interim += r[0].transcript;
    }
    onResult?.({ final: finalText.trim(), interim: interim.trim() });
  };
  rec.onerror = (e) => onError?.(mapErr(e.error));
  rec.onend = () => onEnd?.(finalText.trim());
  try {
    rec.start();
  } catch (e) {
    onError?.("음성 인식을 시작하지 못했어요.");
  }
  return {
    stop() {
      try {
        rec.stop();
      } catch {
        /* noop */
      }
    },
  };
}

function mapErr(code) {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "마이크 권한이 필요해요. 브라우저 주소창에서 마이크를 허용해 주세요.";
    case "no-speech":
      return "소리가 들리지 않았어요. 다시 말해 볼까요?";
    case "audio-capture":
      return "마이크를 찾을 수 없어요.";
    default:
      return "음성 인식 중 문제가 생겼어요.";
  }
}

/* 두 영어 문장의 유사도(0~1) — 따라 말하기 채점용. 단어 집합 기준. */
export function similarity(a, b) {
  const norm = (s) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9'\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean);
  const wa = norm(a);
  const wb = norm(b);
  if (!wa.length || !wb.length) return 0;
  // 순서를 고려한 최장공통부분수열 기반 점수
  const m = wa.length,
    n = wb.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] =
        wa[i - 1] === wb[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);
  return dp[m][n] / Math.max(m, n);
}
