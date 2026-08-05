import React, { useMemo, useState } from "react";
import { Screen, Header, Card, Button, Empty, Pill } from "../components/common.jsx";
import { todayKey } from "../lib/srs.js";
import { generateSentences, AIError } from "../lib/ai.js";
import { flattenWords } from "../lib/session.js";

export default function Sentences({ sentences, decks, pendingWrong, onAddSentences, onClearPending }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const pool = useMemo(() => flattenWords(decks), [decks]);
  const wordByText = useMemo(() => {
    const m = new Map();
    for (const w of pool) m.set(w.word.toLowerCase(), w.id);
    return m;
  }, [pool]);

  // 최신순 정렬
  const list = useMemo(
    () => [...sentences].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")),
    [sentences]
  );

  const today = todayKey();
  const todays = list.filter((s) => (s.createdAt || "").slice(0, 10) === today);

  async function generate(words) {
    setErr(null);
    setBusy(true);
    try {
      const payload = words.map((w) => ({ word: w.word, meaning: w.meaning, pos: w.pos }));
      const gen = await generateSentences(payload);
      const now = new Date().toISOString();
      const built = gen.map((s, i) => {
        const targetWordIds = (s.targetWords || [])
          .map((t) => wordByText.get(String(t).toLowerCase()))
          .filter(Boolean);
        return {
          id: `s_${Date.now().toString(36)}_${i}`,
          text: s.text,
          translation: s.translation || "",
          targetWordIds,
          createdAt: now,
        };
      });
      onAddSentences(built);
      onClearPending();
    } catch (e) {
      setErr(e instanceof AIError ? e.message : "예문 생성에 실패했어요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Header title="오늘의 문장" sub="틀린 단어로 만든 예문 · 다음 세션 빈칸 문제로 재활용" />

      {/* 대기 중인 틀린 단어로 생성 */}
      {pendingWrong && pendingWrong.length > 0 && (
        <Card className="p-5 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Pill tone="bad">오늘 틀린 단어 {pendingWrong.length}개</Pill>
          </div>
          <p className="text-sm text-muted mb-4">
            {pendingWrong.slice(0, 6).map((w) => w.word).join(", ")}
            {pendingWrong.length > 6 ? " …" : ""}
          </p>
          <Button className="w-full py-3.5" onClick={() => generate(pendingWrong)} disabled={busy}>
            {busy ? "생성 중…" : "AI로 예문 만들기"}
          </Button>
          {err && <p className="text-bad text-sm mt-3">{err}</p>}
        </Card>
      )}

      {err && (!pendingWrong || pendingWrong.length === 0) && (
        <Card className="p-4 mb-4">
          <p className="text-bad text-sm">{err}</p>
        </Card>
      )}

      {list.length === 0 ? (
        <Empty
          icon="✍️"
          title="아직 만든 문장이 없어요"
          desc="학습에서 단어를 틀리면, 그 단어들로 예문을 만들 수 있어요. 만든 예문은 다음 복습의 빈칸 문제로 다시 나옵니다."
        />
      ) : (
        <>
          {todays.length > 0 && (
            <>
              <div className="text-sm font-semibold text-muted mb-3">오늘</div>
              <div className="space-y-3 mb-6">
                {todays.map((s) => (
                  <SentenceCard key={s.id} s={s} />
                ))}
              </div>
            </>
          )}
          {list.length > todays.length && (
            <>
              <div className="text-sm font-semibold text-muted mb-3">이전</div>
              <div className="space-y-3">
                {list
                  .filter((s) => (s.createdAt || "").slice(0, 10) !== today)
                  .map((s) => (
                    <SentenceCard key={s.id} s={s} />
                  ))}
              </div>
            </>
          )}
        </>
      )}
    </Screen>
  );
}

function SentenceCard({ s }) {
  return (
    <Card className="p-4">
      <p className="text-gray-100 leading-relaxed">{highlight(s.text)}</p>
      {s.translation && <p className="text-sm text-muted mt-2">{s.translation}</p>}
    </Card>
  );
}

/* 밑줄 강조 없이 그대로 (타깃 단어는 굵게 표시는 생략 — 원문 유지) */
function highlight(text) {
  return text;
}
