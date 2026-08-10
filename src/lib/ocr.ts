/* ------------------------------------------------------------------
   사진 → 단어 인식 (v2 기능, 클라이언트 전용).
   Tesseract.js를 런타임에 CDN에서 불러와 브라우저 안에서 OCR 한다.
   서버·외부 AI API 없음. 인식 결과는 화면에서 확인·수정 후 저장한다.

   전처리: 얇은 초록/검정 글씨의 대비가 약해 인식이 잘리는 문제가 있어,
   min(R,B) 채널을 이진화(흑백)하고 작은 글씨는 확대한 뒤 인식한다.
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

/** 사진을 흑백 고대비로 전처리한 캔버스를 만든다. */
async function preprocess(file: File): Promise<HTMLCanvasElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => rej(new Error("이미지를 열 수 없어요."));
      im.src = url;
    });
    // 너무 작으면 확대, 너무 크면 축소 (긴 변 기준)
    const longest = Math.max(img.width, img.height);
    let scale = 1;
    if (longest > 2200) scale = 2200 / longest;
    else if (longest < 1400) scale = 1400 / longest;
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return canvas;
    ctx.drawImage(img, 0, 0, w, h);

    const image = ctx.getImageData(0, 0, w, h);
    const d = image.data;
    for (let i = 0; i < d.length; i += 4) {
      // 초록/검정 글씨는 R·B 채널이 낮고 흰 배경은 높다 → min(R,B) 로 대비 확보
      const v = Math.min(d[i], d[i + 2]);
      const bw = v < 165 ? 0 : 255; // 이진화
      d[i] = d[i + 1] = d[i + 2] = bw;
    }
    ctx.putImageData(image, 0, 0);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** 이미지 파일에서 텍스트를 인식한다(영어+한국어). */
export async function recognizeImage(file: File, onProgress?: ProgressFn): Promise<string> {
  onProgress?.(0, "preparing");
  const canvas = await preprocess(file);
  const Tesseract = (await loadTesseract()) as {
    recognize: (
      img: HTMLCanvasElement,
      lang: string,
      opts: { logger: (m: { status: string; progress: number }) => void },
    ) => Promise<{ data: { text: string } }>;
  };
  const { data } = await Tesseract.recognize(canvas, "eng+kor", {
    logger: (m) => onProgress?.(m.progress ?? 0, m.status ?? ""),
  });
  return data.text;
}

export interface WordCandidate {
  word: string;
  meaning: string;
}

/** 인식된 텍스트에서 "영단어 + 뜻" 후보를 뽑는다.
 *  각 줄에서 맨 앞 영어 단어(구)를 단어로, 그 뒤 텍스트를 뜻으로 추정한다. */
export function parseCandidates(text: string): WordCandidate[] {
  const out: WordCandidate[] = [];
  const seen = new Set<string>();
  for (const raw of text.split(/\r?\n+/)) {
    const line = raw.trim();
    if (!line) continue;
    // 앞쪽 번호/기호를 건너뛰고, 이어지는 영어 단어(구)를 통째로 잡는다.
    const m = line.match(/[A-Za-z](?:[A-Za-z'’.\-]|[ ](?=[A-Za-z]))*/);
    if (!m) continue;
    const word = m[0].trim().replace(/\s+/g, " ");
    if (word.length < 2) continue; // 한 글자 잡음 제외 (단어 앞 2글자만 남던 버그 방지)
    const key = word.toLowerCase();
    if (seen.has(key)) continue;
    // 영단어 뒤쪽을 뜻으로 (앞의 구분기호 제거)
    const rest = line
      .slice((m.index ?? 0) + m[0].length)
      .trim()
      .replace(/^[\s:：''"”\-—–·.、,)\]}0-9]+/, "")
      .trim();
    seen.add(key);
    out.push({ word, meaning: rest });
  }
  return out;
}
