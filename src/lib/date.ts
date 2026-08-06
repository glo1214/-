/* 날짜 유틸 — 일(day) 단위. 모든 저장은 "YYYY-MM-DD" 문자열. */

export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** aKey 기준 bKey 까지 남은 일수 (b가 미래면 양수) */
export function daysBetween(aKey: string, bKey: string): number {
  const MS = 86400000;
  return Math.round((parseKey(bKey).getTime() - parseKey(aKey).getTime()) / MS);
}

export function addDays(key: string, n: number): string {
  const d = parseKey(key);
  d.setDate(d.getDate() + n);
  return todayKey(d);
}

/** 시험까지 남은 일수(D-day). examDate 없으면 null */
export function dday(examDate: string | null, today: string = todayKey()): number | null {
  if (!examDate) return null;
  return daysBetween(today, examDate);
}
