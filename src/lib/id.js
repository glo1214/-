/* 간단한 고유 ID — 시간 접두어로 정렬 가능하게 */
export function uid(prefix = "") {
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 8);
  return `${prefix}${t}${r}`;
}

export function nowIso() {
  return new Date().toISOString();
}
