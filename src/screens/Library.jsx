/* 나의 글 보관함 (기획서 6.7) — 유형·상태 필터 + 검색 */

import { useState } from "react";
import { navigate } from "../App.jsx";
import { draftOfEntry, listEntries } from "../lib/store.js";
import { ENTRY_TYPES, typeLabel } from "../lib/types.js";
import { StatusTag } from "./Collect.jsx";
import { Chip, Empty, Input } from "../components/common.jsx";

const STATUSES = [
  { id: "", label: "전체" },
  { id: "idea", label: "기록만" },
  { id: "chatting", label: "대화 중" },
  { id: "writing", label: "작성 중" },
  { id: "completed", label: "완성" },
];

export function Library() {
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");

  const entries = listEntries({
    type: type || undefined,
    status: status || undefined,
    query: query || undefined,
  });

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-[20px] font-semibold tracking-tight text-ink-900">보관함</h1>
        <p className="mt-1.5 text-sm text-ink-500">기록과 완성한 글이 시간순으로 쌓여요.</p>
      </header>

      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="기록 안에서 검색"
      />

      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          <Chip active={!type} onClick={() => setType("")}>
            모든 유형
          </Chip>
          {ENTRY_TYPES.map((t) => (
            <Chip key={t.id} active={type === t.id} onClick={() => setType(t.id)}>
              {t.short}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => (
            <Chip key={s.id} active={status === s.id} onClick={() => setStatus(s.id)}>
              {s.label}
            </Chip>
          ))}
        </div>
      </div>

      {entries.length ? (
        <ul className="space-y-2">
          {entries.map((e) => {
            const draft = draftOfEntry(e.id);
            return (
              <li key={e.id}>
                <button
                  onClick={() => navigate(draft ? `write/${e.id}` : `entry/${e.id}`)}
                  className="w-full rounded-xl2 border border-line bg-paper-card px-4 py-3.5 text-left shadow-card hover:border-line-strong"
                >
                  <div className="flex items-center gap-2 text-xs text-ink-400">
                    <span>{typeLabel(e.type)}</span>
                    <span>·</span>
                    <span>{new Date(e.updatedAt).toLocaleDateString("ko-KR")}</span>
                    <StatusTag status={e.status} />
                  </div>
                  <p className="mt-1 text-[15px] font-medium text-ink-900">
                    {draft?.title || e.sourceTitle || "제목 없는 기록"}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-sm leading-6 text-ink-500">
                    {draft?.content || e.initialNote}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <Empty title="조건에 맞는 기록이 없어요" description="필터를 바꾸거나 검색어를 지워보세요." />
      )}
    </div>
  );
}
