/* ------------------------------------------------------------------
   복습 알고리즘 — Leitner 5박스 + 재수생 특화 D-day 역산 상한
   (기획서 3절)
------------------------------------------------------------------ */

/* 박스별 기본 복습 간격(일)과 출제 단계 */
export const BOX_INTERVAL = { 1: 1, 2: 3, 3: 7, 4: 16, 5: 35 };
export const BOX_STAGE = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 4 };
export const MAX_BOX = 5;

/* 단계 이름 (UI 표기용) */
export const STAGE_LABEL = {
  1: "영어 → 뜻",
  2: "뜻 → 영어",
  3: "빈칸 객관식",
  4: "빈칸 타이핑",
};

/* ---------- 날짜 유틸 (일 단위) ---------- */
export function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key, n) {
  const d = parseKey(key);
  d.setDate(d.getDate() + n);
  return todayKey(d);
}

/* a, b 는 "YYYY-MM-DD" — a 기준 b 까지 남은 일수 (b가 미래면 양수) */
export function daysBetween(aKey, bKey) {
  const MS = 86400000;
  return Math.round((parseKey(bKey) - parseKey(aKey)) / MS);
}

/* 시험까지 남은 일수(D-day). examDate 없으면 null */
export function ddayFrom(examDate, today = todayKey()) {
  if (!examDate) return null;
  return daysBetween(today, examDate);
}

/* ---------- 진행도 객체 ---------- */
export function newProgress(today = todayKey()) {
  return {
    box: 1,
    nextDue: today, // 오늘 바로 노출
    wrongCount: 0,
    seen: 0,
    correct: 0,
    streak: 0,
    confusedWith: [], // 헷갈렸던 단어 id 목록 (오답 선택지에 활용)
    lastSeen: null,
  };
}

export function stageForProgress(p) {
  return BOX_STAGE[p.box] || 1;
}

/* 오늘 복습 대상인가? (nextDue <= today) */
export function isDue(p, today = todayKey()) {
  if (!p) return false;
  return daysBetween(today, p.nextDue) <= 0;
}

/* ---------- D-day 역산 상한 ----------
   D-30부터 복습 간격에 상한을 걸어 시험 전 최소 1회 더 노출.
   박스 5여도 D-14 / D-7 / D-3 / D-1 에 강제 노출.
*/
const FORCE_CHECKPOINTS = [14, 7, 3, 1];

export function capNextDue(naturalDue, examDate, today = todayKey()) {
  if (!examDate) return naturalDue;
  const dToExam = daysBetween(today, examDate);
  if (dToExam < 0 || dToExam > 30) return naturalDue; // 상한 구간 밖

  let due = naturalDue;

  // 1) D-30 구간에선 최대 간격을 7일로 제한
  const cap7 = addDays(today, 7);
  if (daysBetween(due, cap7) < 0) due = cap7;

  // 2) 아직 지나지 않은 강제 체크포인트로 당겨오기
  const checkpoints = FORCE_CHECKPOINTS.map((d) => addDays(examDate, -d))
    .filter((cp) => daysBetween(today, cp) > 0) // 미래인 것만
    .sort((a, b) => daysBetween(a, b)); // 이른 날짜부터
  for (const cp of checkpoints) {
    if (daysBetween(cp, due) > 0) {
      // due 가 체크포인트보다 뒤 → 앞으로 당김
      due = cp;
      break;
    }
  }
  return due;
}

/* ---------- 채점 ---------- */

/* 맞았을 때 — 박스 승급 */
export function gradeCorrect(p, { examDate, today = todayKey() } = {}) {
  const box = Math.min(p.box + 1, MAX_BOX);
  const natural = addDays(today, BOX_INTERVAL[box]);
  return {
    ...p,
    box,
    nextDue: capNextDue(natural, examDate, today),
    seen: p.seen + 1,
    correct: p.correct + 1,
    streak: p.streak + 1,
    lastSeen: today,
  };
}

/* 틀렸을 때 — 박스 1로 강등 + 다음 날 재등장 (+ 세션 내 즉시 재삽입은 엔진이 처리) */
export function gradeWrong(p, { confusedId, today = todayKey() } = {}) {
  const confused = Array.isArray(p.confusedWith) ? [...p.confusedWith] : [];
  if (confusedId && confusedId !== confusedId.self && !confused.includes(confusedId)) {
    confused.unshift(confusedId);
    if (confused.length > 8) confused.length = 8; // 최근 것 위주로
  }
  return {
    ...p,
    box: 1,
    nextDue: addDays(today, 1), // 다음 날 다시
    wrongCount: p.wrongCount + 1,
    seen: p.seen + 1,
    streak: 0,
    confusedWith: confused,
    lastSeen: today,
  };
}
