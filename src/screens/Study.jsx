import React, { useMemo, useRef, useState } from "react";
import { Button } from "../components/common.jsx";
import { makeQuestion, checkTyped, flattenWords } from "../lib/session.js";
import { newProgress, gradeCorrect, gradeWrong, STAGE_LABEL } from "../lib/srs.js";

const MAX_REINSERT = 2;

export default function Study({ sessionWords, decks, progress, sentences, examDate, onComplete, onGoSentences, onGoHome }) {
  const pool = useMemo(() => flattenWords(decks), [decks]);
  const poolMap = useMemo(() => new Map(pool.map((w) => [w.id, w])), [pool]);
  const perWord = useRef({}); // { id: { everWrong, chosenWrongId, reinserts } }

  const [state, setState] = useState(() => {
    const queue = sessionWords.map((w) => w.id);
    const first = poolMap.get(queue[0]);
    return {
      queue,
      idx: 0,
      q: first ? makeQuestion(first, pool, progress, sentences) : null,
      phase: "ask", // ask | feedback | done
      picked: null,
      correct: null,
      typed: "",
      summary: null,
    };
  });

  const answeredCount = useRef(0);

  function record(wordId, isCorrect, chosenSrcId) {
    const pw = perWord.current[wordId] || { everWrong: false, chosenWrongId: null, reinserts: 0 };
    if (!isCorrect) {
      pw.everWrong = true;
      if (chosenSrcId && chosenSrcId !== wordId) pw.chosenWrongId = chosenSrcId;
    }
    perWord.current[wordId] = pw;
  }

  function withReinsert(queue, idx, wordId) {
    const pw = perWord.current[wordId];
    if (pw && pw.reinserts >= MAX_REINSERT) return queue;
    if (pw) pw.reinserts = (pw.reinserts || 0) + 1;
    const offset = 4 + Math.floor(Math.random() * 3); // 4~6
    const at = Math.min(idx + offset, queue.length);
    const next = [...queue];
    next.splice(at, 0, wordId);
    return next;
  }

  function answer(isCorrect, chosenSrcId, pickedKey) {
    if (state.phase !== "ask") return;
    answeredCount.current += 1;
    record(state.q.wordId, isCorrect, chosenSrcId);
    setState((s) => {
      const queue = isCorrect ? s.queue : withReinsert(s.queue, s.idx, s.q.wordId);
      return { ...s, queue, phase: "feedback", correct: isCorrect, picked: pickedKey ?? null };
    });
  }

  function onChoice(opt) {
    answer(opt.correct, opt.srcId, opt.key);
  }

  function onSubmitTyped(e) {
    e && e.preventDefault();
    if (state.phase !== "ask") return;
    const ok = checkTyped(state.typed, state.q.answer);
    answer(ok, null, null);
  }

  function next() {
    const nextIdx = state.idx + 1;
    if (nextIdx >= state.queue.length) {
      finish();
      return;
    }
    const w = poolMap.get(state.queue[nextIdx]);
    setState((s) => ({
      ...s,
      idx: nextIdx,
      q: makeQuestion(w, pool, progress, sentences),
      phase: "ask",
      picked: null,
      correct: null,
      typed: "",
    }));
  }

  function finish() {
    const patch = {};
    const wrongWords = [];
    let correctCount = 0;
    for (const wordId of Object.keys(perWord.current)) {
      const pw = perWord.current[wordId];
      const prev = progress[wordId] || newProgress();
      if (pw.everWrong) {
        patch[wordId] = gradeWrong(prev, { confusedId: pw.chosenWrongId });
        const w = poolMap.get(wordId);
        if (w) wrongWords.push(w);
      } else {
        patch[wordId] = gradeCorrect(prev, { examDate });
        correctCount += 1;
      }
    }
    const distinct = Object.keys(perWord.current).length;
    onComplete(patch); // 진행도 즉시 저장
    setState((s) => ({
      ...s,
      phase: "done",
      summary: { distinct, correct: correctCount, wrong: wrongWords.length, wrongWords },
    }));
  }

  /* ---------- 완료 화면 ---------- */
  if (state.phase === "done") {
    const { correct, wrong, distinct, wrongWords } = state.summary;
    return (
      <div className="min-h-full flex flex-col justify-center px-6 pb-24 max-w-xl mx-auto text-center">
        <div className="text-5xl mb-4">{wrong === 0 ? "🎉" : "💪"}</div>
        <h1 className="text-2xl font-bold text-gray-50 mb-2">세션 완료</h1>
        <p className="text-muted mb-8">
          {distinct}개 학습 · <span className="text-good">{correct} 맞음</span>
          {wrong > 0 && <> · <span className="text-bad">{wrong} 틀림</span></>}
        </p>

        <div className="space-y-3">
          {wrong > 0 && (
            <Button className="w-full py-4" onClick={() => onGoSentences(wrongWords)}>
              틀린 단어로 오늘의 문장 만들기
            </Button>
          )}
          <Button variant="ghost" className="w-full py-3.5" onClick={onGoHome}>
            홈으로
          </Button>
        </div>
      </div>
    );
  }

  const q = state.q;
  if (!q) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center px-6 text-center">
        <p className="text-muted mb-4">학습할 단어가 없어요.</p>
        <Button variant="ghost" onClick={onGoHome}>홈으로</Button>
      </div>
    );
  }

  const total = state.queue.length;
  const done = state.idx; // 진행 표시
  const progressPct = Math.min(100, Math.round((done / total) * 100));

  return (
    <div className="min-h-full flex flex-col max-w-xl mx-auto px-5 pt-5 pb-8">
      {/* 상단바 */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onGoHome} className="text-muted hover:text-gray-200 text-lg px-1" aria-label="나가기">
          ✕
        </button>
        <div className="flex-1 h-2 bg-ink-700 rounded-full overflow-hidden">
          <div className="h-full bg-accent transition-all duration-300" style={{ width: `${progressPct}%` }} />
        </div>
        <span className="text-xs text-muted tnum w-12 text-right">
          {done}/{total}
        </span>
      </div>

      {/* 단계 배지 */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-medium text-accent-soft bg-accent/12 px-2.5 py-1 rounded-full">
          {q.stage}단계 · {STAGE_LABEL[q.stage]}
        </span>
        {q.reusedSentence && (
          <span className="text-xs text-muted bg-ink-700 px-2.5 py-1 rounded-full">내가 틀린 단어 예문</span>
        )}
      </div>

      {/* 문제 */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="mb-2 text-sm text-muted">{q.promptLabel}</div>
        <div
          key={q.wordId + "-" + state.idx}
          className="animate-pop text-3xl font-bold text-gray-50 leading-snug break-words mb-2"
        >
          {q.promptMain}
        </div>
        {q.subLabel && state.phase === "ask" && (
          <div className="text-sm text-muted mb-2">뜻: {q.subLabel}</div>
        )}

        {/* 피드백 영역 */}
        {state.phase === "feedback" && <Feedback q={q} correct={state.correct} />}

        {/* 입력 */}
        <div className="mt-6">
          {q.kind === "choice" ? (
            <div className="space-y-3">
              {q.options.map((opt) => (
                <ChoiceButton
                  key={opt.key}
                  opt={opt}
                  phase={state.phase}
                  picked={state.picked}
                  onClick={() => onChoice(opt)}
                />
              ))}
            </div>
          ) : (
            <TypeInput
              q={q}
              phase={state.phase}
              value={state.typed}
              onChange={(v) => setState((s) => ({ ...s, typed: v }))}
              onSubmit={onSubmitTyped}
              correct={state.correct}
            />
          )}
        </div>
      </div>

      {/* 다음 버튼 */}
      {state.phase === "feedback" && (
        <Button className="w-full py-4 mt-6 animate-slideup" onClick={next}>
          다음
        </Button>
      )}
    </div>
  );
}

function ChoiceButton({ opt, phase, picked, onClick }) {
  let cls = "bg-ink-800 border-line text-gray-100 hover:border-accent/40";
  if (phase === "feedback") {
    if (opt.correct) cls = "bg-good/15 border-good/50 text-good";
    else if (picked === opt.key) cls = "bg-bad/15 border-bad/50 text-bad";
    else cls = "bg-ink-800 border-line text-muted opacity-60";
  }
  return (
    <button
      onClick={onClick}
      disabled={phase === "feedback"}
      className={`w-full text-left px-4 py-3.5 rounded-xl border font-medium transition ${cls}`}
    >
      {opt.text}
    </button>
  );
}

function TypeInput({ q, phase, value, onChange, onSubmit, correct }) {
  return (
    <form onSubmit={onSubmit}>
      <div className="text-center text-2xl font-mono text-muted mb-4 tracking-widest">{q.hint}</div>
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={phase === "feedback"}
        placeholder="단어 입력…"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className={`w-full text-center text-xl font-mono bg-ink-900 border-2 rounded-xl px-4 py-3.5 text-gray-100 focus:outline-none transition ${
          phase === "feedback"
            ? correct
              ? "border-good/60 text-good"
              : "border-bad/60 text-bad"
            : "border-line focus:border-accent/60"
        }`}
      />
      {phase === "ask" && (
        <Button type="submit" variant="ghost" className="w-full py-3 mt-3" disabled={!value.trim()}>
          확인
        </Button>
      )}
    </form>
  );
}

function Feedback({ q, correct }) {
  return (
    <div className="mt-4 animate-slideup">
      <div className={`text-sm font-semibold mb-2 ${correct ? "text-good" : "text-bad"}`}>
        {correct ? "정답!" : "오답"}
      </div>
      <div className="bg-ink-800 border border-line rounded-xl p-4">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-lg font-bold text-gray-50">{q.word.word}</span>
          {q.word.pos && <span className="text-xs text-muted">[{q.word.pos}]</span>}
          <span className="text-gray-300">{q.word.meaning}</span>
        </div>
      </div>
    </div>
  );
}
