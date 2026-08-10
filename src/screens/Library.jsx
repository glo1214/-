/* 나의 글 보관함 (기획서 6.7) — 유형·상태 필터 + 검색 */

import { useState } from "react";
import { navigate } from "../App.jsx";
import { draftOfEntry, listEntries } from "../lib/store.js";
import { ENTRY_TYPES, typeEmoji, typeLabel } from "../lib/types.js";
import { StatusTag } from "./Collect.jsx";
import { Chip, Empty, Input } from "../components/common.jsx";

const STATUSES = [
  { id: "", label: "전체" },
  { id: "idea", label: "기록만" },
  { id: "chatting", label: "대화 중" },
  { id: "writing", label: "작성 중" },
  { id: "completed", label: "완성" },
];

const DRAWERS = [
  { id: "", label: "두 서랍 모두" },
  { id: "class", label: "수업 서랍" },
  { id: "private", label: "내 서랍" },
];

export function Library() {
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [drawer, setDrawer] = useState("");
  const [query, setQuery] = useState("");

  const entries = listEntries({
    type: type || undefined,
    status: status || undefined,
    visibility: drawer || undefined,
    query: query || undefined,
  });

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-[20px] font-semibold tracking-tight text-ink-900">서랍</h1>
        <p className="mt-1.5 text-sm text-ink-500">찍어둔 점과 완성한 글이 여기 다 있어요.</p>
      </header>

      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="글·기록·키워드까지 한꺼번에 찾기"
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
          {DRAWERS.map((d) => (
            <Chip key={d.id} active={drawer === d.id} onClick={() => setDrawer(d.id)}>
              {d.label}
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
                    <span>{typeEmoji(e.type)} {typeLabel(e.type)}</span>
                    <span>·</span>
                    <span>{new Date(e.updatedAt).toLocaleDateString("ko-KR")}</span>
                    <StatusTag status={e.status} />
                    {(e.visibility || "class") === "private" ? (
                      <span className="rounded-full bg-paper-sand px-1.5 py-0.5 text-[11px] text-ink-500">
                        내 서랍
                      </span>
                    ) : null}
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
        <Empty title="여기에 해당하는 게 없어요" description="필터를 바꾸거나 검색어를 지워보세요." />
      )}
    </div>
  );
}
