import React, { useMemo } from "react";
import { Screen, Header, Card, Empty, Pill } from "../components/common.jsx";
import { flattenWords } from "../lib/session.js";

const BOX_COLORS = ["#fb7185", "#fbbf24", "#fcd34d", "#a3e635", "#34d399"];

export default function Stats({ decks, progress }) {
  const pool = useMemo(() => flattenWords(decks), [decks]);
  const wordMap = useMemo(() => new Map(pool.map((w) => [w.id, w])), [pool]);

  const { boxes, top, started, totalWrong } = useMemo(() => {
    const boxes = [0, 0, 0, 0, 0]; // box 1..5
    const wrongs = [];
    let started = 0;
    let totalWrong = 0;
    for (const id of Object.keys(progress)) {
      const p = progress[id];
      if (!wordMap.has(id)) continue;
      started += 1;
      if (p.box >= 1 && p.box <= 5) boxes[p.box - 1] += 1;
      if (p.wrongCount > 0) {
        wrongs.push({ w: wordMap.get(id), wrongCount: p.wrongCount, box: p.box });
        totalWrong += p.wrongCount;
      }
    }
    wrongs.sort((a, b) => b.wrongCount - a.wrongCount);
    return { boxes, top: wrongs.slice(0, 10), started, totalWrong };
  }, [progress, wordMap]);

  const maxBox = Math.max(1, ...boxes);

  if (started === 0) {
    return (
      <Screen>
        <Header title="통계" />
        <Empty icon="📊" title="아직 데이터가 없어요" desc="복습을 시작하면 자주 틀리는 단어와 박스 분포가 여기에 쌓여요." />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="통계" sub={`학습 시작 ${started}개 · 누적 오답 ${totalWrong}회`} />

      {/* 박스별 분포 */}
      <Card className="p-5 mb-6">
        <div className="text-sm font-semibold text-gray-200 mb-4">Leitner 박스 분포</div>
        <div className="flex items-end gap-2 h-32">
          {boxes.map((n, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
              <span className="text-xs text-muted mb-1 tnum">{n}</span>
              <div
                className="w-full rounded-t-md transition-all"
                style={{
                  height: `${Math.max(4, (n / maxBox) * 100)}%`,
                  background: BOX_COLORS[i],
                  opacity: n === 0 ? 0.25 : 1,
                }}
              />
              <span className="text-[11px] text-muted mt-1.5">{i + 1}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[11px] text-muted mt-3">
          <span>1 = 방금 틀림</span>
          <span>5 = 완료</span>
        </div>
      </Card>

      {/* 자주 틀리는 단어 TOP 10 */}
      <div className="text-sm font-semibold text-muted mb-3">자주 틀리는 단어 TOP 10</div>
      {top.length === 0 ? (
        <p className="text-muted text-sm text-center py-6">아직 틀린 단어가 없어요 👍</p>
      ) : (
        <div className="space-y-2">
          {top.map((t, i) => (
            <Card key={t.w.id} className="px-4 py-3 flex items-center gap-3">
              <span className="text-sm font-bold text-muted w-5 tnum">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-100 truncate">{t.w.word}</div>
                <div className="text-sm text-muted truncate">{t.w.meaning}</div>
              </div>
              <Pill tone="bad">{t.wrongCount}회</Pill>
            </Card>
          ))}
        </div>
      )}
    </Screen>
  );
}
