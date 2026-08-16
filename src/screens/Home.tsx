import type { Deck, Profile, ProgressMap } from "../types";
import { buildSession } from "../lib/session";
import { isDue, isRetired } from "../lib/scheduler";
import { newWordsToday } from "../lib/storage";
import { dday, todayKey } from "../lib/date";

/** 홈 — D-day, '오늘 복습 N개' 한 줄, [시작] 버튼 하나. 스트릭 없음. */
export function Home({
  profile,
  decks,
  progress,
  onStart,
}: {
  profile: Profile;
  decks: Deck[];
  progress: ProgressMap;
  onStart: () => void;
}) {
  const today = todayKey();
  const { queue } = buildSession(decks, progress, profile, today, newWordsToday(today));
  const total = queue.length;

  // 밀린 개수 = 오늘 due이고 제외되지 않은 복습 수
  const overdue = Object.values(progress).filter(
    (p) => isDue(p, today) && !isRetired(p, profile.retireAfter),
  ).length;
  const d = dday(profile.examDate, today);

  return (
    <div className="screen">
      <div className="card" style={{ textAlign: "center", paddingTop: 26, paddingBottom: 26 }}>
        {d === null ? (
          <div className="muted">시험일을 설정하면 D-day가 표시됩니다</div>
        ) : d >= 0 ? (
          <>
            <div className="dday">D-{d}</div>
            <div className="muted small" style={{ marginTop: 6 }}>
              수능까지 {d}일
            </div>
          </>
        ) : (
          <div className="dday">D+{-d}</div>
        )}
      </div>

      <div className="card" style={{ textAlign: "center" }}>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
          오늘 복습 <span style={{ color: "var(--accent)" }}>{total}</span>개
        </div>
        {overdue > 0 && (
          <div className="muted small" style={{ marginBottom: 16 }}>
            밀린 복습 {overdue}개 · 오늘 만회할 수 있어요
          </div>
        )}
        {overdue === 0 && <div style={{ height: 16 }} />}
        <button className="btn primary" onClick={onStart} disabled={total === 0}>
          {total === 0 ? "오늘 학습 완료 🎉" : "시작"}
        </button>
      </div>

      <div className="muted small" style={{ textAlign: "center", marginTop: 8 }}>
        틀린 단어는 따로 체크하지 않아도 알아서 다시 나옵니다.
      </div>
    </div>
  );
}
