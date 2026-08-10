/* 기록 상세 — 여기서 대화·카드·글쓰기로 이어진다 */

import { useState } from "react";
import { navigate } from "../App.jsx";
import {
  cardOfEntry,
  conversationOfEntry,
  deleteEntry,
  draftOfEntry,
  getEntry,
  updateEntry,
} from "../lib/store.js";
import { EMOTION_MAP, typeEmoji, typeLabel } from "../lib/types.js";
import { Button, Card, Chip, Modal, SectionTitle, Textarea } from "../components/common.jsx";

export function EntryDetail({ entryId }) {
  const entry = getEntry(entryId);
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState(entry?.initialNote || "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!entry) {
    return (
      <div className="py-10 text-center text-ink-500">
        <p>기록을 찾을 수 없어요.</p>
        <Button variant="soft" className="mt-4" onClick={() => navigate("collect")}>
          나의 닷으로
        </Button>
      </div>
    );
  }

  const conv = conversationOfEntry(entry.id);
  const card = cardOfEntry(entry.id);
  const draft = draftOfEntry(entry.id);

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs text-ink-400">
            {typeEmoji(entry.type)} {typeLabel(entry.type)} · {new Date(entry.createdAt).toLocaleDateString("ko-KR")}
          </span>
          <h1 className="mt-1 text-[20px] font-semibold tracking-tight text-ink-900">
            {entry.sourceTitle || "오늘의 기록"}
          </h1>
        </div>
        <Button variant="quiet" size="sm" onClick={() => navigate("collect")}>
          목록
        </Button>
      </header>

      <Card className="p-4">
        {editing ? (
          <div className="space-y-3">
            <Textarea rows={6} value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  updateEntry(entry.id, { initialNote: note });
                  setEditing(false);
                }}
              >
                저장
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                취소
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="whitespace-pre-wrap text-[15px] leading-7 text-ink-900">
              {entry.initialNote}
            </p>
            {entry.emotionTags?.length ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {entry.emotionTags.map((id) => (
                  <Chip key={id}>
                    <span aria-hidden="true" className="mr-1">{EMOTION_MAP[id]?.emoji}</span>
                    {EMOTION_MAP[id]?.label || id}
                  </Chip>
                ))}
              </div>
            ) : null}
            {entry.bodyFeelings?.length ? (
              <p className="mt-2 text-sm text-ink-500">몸의 느낌 · {entry.bodyFeelings.join(", ")}</p>
            ) : null}
            {entry.sourceUrl ? (
              <a
                href={entry.sourceUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-3 inline-block break-all text-sm text-ochre-700 underline underline-offset-4"
              >
                {entry.sourceUrl}
              </a>
            ) : null}
            <div className="mt-4 flex gap-2">
              <Button variant="quiet" size="sm" onClick={() => setEditing(true)}>
                고치기
              </Button>
              <Button variant="quiet" size="sm" onClick={() => setConfirmDelete(true)}>
                삭제
              </Button>
            </div>
          </>
        )}
      </Card>

      {entry.notes?.length ? (
        <section>
          <SectionTitle>대화 중에 남긴 메모</SectionTitle>
          <ul className="space-y-2">
            {entry.notes.map((n) => (
              <li key={n.id} className="rounded-xl2 bg-paper-soft px-3.5 py-3 text-sm leading-6 text-ink-700">
                {n.text}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-2">
        <SectionTitle>다음으로 해볼 것</SectionTitle>

        <NextAction
          title={conv ? "대화 이어가기" : "AI와 이야기하며 생각 찾기"}
          desc={
            conv
              ? `${conv.messages.filter((m) => m.role === "student").length}번 답했어요`
              : "한 번에 하나씩 묻고, 완성된 글은 만들지 않아요"
          }
          onClick={() => navigate(`chat/${entry.id}`)}
        />

        {card ? (
          <NextAction
            title="생각 설계 카드 보기"
            desc="키워드 · 감정 흐름 · 글쓰기 구조"
            onClick={() => navigate(`card/${entry.id}`)}
          />
        ) : null}

        <NextAction
          title={draft ? "쓰던 글 이어 쓰기" : "직접 글 쓰기"}
          desc={draft ? draft.title || "제목 없는 글" : "카드를 옆에 두고 내 언어로"}
          onClick={() => navigate(`write/${entry.id}`)}
        />
      </section>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="이 기록을 지울까?"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              그대로 두기
            </Button>
            <Button
              onClick={() => {
                deleteEntry(entry.id);
                navigate("collect");
              }}
            >
              지우기
            </Button>
          </>
        }
      >
        이 기록과 함께 나눈 대화, 생각 카드, 쓰던 글도 같이 지워져요. 되돌릴 수 없어요.
      </Modal>
    </div>
  );
}

function NextAction({ title, desc, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 rounded-xl2 border border-line bg-paper-card px-4 py-3.5 text-left shadow-card transition-colors hover:border-ochre-200 hover:bg-ochre-50/40"
    >
      <span>
        <span className="block text-[15px] font-medium text-ink-900">{title}</span>
        <span className="mt-0.5 block text-sm text-ink-500">{desc}</span>
      </span>
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-ink-400" fill="none">
        <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
