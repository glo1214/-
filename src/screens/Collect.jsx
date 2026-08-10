/* 생각 수집함 (기획서 6.2)
   완성된 글이 아니어도 되는, 나중에 키울 수 있는 재료를 모으는 곳 */

import { useState } from "react";
import { navigate } from "../App.jsx";
import { createEntry, listEntries } from "../lib/store.js";
import { ENTRY_TYPES, typeEmoji, typeLabel } from "../lib/types.js";
import { detectRisk } from "../lib/safety.js";
import { SafetyNotice } from "../components/SafetyNotice.jsx";
import { Button, Card, Chip, Empty, SectionTitle, Textarea } from "../components/common.jsx";

const QUICK_TYPES = ["thought", "attraction", "daily_emotion"];

export function Collect() {
  const [note, setNote] = useState("");
  const [type, setType] = useState("thought");
  const [filter, setFilter] = useState("");
  const [risk, setRisk] = useState(false);

  const entries = listEntries({ type: filter || undefined });

  function quickSave() {
    const value = note.trim();
    if (!value) return;
    if (detectRisk(value)) {
      setRisk(true);
      return;
    }
    createEntry({ type, initialNote: value, emotionTags: [], bodyFeelings: [] });
    setNote("");
  }

  return (
    <div className="space-y-7">
      <header>
        <h1 className="text-[20px] font-semibold tracking-tight text-ink-900">점 모음</h1>
        <p className="mt-1.5 text-sm text-ink-500">
          찍어둔 점이 여기 모여요. 한 줄 메모, 오래 머문 문장, 궁금한 질문 — 아직 글이 아니어도 괜찮아요.
        </p>
      </header>

      <Card className="p-4">
        <Textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="지금 떠오른 것을 한 줄로 적어보세요"
        />
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {QUICK_TYPES.map((id) => (
            <Chip key={id} active={type === id} onClick={() => setType(id)}>
              {typeEmoji(id)} {typeLabel(id)}
            </Chip>
          ))}
          <div className="flex-1" />
          <Button size="sm" onClick={quickSave} disabled={!note.trim()}>
            점 찍기
          </Button>
        </div>
        <button
          onClick={() => navigate("new")}
          className="mt-3 text-sm text-ink-500 underline underline-offset-4 hover:text-ink-900"
        >
          책·영화·뉴스처럼 자세히 기록하기
        </button>
      </Card>

      <section>
        <SectionTitle
          action={
            <button
              onClick={() => navigate("library")}
              className="text-sm text-ink-500 hover:text-ink-900"
            >
              전체 서랍
            </button>
          }
        >
          찍어둔 점
        </SectionTitle>

        <div className="mb-3 flex flex-wrap gap-1.5">
          <Chip active={!filter} onClick={() => setFilter("")}>
            전체
          </Chip>
          {ENTRY_TYPES.map((t) => (
            <Chip key={t.id} active={filter === t.id} onClick={() => setFilter(t.id)}>
              {t.short}
            </Chip>
          ))}
        </div>

        {entries.length ? (
          <ul className="space-y-2">
            {entries.map((e) => (
              <li key={e.id}>
                <button
                  onClick={() => navigate(`entry/${e.id}`)}
                  className="w-full rounded-xl2 border border-line bg-paper-card px-4 py-3.5 text-left shadow-card hover:border-line-strong"
                >
                  <div className="flex items-center gap-2 text-xs text-ink-400">
                    <span>{typeEmoji(e.type)} {typeLabel(e.type)}</span>
                    <span>·</span>
                    <span>{new Date(e.createdAt).toLocaleDateString("ko-KR")}</span>
                    <StatusTag status={e.status} />
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-ink-700">
                    {e.sourceTitle ? `《${e.sourceTitle}》 ` : ""}
                    {e.initialNote}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <Empty
            title="아직 찍은 점이 없어요"
            art="notebook"
            description="위에 한 줄만 적어도 점 하나예요."
          />
        )}
      </section>

      <SafetyNotice open={risk} onClose={() => setRisk(false)} />
    </div>
  );
}

export function StatusTag({ status }) {
  const map = {
    idea: null,
    chatting: "대화 중",
    writing: "작성 중",
    completed: "완성",
  };
  const label = map[status];
  if (!label) return null;
  return (
    <span className="rounded-full bg-paper-sand px-1.5 py-0.5 text-[11px] text-ink-500">{label}</span>
  );
}
