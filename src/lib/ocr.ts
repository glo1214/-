/* ------------------------------------------------------------------
   사진 → 단어 인식 (v2 기능, 클라이언트 전용).
   Tesseract.js를 런타임에 CDN에서 불러와 브라우저 안에서 OCR 한다.
   서버·외부 AI API 없음. 인식 결과는 화면에서 확인·수정 후 저장한다.
------------------------------------------------------------------ */

type ProgressFn = (progress: number, status: string) => void;

const TESSERACT_URL = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";

let loader: Promise<unknown> | null = null;

function loadTesseract(): Promise<unknown> {
  const w = window as unknown as { Tesseract?: unknown };
  if (w.Tesseract) return Promise.resolve(w.Tesseract);
  if (loader) return loader;
  loader = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = TESSERACT_URL;
    s.async = true;
    s.onload = () => resolve((window as unknown as { Tesseract: unknown }).Tesseract);
    s.onerror = () =>
      reject(new Error("글자 인식 기능을 불러오지 못했어요. 인터넷 연결을 확인해 주세요."));
    document.head.appendChild(s);
  });
  return loader;
}

/** 이미지 파일에서 텍스트를 인식한다(영어+한국어). */
export async function recognizeImage(file: File, onProgress?: ProgressFn): Promise<string> {
  const Tesseract = (await loadTesseract()) as {
    recognize: (
      img: File,
      lang: string,
      opts: { logger: (m: { status: string; progress: number }) => void },
    ) => Promise<{ data: { text: string } }>;
  };
  const { data } = await Tesseract.recognize(file, "eng+kor", {
    logger: (m) => onProgress?.(m.progress ?? 0, m.status ?? ""),
  });
  return data.text;
}

export interface WordCandidate {
  word: string;
  meaning: string;
}

/** 인식된 텍스트에서 "영단어 + 뜻" 후보를 뽑는다.
 *  각 줄에서 맨 앞 영어 토큰을 단어로, 그 뒤 텍스트를 뜻으로 추정한다. */
export function parseCandidates(text: string): WordCandidate[] {
  const out: WordCandidate[] = [];
  const seen = new Set<string>();
  for (const raw of text.split(/\r?\n+/)) {
    const line = raw.trim();
    if (!line) continue;
    // 맨 앞 영어 단어(구) 추출
    const m = line.match(/[A-Za-z][A-Za-z'’.\- ]*[A-Za-z]|[A-Za-z]{2,}/);
    if (!m) continue;
    const word = m[0].trim().replace(/\s+/g, " ");
    if (word.length < 2) continue;
    const key = word.toLowerCase();
    if (seen.has(key)) continue;
    // 영단어 뒤쪽을 뜻으로 (앞의 구분기호 제거)
    const rest = line
      .slice((m.index ?? 0) + m[0].length)
      .trim()
      .replace(/^[\s:：''"”\-—–·.、,)\]}]+/, "")
      .trim();
    seen.add(key);
    out.push({ word, meaning: rest });
  }
  return out;
}
