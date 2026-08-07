import React, { useState } from "react";
import { dueReviews, allReviews, gradeReview } from "../lib/storage.js";
import { useStore } from "../lib/useStore.js";
import { Card, Button, SectionTitle, Icon, Pill, Empty } from "../components/common.jsx";
import SpeakButton from "../components/SpeakButton.jsx";
import SpeakPractice from "../components/SpeakPractice.jsx";

export default function Review() {
  const state = useStore();
  const [i, setI] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [practice, setPractice] = useState(false);

  // 세션 시작 시점의 due 목록을 스냅샷으로 고정(채점으로 목록이 바뀌어도 순서 유지)
  const [queue] = useState(() => dueReviews());
  const total = queue.length;
  const item = queue[i];

  const all = allReviews();

  const grade = (remembered) => {
    if (item) gradeReview(item.id, remembered);
    setRevealed(false);
    setPractice(false);
    setI((n) => n + 1);
  };

  if (all.length === 0) {
    return (
      <div className="pb-4">
        <SectionTitle title="복습" subtitle="AI가 모아 준 표현을 반복해서 익혀요" />
        <Empty icon="🗂️" title="아직 복습할 표현이 없어요">
          일기를 쓰고 AI 첨삭을 받으면, 오늘 배운 표현과 패턴이 이곳에 자동으로 모여요.
        </Empty>
      </div>
    );
  }

  const finished = i >= total;

  return (
    <div className="pb-4 space-y-5">
      <SectionTitle
        title="오늘의 복습"
        subtitle="틀리면 내일 다시, 맞히면 점점 나중에 (Leitner 간격 복습)"
        right={<Pill tone={finished ? "good" : "brand"}>{Math.min(i, total)}/{total}</Pill>}
      />

      {finished ? (
        <>
          <Card className="p-8 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <p className="font-bold text-gray-100">오늘 복습을 모두 끝냈어요!</p>
            <p className="text-sm text-muted mt-1.5">
              내일 다시 최적의 타이밍에 표현들이 돌아올 거예요.
            </p>
          </Card>

          <ReviewLibrary all={all} />
        </>
      ) : (
        <>
          {/* 진행 바 */}
          <div className="h-1.5 rounded-full bg-ink-700 overflow-hidden">
            <div
              className="h-full bg-brand transition-all"
              style={{ width: `${(i / total) * 100}%` }}
            />
          </div>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Pill tone={item.kind === "pattern" ? "warm" : "brand"}>
                {item.kind === "pattern" ? "패턴" : "표현"}
              </Pill>
              <span className="text-xs text-muted">
                {"★".repeat(item.box)}
                {"☆".repeat(5 - item.box)}
              </span>
            </div>

            <div className="text-center py-4">
              <div className="flex items-center justify-center gap-2">
                <span
                  className={`font-serif text-gray-50 ${
                    item.kind === "pattern" ? "text-lg font-mono text-warm-soft" : "text-2xl"
                  }`}
                >
                  {item.text}
                </span>
                {item.kind !== "pattern" && <SpeakButton text={item.text} size={20} />}
              </div>

              {revealed && (item.meaningKo || item.example) && (
                <div className="mt-4 animate-slideup space-y-2">
                  {item.meaningKo && <p className="text-sm text-muted">{item.meaningKo}</p>}
                  {item.example && (
                    <div className="inline-flex items-center gap-2 rounded-lg bg-ink-700 px-3 py-2">
                      <span className="font-serif text-[14px] text-gray-100">{item.example}</span>
                      <SpeakButton text={item.example} size={15} />
                    </div>
                  )}
                </div>
              )}
            </div>

            {practice && (
              <div className="mt-2 mb-4 border-t border-line pt-4">
                <SpeakPractice text={item.example || item.text} />
              </div>
            )}

            {!revealed ? (
              <Button variant="ghost" size="lg" onClick={() => setRevealed(true)}>
                뜻·예문 보기
              </Button>
            ) : (
              <div className="space-y-2.5">
                {!practice && (item.example || item.kind !== "pattern") && (
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => setPractice(true)}>
                    <Icon name="mic" size={15} /> 발음 연습하기
                  </Button>
                )}
                <div className="grid grid-cols-2 gap-2.5">
                  <Button variant="danger" size="lg" onClick={() => grade(false)}>
                    <Icon name="x" size={16} /> 다시
                  </Button>
                  <Button variant="primary" size="lg" onClick={() => grade(true)}>
                    <Icon name="check" size={16} /> 기억했어요
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function ReviewLibrary({ all }) {
  return (
    <div>
      <SectionTitle title="내 표현 보관함" subtitle={`총 ${all.length}개`} />
      <div className="space-y-2">
        {all.map((r) => (
          <Card key={r.id} className="px-3.5 py-2.5 flex items-center gap-2">
            <Pill tone={r.kind === "pattern" ? "warm" : "brand"} className="shrink-0">
              {r.kind === "pattern" ? "패턴" : "표현"}
            </Pill>
            <span
              className={`flex-1 min-w-0 truncate ${
                r.kind === "pattern" ? "font-mono text-sm text-warm-soft" : "font-serif text-gray-100"
              }`}
            >
              {r.text}
            </span>
            <span className="text-[11px] text-muted shrink-0">{"★".repeat(r.box)}</span>
            {r.kind !== "pattern" && <SpeakButton text={r.text} size={16} className="shrink-0" />}
          </Card>
        ))}
      </div>
    </div>
  );
}
