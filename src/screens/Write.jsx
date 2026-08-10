/* ------------------------------------------------------------------
   글쓰기 작업실 (기획서 6.4)

   AI 는 이 화면에서 빈칸을 채우지 않는다.
   왼쪽(모바일에서는 탭)에 생각 카드를 두고, 학생이 직접 쓴다.
   맞춤법 확인은 학생이 눌렀을 때만, 원문을 지우지 않고 제안만 보여준다.
------------------------------------------------------------------ */

import { useEffect, useMemo, useRef, useState } from "react";
import { navigate } from "../App.jsx";
import {
  cardOfEntry,
  completeDraft,
  draftOfEntry,
  ensureDraft,
  getEntry,
  listEntries,
  reopenDraft,
  saveDraft,
  snapshotDraft,
} from "../lib/store.js";
import { typeEmoji, typeLabel } from "../lib/types.js";
import { proofread } from "../lib/ai.js";
import { ThinkingCardView } from "../components/ThinkingCard.jsx";
import {
  Button,
  Card,
  Empty,
  Input,
  Modal,
  Notice,
  Textarea,
} from "../components/common.jsx";

export function Write({ entryId }) {
  if (!entryId) return <PickEntry />;
  return <Studio key={entryId} entryId={entryId} />;
}

function PickEntry() {
  const entries = listEntries();
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-[20px] font-semibold tracking-tight text-ink-900">어떤 기록으로 글을 쓸까?</h1>
      </header>
      {entries.length ? (
        <ul className="space-y-2">
          {entries.map((e) => (
            <li key={e.id}>
              <button
                onClick={() => navigate(`write/${e.id}`)}
                className="w-full rounded-xl2 border border-line bg-paper-card px-4 py-3.5 text-left shadow-card hover:border-ochre-200"
              >
                <span className="text-xs text-ink-400">{typeEmoji(e.type)} {typeLabel(e.type)}</span>
                <p className="mt-0.5 line-clamp-2 text-sm leading-6 text-ink-700">{e.initialNote}</p>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <Empty
          title="아직 기록이 없어요"
          art="paper"
          action={<Button variant="soft" onClick={() => navigate("new")}>기록 남기기</Button>}
        />
      )}
    </div>
  );
}

function Studio({ entryId }) {
  const entry = getEntry(entryId);
  const card = entry ? cardOfEntry(entryId) : null;
  const [draftId, setDraftId] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [savedAt, setSavedAt] = useState(null);
  const [pane, setPane] = useState("write"); // 모바일 전용 탭
  const [proof, setProof] = useState(null);
  const [proofBusy, setProofBusy] = useState(false);
  const [proofError, setProofError] = useState("");
  const [versionsOpen, setVersionsOpen] = useState(false);
  const editorRef = useRef(null);
  const timer = useRef(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (!entry) return;
    const d = ensureDraft(entryId);
    setDraftId(d.id);
    setTitle(d.title);
    setContent(d.content);
    loaded.current = true;
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryId]);

  /* 자동 임시 저장 — 입력이 멈추고 700ms 뒤 */
  useEffect(() => {
    if (!draftId || !loaded.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      saveDraft(draftId, { title, content });
      setSavedAt(new Date());
    }, 700);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [title, content, draftId]);

  const draft = draftId ? draftOfEntry(entryId) : null;
  const charCount = useMemo(() => content.replace(/\s/g, "").length, [content]);

  if (!entry) return <div className="py-10 text-center text-ink-500">기록을 찾을 수 없어요.</div>;

  function insertText(text) {
    const el = editorRef.current;
    if (!el) {
      setContent((c) => (c ? `${c}\n${text}` : text));
      return;
    }
    const start = el.selectionStart ?? content.length;
    const end = el.selectionEnd ?? content.length;
    const before = content.slice(0, start);
    const after = content.slice(end);
    const glue = before && !before.endsWith("\n") ? "\n" : "";
    const next = `${before}${glue}${text}${after}`;
    setContent(next);
    setPane("write");
    requestAnimationFrame(() => {
      el.focus();
      const pos = (before + glue + text).length;
      el.setSelectionRange(pos, pos);
    });
  }

  async function runProofread() {
    if (!content.trim()) return;
    setProofBusy(true);
    setProofError("");
    try {
      const items = await proofread(content);
      setProof(items);
    } catch (e) {
      setProofError(
        e.code === "no_key"
          ? "맞춤법 확인은 AI 연결이 필요해요. 지금은 쓸 수 없어요."
          : "지금은 확인이 어려워요. 잠시 뒤에 다시 해볼까요?"
      );
      setProof([]);
    } finally {
      setProofBusy(false);
    }
  }

  function applySuggestion(item) {
    setContent((c) => c.replace(item.original, item.suggestion));
    setProof((list) => list.filter((i) => i !== item));
  }

  const cardPanel = card ? (
    <ThinkingCardView card={card} onInsert={insertText} />
  ) : (
    <Empty
      title="생각 카드가 아직 없어요"
      art="cards"
      description="대화를 마치면 키워드와 글쓰기 구조가 만들어져요. 없어도 바로 쓸 수 있어요."
      action={<Button variant="soft" size="sm" onClick={() => navigate(`chat/${entryId}`)}>대화하러 가기</Button>}
    />
  );

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs text-ink-400">{typeEmoji(entry.type)} {typeLabel(entry.type)}</span>
          <h1 className="mt-0.5 text-[20px] font-semibold tracking-tight text-ink-900">글쓰기 작업실</h1>
        </div>
        <div className="text-right text-xs text-ink-400">
          {draft?.status === "completed" ? (
            <span className="rounded-full bg-ochre-50 px-2 py-1 text-ochre-700">완성</span>
          ) : savedAt ? (
            <span>
              자동 저장됨 · {savedAt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          ) : (
            <span>쓰는 동안 자동으로 저장돼요</span>
          )}
        </div>
      </header>

      {/* 모바일 탭 */}
      <div className="flex gap-1 rounded-xl2 bg-paper-sand p-1 md:hidden">
        {[
          ["write", "쓰기"],
          ["card", "생각 카드"],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setPane(id)}
            className={`flex-1 rounded-lg py-2 text-sm ${
              pane === id ? "bg-paper-card text-ink-900 shadow-card" : "text-ink-500"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <div className={`${pane === "card" ? "block" : "hidden"} md:block`}>
          <div className="md:sticky md:top-6 md:max-h-[calc(100vh-6rem)] md:overflow-y-auto thin-scroll">
            {cardPanel}
          </div>
        </div>

        <div className={`${pane === "write" ? "block" : "hidden"} md:block space-y-3`}>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목 (나중에 붙여도 돼요)"
            className="text-[17px] font-medium"
          />
          <Textarea
            ref={editorRef}
            rows={16}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="여기서부터는 네 문장이야. 한 문단씩 천천히 써도 좋아."
            className="editor min-h-[45vh]"
          />

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs text-ink-400">{charCount}자</span>
            <Button variant="outline" size="sm" onClick={runProofread} disabled={proofBusy || !content.trim()}>
              {proofBusy ? "확인 중…" : "맞춤법 확인"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                snapshotDraft(draftId);
                setVersionsOpen(true);
              }}
            >
              이전 버전
            </Button>
            <div className="flex-1" />
            {draft?.status === "completed" ? (
              <>
                <Button variant="outline" size="sm" onClick={() => reopenDraft(draftId)}>
                  다시 쓰기
                </Button>
                <Button size="sm" onClick={() => navigate(`submit/${entryId}`)}>
                  숙제로 내기
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => navigate(`submit/${entryId}`)} disabled={!content.trim()}>
                  숙제로 내기
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    saveDraft(draftId, { title, content });
                    snapshotDraft(draftId);
                    completeDraft(draftId);
                  }}
                  disabled={!content.trim()}
                >
                  다 썼어요
                </Button>
              </>
            )}
          </div>

          {proofError ? <Notice tone="warn">{proofError}</Notice> : null}
        </div>
      </div>

      <Modal
        open={proof !== null}
        onClose={() => setProof(null)}
        title="고쳐 볼 수 있는 부분"
        footer={
          <Button variant="outline" onClick={() => setProof(null)}>
            닫기
          </Button>
        }
      >
        {proof && proof.length ? (
          <>
            <p className="mb-3 text-sm text-ink-500">
              고칠지 말지는 네가 정해. 반영하지 않아도 괜찮아.
            </p>
            <ul className="space-y-3">
              {proof.map((item, i) => (
                <li key={i} className="rounded-xl2 border border-line px-3.5 py-3">
                  <p className="text-sm">
                    <span className="text-ink-400">내가 쓴 문장 · </span>
                    <span className="text-ink-900">{item.original}</span>
                  </p>
                  <p className="mt-1 text-sm">
                    <span className="text-ink-400">고쳐 볼 수 있는 부분 · </span>
                    <span className="text-ochre-700">{item.suggestion}</span>
                  </p>
                  <p className="mt-1 text-sm text-ink-500">{item.reason}</p>
                  <Button variant="soft" size="sm" className="mt-2.5" onClick={() => applySuggestion(item)}>
                    이걸로 바꾸기
                  </Button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-sm text-ink-500">고칠 부분을 찾지 못했어. 그대로 두어도 좋아.</p>
        )}
      </Modal>

      <Modal open={versionsOpen} onClose={() => setVersionsOpen(false)} title="이전 버전">
        {draft?.versions?.length ? (
          <ul className="space-y-2">
            {[...draft.versions].reverse().map((v) => (
              <li key={v.savedAt} className="rounded-xl2 border border-line px-3.5 py-3">
                <p className="text-xs text-ink-400">
                  {new Date(v.savedAt).toLocaleString("ko-KR")} · {v.content.replace(/\s/g, "").length}자
                </p>
                <p className="mt-1 line-clamp-3 text-sm leading-6 text-ink-700">{v.content}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    setTitle(v.title);
                    setContent(v.content);
                    setVersionsOpen(false);
                  }}
                >
                  이 버전으로 되돌리기
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-500">아직 저장된 이전 버전이 없어요.</p>
        )}
      </Modal>
    </div>
  );
}
