/* ------------------------------------------------------------------
   오답 선택지(Distractor) 설계 (기획서 4절)
   랜덤으로 뽑으면 너무 쉬워 학습이 안 된다. 우선순위:
     1) 과거에 이 단어와 헷갈렸던 단어 (confusedWith)
     2) 같은 품사
     3) 철자가 비슷한 단어 (adapt/adopt, comprehensive/comprehensible)
     4) 그래도 부족하면 랜덤
------------------------------------------------------------------ */

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* 편집 거리 (Levenshtein) — 철자 유사도 */
export function editDistance(a, b) {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

/*
  target: {id, word, meaning, pos}
  pool:   전체 단어 배열
  progress: { [id]: {..., confusedWith:[]} }
  n:      필요한 오답 수 (기본 3)
  key:    "meaning" | "word" — 선택지에서 겹치면 안 되는 필드
  반환: 단어 객체 배열 (길이 n, 부족하면 가능한 만큼)
*/
export function pickDistractors(target, pool, progress, { n = 3, key = "meaning" } = {}) {
  const chosen = [];
  const used = new Set([target.id]);
  const usedText = new Set([norm(target[key])]);

  const tryAdd = (w) => {
    if (!w || used.has(w.id)) return;
    const t = norm(w[key]);
    if (usedText.has(t)) return; // 정답과 같은 텍스트면 제외
    used.add(w.id);
    usedText.add(t);
    chosen.push(w);
  };

  const byId = new Map(pool.map((w) => [w.id, w]));
  const others = pool.filter((w) => w.id !== target.id);

  // 1) confusedWith
  const prog = progress[target.id];
  if (prog && Array.isArray(prog.confusedWith)) {
    for (const cid of prog.confusedWith) {
      if (chosen.length >= n) break;
      tryAdd(byId.get(cid));
    }
  }

  // 2) 같은 품사
  if (chosen.length < n && target.pos) {
    const samePos = shuffle(others.filter((w) => w.pos === target.pos));
    for (const w of samePos) {
      if (chosen.length >= n) break;
      tryAdd(w);
    }
  }

  // 3) 철자 유사
  if (chosen.length < n) {
    const tw = target.word.toLowerCase();
    const similar = others
      .filter((w) => !used.has(w.id))
      .map((w) => ({ w, d: editDistance(tw, w.word.toLowerCase()) }))
      .sort((a, b) => a.d - b.d);
    for (const { w } of similar) {
      if (chosen.length >= n) break;
      tryAdd(w);
    }
  }

  // 4) 랜덤
  if (chosen.length < n) {
    for (const w of shuffle(others)) {
      if (chosen.length >= n) break;
      tryAdd(w);
    }
  }

  return chosen;
}

function norm(s) {
  return String(s || "").trim().toLowerCase();
}
