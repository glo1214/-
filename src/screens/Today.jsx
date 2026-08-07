import React, { useState, useEffect, useRef } from "react";
import { todayKey, labelKo } from "../lib/date.js";
import { saveDraft, applyCorrection, getEntry, currentStreak } from "../lib/storage.js";
import { correctDiary } from "../lib/ai.js";
import { useStore } from "../lib/useStore.js";
import { Card, Button, SectionTitle, Icon, Pill, Spinner, Empty } from "../components/common.jsx";
import Calendar from "../components/Calendar.jsx";
import CorrectionView from "../components/CorrectionView.jsx";
import ThinkingMap from "../components/ThinkingMap.jsx";
import { PatternList, ExpressionList } from "../components/PatternList.jsx";
import ReadFive from "../components/ReadFive.jsx";

const PLACEHOLDER = `오늘 있었던 일을 영어로 편하게 써 보세요. 틀려도 괜찮아요!

예) I got up at 7. I ate breakfast and now I am sleepy. My brother watched TV so loud so I told him to turn it off.`;

export default function Today() {
  const state = useStore();
  const [selected, setSelected] = useState(todayKey());
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const saveTimer = useRef(null);

  const entry = state.entries[selected] || null;
  const streak = currentStreak();

  // 날짜 전환 시 편집기에 저장된 초안 로드
  useEffect(() => {
    setText(getEntry(selected)?.text || "");
    setNote("");
  }, [selected]);

  const onChange = (v) => {
    setText(v);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveDraft(selected, v), 400);
  };

  const runCorrection = async () => {
    if (!text.trim() || busy) return;
    clearTimeout(saveTimer.current);
    saveDraft(selected, text);
    setBusy(true);
    setNote("");
    try {
      const { result, source, note: n } = await correctDiary(text, {
        name: state.settings.name,
      });
      applyCorrection(selected, result, source);
      if (n) setNote(n);
    } catch (e) {
      setNote(e.message || "첨삭 중 문제가 생겼어요.");
    } finally {
      setBusy(false);
    }
  };

  const hasResult = entry && entry.corrected;
  const readySentences =
    entry?.sentences?.length > 0
      ? entry.sentences
      : entry?.corrected
        ? entry.corrected.split(/(?<=[.!?])\s+/).map((c) => ({ corrected: c }))
        : [];

  return (
    <div className="space-y-5 pb-4">
      {/* 인사 + 스트릭 */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-muted">
            {state.settings.name ? `${state.settings.name}님, ` : ""}오늘도 영어로 생각해 볼까요?
          </p>
          <h1 className="text-xl font-bold text-gray-50 mt-0.5">오늘의 일기</h1>
        </div>
        {streak > 0 && (
          <Pill tone="warm">
            <Icon name="flame" size={14} /> {streak}일 연속
          </Pill>
        )}
      </div>

      {/* ① 캘린더 */}
      <Calendar entries={state.entries} selected={selected} onSelect={setSelected} />

      {/* ② 오늘의 일기 */}
      <section>
        <SectionTitle
          index={1}
          title={labelKo(selected)}
          subtitle="영어로 자유롭게 — 틀려도 AI가 자연스럽게 고쳐 줘요"
        />
        <Card className="p-3">
          <textarea
            value={text}
            onChange={(e) => onChange(e.target.value)}
            placeholder={PLACEHOLDER}
            rows={7}
            className="w-full bg-transparent resize-none outline-none text-[15px] leading-relaxed text-gray-100 placeholder:text-ink-500"
          />
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-line">
            <span className="text-xs text-muted tnum">{text.trim().split(/\s+/).filter(Boolean).length} 단어</span>
            <Button onClick={runCorrection} disabled={!text.trim() || busy} size="sm">
              {busy ? <Spinner /> : <Icon name="sparkles" size={16} />}
              {busy ? "첨삭 중…" : hasResult ? "다시 첨삭받기" : "AI 첨삭 받기"}
            </Button>
          </div>
        </Card>
        {note && (
          <p className="text-xs text-warm-soft/90 mt-2 leading-relaxed px-1">{note}</p>
        )}
      </section>

      {busy && !hasResult && (
        <Card className="p-8">
          <div className="flex flex-col items-center gap-3 text-muted">
            <Spinner className="text-brand w-6 h-6" />
            <p className="text-sm">원어민 선생님이 첨삭하고 있어요…</p>
          </div>
        </Card>
      )}

      {!hasResult && !busy && !text.trim() && (
        <Empty icon="✍️" title="아직 오늘 일기가 없어요">
          위에 오늘 있었던 일을 영어로 써 보세요. 짧아도 좋아요. AI가 원어민 표현으로 고쳐 주고,
          왜 그렇게 말하는지 알려줄 거예요.
        </Empty>
      )}

      {/* 결과 섹션들 */}
      {hasResult && (
        <div className="space-y-6 animate-fadein">
          {/* ③ AI 첨삭 */}
          <section>
            <SectionTitle index={2} title="AI 첨삭" subtitle="원어민이라면 이렇게 말해요" />
            <CorrectionView entry={entry} />
          </section>

          {/* ④ 영어식 사고 설명 */}
          {entry.thinkingExplanation && (
            <section>
              <SectionTitle index={3} title="영어식 사고 설명" subtitle="왜 영어는 이렇게 표현할까요?" />
              <Card className="p-4 border-brand/25">
                <p className="text-[15px] leading-relaxed text-gray-100">
                  {entry.thinkingExplanation}
                </p>
              </Card>
            </section>
          )}

          {/* ⑤ Thinking Map */}
          {entry.thinkingMap?.length > 0 && (
            <section>
              <SectionTitle index={4} title="Thinking Map" subtitle="생각의 흐름을 따라가 보세요" />
              <ThinkingMap steps={entry.thinkingMap} />
            </section>
          )}

          {/* ⑥ 핵심 패턴 + 표현 */}
          {(entry.patterns?.length > 0 || entry.expressions?.length > 0) && (
            <section>
              <SectionTitle index={5} title="핵심 패턴 · 오늘 배운 표현" subtitle="통째로 외우면 바로 쓸 수 있어요" />
              {entry.expressions?.length > 0 && (
                <div className="mb-3">
                  <ExpressionList expressions={entry.expressions} />
                </div>
              )}
              <PatternList patterns={entry.patterns} />
            </section>
          )}

          {/* ⑦ 5번 읽기 */}
          {readySentences.length > 0 && (
            <section>
              <SectionTitle index={6} title="5번 읽기" subtitle="소리 내어 5번 읽으면 내 문장이 돼요" />
              <ReadFive
                dateKey={selected}
                sentences={readySentences}
                readCounts={entry.readCounts}
              />
            </section>
          )}

          <div className="pt-2 text-center">
            <Pill tone="good">
              <Icon name="check" size={13} /> 표현이 복습 목록에 자동 저장됐어요
            </Pill>
          </div>
        </div>
      )}
    </div>
  );
}
