/* ------------------------------------------------------------------
   저장 계층 — localStorage 기반, 키를 뭉쳐서 관리
   (기획서 8절: settings / deck:{id} / progress / sentences)

   원칙
   - 매 문제마다 저장하지 않는다. 세션/편집 종료 시 한 번만 flush.
   - 키를 뭉쳐 호출 횟수를 줄인다.
   - 단어 3000개여도 progress는 수백 KB → 한 키에 충분.
------------------------------------------------------------------ */

const NS = "wr:"; // word-reset namespace
const K = {
  settings: NS + "settings",
  decks: NS + "decks", // { [deckId]: { id, name, words:[{id,word,meaning,pos}] } }
  progress: NS + "progress", // { [wordId]: {...} }
  sentences: NS + "sentences", // [ {...} ]
  seq: NS + "seq", // id 카운터
};

function read(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    // 용량 초과 등 — 앱은 계속 동작
    console.warn("저장 실패", key, e);
    return false;
  }
}

/* 짧고 안정적인 유니크 id */
let _seq = read(K.seq, 0);
export function uid(prefix = "id") {
  _seq += 1;
  write(K.seq, _seq);
  return `${prefix}_${_seq.toString(36)}${Math.floor(performance.now() % 1000).toString(36)}`;
}

/* ---- 로드 ---- */
export function loadSettings() {
  return read(K.settings, null);
}
export function loadDecks() {
  return read(K.decks, {});
}
export function loadProgress() {
  return read(K.progress, {});
}
export function loadSentences() {
  return read(K.sentences, []);
}

/* ---- 저장 (배치) ---- */
export function saveSettings(s) {
  return write(K.settings, s);
}
export function saveDecks(d) {
  return write(K.decks, d);
}
export function saveProgress(p) {
  return write(K.progress, p);
}
export function saveSentences(s) {
  return write(K.sentences, s);
}

/* 세션 종료 시 한 번에 flush */
export function flushAll({ settings, decks, progress, sentences }) {
  if (settings !== undefined) saveSettings(settings);
  if (decks !== undefined) saveDecks(decks);
  if (progress !== undefined) saveProgress(progress);
  if (sentences !== undefined) saveSentences(sentences);
}

export function exportAll() {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: loadSettings(),
    decks: loadDecks(),
    progress: loadProgress(),
    sentences: loadSentences(),
  };
}

export function importAll(data) {
  if (!data || typeof data !== "object") throw new Error("잘못된 파일");
  if (data.settings) saveSettings(data.settings);
  if (data.decks) saveDecks(data.decks);
  if (data.progress) saveProgress(data.progress);
  if (data.sentences) saveSentences(data.sentences);
}

export function wipeAll() {
  [K.settings, K.decks, K.progress, K.sentences].forEach((k) => {
    try {
      window.localStorage.removeItem(k);
    } catch {}
  });
}
