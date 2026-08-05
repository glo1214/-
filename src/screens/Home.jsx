import React from "react";
import { Screen, Card, Button, Pill } from "../components/common.jsx";

export default function Home({ dday, dueCount, stats, examDate, onStart, onOpenSettings }) {
  const ddayLabel =
    dday == null ? "시험일 미설정" : dday > 0 ? `D-${dday}` : dday === 0 ? "D-DAY" : `D+${-dday}`;

  return (
    <Screen>
      {/* 상단 D-day */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2 text-left"
          aria-label="설정"
        >
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-accent tnum">{ddayLabel}</span>
            </div>
            <div className="text-xs text-muted mt-0.5">
              {examDate ? `수능 ${examDate}` : "탭해서 시험일 설정"}
            </div>
          </div>
        </button>
        <button
          onClick={onOpenSettings}
          className="w-10 h-10 rounded-full bg-ink-700 text-muted hover:text-gray-100 flex items-center justify-center"
          aria-label="설정"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>

      {/* 오늘 복습 — 핵심 */}
      <Card className="p-7 text-center relative overflow-hidden">
        <div className="text-sm text-muted mb-1">오늘 복습</div>
        <div className="text-6xl font-extrabold text-gray-50 tnum leading-none mb-1">
          {dueCount}
          <span className="text-2xl text-muted font-bold ml-1">개</span>
        </div>
        {dueCount === 0 ? (
          <p className="text-good text-sm font-medium mt-3">✓ 밀린 복습 0 · 오늘 할 일 끝!</p>
        ) : (
          <p className="text-muted text-sm mt-3">2~3분이면 충분해요</p>
        )}
        <Button
          onClick={onStart}
          disabled={dueCount === 0}
          className="w-full mt-6 py-4 text-lg"
        >
          {dueCount === 0 ? "오늘 복습 완료" : "시작"}
        </Button>
      </Card>

      {/* 밀린 복습 안내 (스트릭 대신) */}
      {stats.overdue > 0 && (
        <Card className="p-4 mt-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-200 font-medium">밀린 복습 {stats.overdue}개</div>
            <div className="text-xs text-muted mt-0.5">지금 만회하면 다시 0으로</div>
          </div>
          <Pill tone="bad">만회 가능</Pill>
        </Card>
      )}

      {/* 요약 지표 */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        <Mini label="전체 단어" value={stats.total} />
        <Mini label="학습 시작" value={stats.started} />
        <Mini label="완료(박스5)" value={stats.mastered} />
      </div>

      {stats.total === 0 && (
        <p className="text-center text-sm text-muted mt-8 leading-relaxed">
          아직 단어가 없어요.<br />
          <span className="text-gray-300">단어장</span> 탭에서 사진이나 직접 입력으로 추가해보세요.
        </p>
      )}
    </Screen>
  );
}

function Mini({ label, value }) {
  return (
    <Card className="p-3.5 text-center">
      <div className="text-2xl font-bold text-gray-100 tnum">{value}</div>
      <div className="text-[11px] text-muted mt-0.5">{label}</div>
    </Card>
  );
}
