import React from "react";
import { useStore } from "../lib/useStore.js";
import { currentStreak, entryKeysSorted, allReviews } from "../lib/storage.js";
import { todayKey, addDays, weekdayKo } from "../lib/date.js";
import { Card, SectionTitle, Icon, Pill, Empty } from "../components/common.jsx";

export default function Stats() {
  const state = useStore();
  const keys = entryKeysSorted();
  const streak = currentStreak();
  const reviews = allReviews();

  // 최신 습관 분석
  const latestHabit = [...keys]
    .reverse()
    .map((k) => state.entries[k]?.habit)
    .find(Boolean);

  const totalWords = keys.reduce(
    (sum, k) => sum + (state.entries[k].text || "").trim().split(/\s+/).filter(Boolean).length,
    0
  );

  // 최근 7일 작성 여부
  const last7 = [];
  for (let d = 6; d >= 0; d--) {
    const key = addDays(todayKey(), -d);
    last7.push({ key, has: !!(state.entries[key] && (state.entries[key].text || "").trim()) });
  }

  if (keys.length === 0) {
    return (
      <div className="pb-4">
        <SectionTitle title="영어 습관 분석" subtitle="꾸준히 쓸수록 정확해져요" />
        <Empty icon="📊" title="아직 분석할 일기가 없어요">
          며칠 동안 일기를 써 보면, AI가 자주 쓰는 표현과 부족한 문법을 분석해 이번 주 목표를
          제안해 드려요.
        </Empty>
      </div>
    );
  }

  return (
    <div className="pb-4 space-y-6">
      <SectionTitle title="영어 습관 분석" subtitle="나의 영어 사고 성장 기록" />

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-2.5">
        <Stat label="연속 기록" value={streak} unit="일" icon="flame" tone="warm" />
        <Stat label="쓴 일기" value={keys.length} unit="편" icon="pen" tone="brand" />
        <Stat label="모은 표현" value={reviews.length} unit="개" icon="book" tone="good" />
      </div>

      {/* 최근 7일 */}
      <Card className="p-4">
        <p className="text-sm font-semibold text-gray-100 mb-3">최근 7일</p>
        <div className="flex justify-between gap-1.5">
          {last7.map(({ key, has }) => (
            <div key={key} className="flex flex-col items-center gap-1.5 flex-1">
              <div
                className={`w-full aspect-square rounded-lg grid place-items-center ${
                  has ? "bg-brand/25 text-brand-soft" : "bg-ink-700 text-ink-500"
                }`}
              >
                {has ? <Icon name="check" size={16} /> : ""}
              </div>
              <span className="text-[10px] text-muted">{weekdayKo(key)}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted mt-3 text-center">
          이번 주 {last7.filter((d) => d.has).length}일 작성 · 총 {totalWords.toLocaleString()} 단어를 영어로 썼어요
        </p>
      </Card>

      {/* AI 습관 분석 */}
      {latestHabit ? (
        <>
          {Object.keys(latestHabit.scores || {}).length > 0 && (
            <section>
              <SectionTitle title="문법·표현 진단" subtitle="최근 일기 기준 (별 5개가 가장 좋음)" />
              <Card className="p-4 space-y-3">
                {Object.entries(latestHabit.scores).map(([label, score]) => (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-200">{label}</span>
                      <span className="text-xs text-warm-soft tnum">
                        {"★".repeat(score)}
                        <span className="text-ink-500">{"★".repeat(5 - score)}</span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-ink-700 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-deep to-brand"
                        style={{ width: `${(score / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </Card>
            </section>
          )}

          {latestHabit.recommendation && (
            <Card className="p-4 border-warm/30 bg-warm/5">
              <div className="flex items-center gap-2 mb-1.5">
                <Icon name="sparkles" size={16} className="text-warm" />
                <span className="text-sm font-bold text-warm-soft">이번 주 목표</span>
              </div>
              <p className="text-[15px] text-gray-100 leading-relaxed">
                {latestHabit.recommendation}
              </p>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-3">
            {latestHabit.strengths?.length > 0 && (
              <Card className="p-4">
                <p className="text-sm font-semibold text-good mb-2">잘하고 있는 점</p>
                <ul className="space-y-1.5">
                  {latestHabit.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-200">
                      <Icon name="check" size={15} className="text-good mt-0.5 shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </Card>
            )}
            {latestHabit.weaknesses?.length > 0 && (
              <Card className="p-4">
                <p className="text-sm font-semibold text-brand-soft mb-2">더 연습하면 좋은 점</p>
                <ul className="space-y-1.5">
                  {latestHabit.weaknesses.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-200">
                      <Icon name="arrow-down" size={15} className="text-brand-soft mt-0.5 shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        </>
      ) : (
        <Card className="p-4">
          <p className="text-sm text-muted text-center leading-relaxed">
            AI 첨삭을 켜면 자주 쓰는 표현·부족한 문법·추천 패턴을 분석해 드려요.
            <br />
            (지금은 오프라인 연습 모드라 진단이 제한돼요)
          </p>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value, unit, icon, tone }) {
  const tones = { warm: "text-warm", brand: "text-brand-soft", good: "text-good" };
  return (
    <Card className="p-3 text-center">
      <Icon name={icon} size={18} className={`mx-auto mb-1.5 ${tones[tone]}`} />
      <div className="text-2xl font-bold text-gray-50 tnum leading-none">{value}</div>
      <div className="text-[11px] text-muted mt-1">
        {label} <span className="opacity-60">{unit}</span>
      </div>
    </Card>
  );
}
