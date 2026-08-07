/* 날짜 유틸 — 로컬 시간 기준 YYYY-MM-DD 키를 다룬다. */

export function toKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey() {
  return toKey(new Date());
}

export function addDays(key, n) {
  const d = fromKey(key);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

export function daysBetween(a, b) {
  const ms = fromKey(b).getTime() - fromKey(a).getTime();
  return Math.round(ms / 86400000);
}

const WEEK_KO = ["일", "월", "화", "수", "목", "금", "토"];

export function labelKo(key) {
  const d = fromKey(key);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEK_KO[d.getDay()]})`;
}

export function weekdayKo(key) {
  return WEEK_KO[fromKey(key).getDay()];
}

/* 특정 연·월의 달력 격자(6주 x 7일)용 날짜 키 배열. 앞뒤 달 채움. */
export function monthGrid(year, month /* 0-based */) {
  const first = new Date(year, month, 1);
  const startOffset = first.getDay(); // 0=일
  const cells = [];
  const start = new Date(year, month, 1 - startOffset);
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push({ key: toKey(d), inMonth: d.getMonth() === month, date: d });
  }
  return cells;
}

export function monthLabel(year, month) {
  return `${year}년 ${month + 1}월`;
}
