import { useEffect, useMemo, useRef, useState } from "react";
import type {
  Answer,
  Choice,
  Deck,
  Profile,
  ProgressMap,
  QueueItem,
} from "../types";
import { judge, newProgress } from "../lib/scheduler";
import {
  buildSession,
  makeQuestion,
  makeReviewTail,
  reinsertOffset,
} from "../lib/session";
import { todayKey } from "../lib/date";
import { Pronunciation, EtymologyCard } from "../components/ui";

const CARD_LABEL: Record<number, string> = {
  1: "영단어 → 뜻",
  2: "문장 빈칸",
  3: "문맥 속 뜻",
};

interface Flip {
  answer: Answer;
  chosen: Choice | null; // 모름이면 null
}

export function Study({
  profile,
  decks,
  progress,
  commitProgress,
  onHome,
}: {
  profile: Profile;
  decks: Deck[];
  progress: ProgressMap;
  commitProgress: (m: ProgressMap) => void;
  onHome: () => void;
}) {
  const today = todayKey();

  // 세션 1회 구성. 새 단어 progress(seeded)를 즉시 반영·저장한다.
  const initial = useMemo(() => buildSession(decks, progress, profile, today), []); // eslint-disable-line
  const workRef = useRef<ProgressMap>({ ...progress, ...initial.seeded });
  const queueRef = useRef<QueueItem[]>(initial.queue);
  const answeredRef = useRef(0);
  const todayWrongRef = useRef<string[]>([]); // 최근 틀린 key (앞이 최신)
  const tailAddedRef = useRef(false);
  const startRef = useRef<number>(performance.now());

  const [idx, setIdx] = useState(0);
  const [flip, setFlip] = useState<Flip | null>(null);
  const [done, setDone] = useState(initial.queue.length === 0);
  const [, force] = useState(0); // 큐 변경 강제 렌더

  // 시작 시 seeded 저장(새로고침 대비)
  useEffect(() => {
    if (Object.keys(initial.seeded).length) commitProgress(workRef.current);
    // eslint-disable-next-line
  }, []);

  // 새 문제로 넘어갈 때 타이머 리셋
  useEffect(() => {
    startRef.current = performance.now();
  }, [idx]);

  const queue = queueRef.current;
  const item = queue[idx];
  const question = useMemo(
    () => (item ? makeQuestion(decks, item, workRef.current) : null),
    [item, idx],
  );

  if (done || !item || !question) {
    const answered = answeredRef.current;
    return (
      <div className="screen">
        <div className="card" style={{ textAlign: "center", paddingTop: 30, paddingBottom: 30 }}>
          <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>
            {answered === 0 ? "오늘 복습할 단어가 없어요" : "세션 완료 🎉"}
          </div>
          {answered > 0 && (
            <div className="muted">오늘 {answered}문제를 풀었어요.</div>
          )}
        </div>
        <button className="btn primary" onClick={onHome}>
          홈으로
        </button>
      </div>
    );
  }

  const p = workRef.current[item.key] ?? newProgress(today);
  const box = p.box;

  function answer(chosen: Choice | null) {
    if (flip) return; // 이미 채점됨
    const ms = performance.now() - startRef.current;
    const ans: Answer = chosen ? (chosen.correct ? "correct" : "wrong") : "dunno";

    const res = judge(p, {
      answer: ans,
      ms,
      selfWord: item.word.word,
      chosenWord: chosen?.correct ? undefined : chosen?.word,
      isReinsert: item.isReinsert,
      threshold: profile.timeThreshold,
      today,
    });

    workRef.current = { ...workRef.current, [item.key]: res.next };

    if (res.requeue) {
      // 4~6문제 뒤 재삽입
      const pos = Math.min(idx + 1 + reinsertOffset(), queue.length);
      queue.splice(pos, 0, { ...item, isReinsert: true });
      todayWrongRef.current = [item.key, ...todayWrongRef.current.filter((k) => k !== item.key)];
    }

    answeredRef.current += 1;
    // 이탈 대비: 5문제마다 중간 저장
    if (answeredRef.current % 5 === 0) commitProgress(workRef.current);

    setFlip({ answer: ans, chosen });
  }

  function next() {
    const ni = idx + 1;
    if (ni >= queueRef.current.length) {
      // 세션 마지막 3문제는 오늘 틀린 것으로 채운다
      if (!tailAddedRef.current) {
        tailAddedRef.current = true;
        const tail = makeReviewTail(
          decks,
          todayWrongRef.current,
          workRef.current,
          profile.cardsEnabled,
          3,
        );
        if (tail.length) {
          queueRef.current = [...queueRef.current, ...tail];
          force((n) => n + 1);
          setFlip(null);
          setIdx(ni);
          return;
        }
      }
      commitProgress(workRef.current); // 세션 종료 저장
      setDone(true);
      return;
    }
    setFlip(null);
    setIdx(ni);
  }

  const progressPct = Math.round((idx / queueRef.current.length) * 100);
  const flipped = !!flip;
  const wrongOrDunno = flip && flip.answer !== "correct";
  // 카드2는 답 전에는 단어가 안 보임 → 뒤집힌 뒤에만 발음/단어 노출
  const wordVisible = item.card === 1 || item.card === 3 || flipped;

  return (
    <div className="screen">
      {/* 진행도 + 경과 */}
      <div className="progressbar">
        <div style={{ width: `${progressPct}%` }} />
      </div>
      <div className="row small muted" style={{ marginBottom: 14 }}>
        <span>
          {idx + 1} / {queueRef.current.length}
        </span>
        <span className="spacer" />
        <span className="badge">{CARD_LABEL[item.card]}</span>
        <span className="badge box">박스 {box}</span>
        {item.isReinsert && <span className="badge">재복습</span>}
      </div>

      {/* 문제 */}
      <div className="card">
        {item.card === 1 && (
          <>
            <div className="big-en">{item.word.word}</div>
            <div style={{ marginTop: 10 }}>
              <Pronunciation word={item.word} box={box} useKoPron={profile.useKoPron} />
            </div>
            <div className="muted small" style={{ marginTop: 10 }}>
              알맞은 뜻을 고르세요
            </div>
          </>
        )}
        {item.card === 2 && (
          <>
            <div style={{ fontSize: 18, lineHeight: 1.6 }}>{question.prompt}</div>
            <div className="muted small" style={{ marginTop: 10 }}>
              빈칸에 알맞은 뜻을 고르세요
            </div>
            {wordVisible && (
              <div style={{ marginTop: 10 }}>
                <div className="big-en" style={{ fontSize: 24 }}>
                  {item.word.word}
                </div>
                <Pronunciation word={item.word} box={box} useKoPron={profile.useKoPron} />
              </div>
            )}
          </>
        )}
        {item.card === 3 && (
          <>
            <div className="big-en" style={{ fontSize: 26 }}>
              {item.word.word}
            </div>
            <div style={{ marginTop: 6 }}>
              <Pronunciation word={item.word} box={box} useKoPron={profile.useKoPron} />
            </div>
            <div style={{ fontSize: 16, lineHeight: 1.6, marginTop: 12 }}>{question.prompt}</div>
            <div className="muted small" style={{ marginTop: 10 }}>
              이 문맥에서의 뜻을 고르세요
            </div>
          </>
        )}
      </div>

      {/* 선지 */}
      {question.choices.map((c, i) => {
        const isChosen = flip?.chosen === c;
        let cls = "btn choice";
        if (flipped) {
          if (c.correct) cls += " correct";
          else if (isChosen) cls += " wrong";
          else cls += " dim";
        }
        return (
          <button key={i} className={cls} onClick={() => answer(c)} disabled={flipped}>
            {c.label}
            {flipped && <span className="exp">{c.explain}</span>}
          </button>
        );
      })}

      {/* 모르겠어요 / 다음 */}
      {!flipped ? (
        <button className="btn ghost" style={{ marginTop: 6 }} onClick={() => answer(null)}>
          모르겠어요
        </button>
      ) : (
        <>
          {wrongOrDunno && (
            <EtymologyCard word={item.word} useEtymology={profile.useEtymology} />
          )}
          <button className="btn primary" style={{ marginTop: 6 }} onClick={next}>
            다음
          </button>
        </>
      )}
    </div>
  );
}
