/* ------------------------------------------------------------------
   AI 생각 대화 (기획서 6.3 · 8절)

   규칙은 서버 프롬프트에만 있는 게 아니라 이 화면의 흐름에도 들어 있다.
   - 한 번에 질문 하나만 보여준다.
   - 학생이 막히면 압박하지 않고 선택지·건너뛰기·마치기를 준다.
   - 대화가 끝나면 완성된 글이 아니라 생각 카드로 넘어간다.
------------------------------------------------------------------ */

import { useEffect, useRef, useState } from "react";
import { navigate } from "../App.jsx";
import {
  addEntryNote,
  appendMessage,
  completeConversation,
  conversationOfEntry,
  getEntry,
  listEntries,
  saveThinkingCard,
  startConversation,
} from "../lib/store.js";
import { EMOTION_MAP, defaultFrameFor, typeLabel } from "../lib/types.js";
import { askCoach, askOptions, buildCard } from "../lib/ai.js";
import { buildLocalCard, fallbackOptions, nextFallbackQuestion } from "../lib/fallback.js";
import { detectRisk } from "../lib/safety.js";
import { SafetyNotice } from "../components/SafetyNotice.jsx";
import { validateThinkingCard } from "../../shared/thinkingCard.js";
import {
  Button,
  Card,
  Chip,
  Dots,
  Empty,
  Modal,
  Notice,
  Textarea,
} from "../components/common.jsx";

export function Chat({ entryId }) {
  if (!entryId) return <PickEntry />;
  return <ChatSession key={entryId} entryId={entryId} />;
}

function PickEntry() {
  const entries = listEntries().filter((e) => e.status !== "completed");
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-[20px] font-semibold tracking-tight text-ink-900">
          어떤 기록으로 이야기해볼까?
        </h1>
        <p className="mt-1.5 text-sm text-ink-500">기록을 하나 고르면 거기서부터 질문이 시작돼요.</p>
      </header>
      {entries.length ? (
        <ul className="space-y-2">
          {entries.map((e) => (
            <li key={e.id}>
              <button
                onClick={() => navigate(`chat/${e.id}`)}
                className="w-full rounded-xl2 border border-line bg-paper-card px-4 py-3.5 text-left shadow-card hover:border-ochre-200"
              >
                <span className="text-xs text-ink-400">{typeLabel(e.type)}</span>
                <p className="mt-0.5 line-clamp-2 text-sm leading-6 text-ink-700">{e.initialNote}</p>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <Empty
          title="아직 기록이 없어요"
          description="짧은 기록을 하나 남기면 대화를 시작할 수 있어요."
          action={<Button variant="soft" onClick={() => navigate("new")}>기록 남기기</Button>}
        />
      )}
    </div>
  );
}

function ChatSession({ entryId }) {
  const entry = getEntry(entryId);
  const [conv, setConv] = useState(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [options, setOptions] = useState(null);
  const [notice, setNotice] = useState("");
  const [risk, setRisk] = useState(false);
  const [memoOpen, setMemoOpen] = useState(false);
  const [memo, setMemo] = useState("");
  const [finishing, setFinishing] = useState(false);
  const asked = useRef([]);
  const bottom = useRef(null);

  /* 대화 세션 준비 + 첫 질문 */
  useEffect(() => {
    if (!entry) return;
    const c = startConversation(entryId);
    setConv(c);
    asked.current = c.messages.filter((m) => m.role === "assistant").map((m) => m.content);
    if (c.messages.length === 0) ask(c, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryId]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  });

  const live = conv ? conversationOfEntry(entryId) : null;
  const messages = live?.messages || [];
  const studentTurns = messages.filter((m) => m.role === "student").length;

  if (!entry) {
    return (
      <div className="py-10 text-center text-ink-500">
        <p>기록을 찾을 수 없어요.</p>
      </div>
    );
  }

  /* 다음 질문 하나를 가져온다. AI 가 안 되면 질문 은행으로 이어간다. */
  async function ask(conversation, history) {
    setBusy(true);
    setOptions(null);
    try {
      const entryForAi = { ...entry, emotionLabels: labelsOf(entry) };
      let question = "";
      try {
        question = await askCoach({ entry: entryForAi, messages: history });
      } catch (e) {
        if (e.code === "no_key") setNotice("AI 연결 없이도 질문을 이어갈게. 준비된 질문으로 진행할게.");
        else setNotice("지금은 AI 응답을 받지 못했어. 준비된 질문으로 이어갈게.");
      }
      if (!question) {
        question = nextFallbackQuestion({
          entryType: entry.type,
          askedQuestions: asked.current,
          turn: history.filter((m) => m.role === "student").length,
        });
      }
      if (!question) {
        setNotice("물어볼 것은 여기까지야. 이제 생각 카드를 만들어볼까?");
        return;
      }
      asked.current = [...asked.current, question];
      appendMessage(conversation.id, { role: "assistant", content: question });
    } finally {
      setBusy(false);
    }
  }

  async function send(text) {
    const value = String(text ?? input).trim();
    if (!value || busy || !conv) return;
    if (detectRisk(value)) {
      setRisk(true);
      setInput("");
      return;
    }
    setInput("");
    appendMessage(conv.id, { role: "student", content: value });
    const history = [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "student", content: value },
    ];
    await ask(conv, history);
  }

  /* 학생이 '잘 모르겠어'를 눌렀을 때 */
  async function showOptions() {
    if (busy || !conv) return;
    setBusy(true);
    try {
      let list = [];
      try {
        list = await askOptions({
          entry: { ...entry, emotionLabels: labelsOf(entry) },
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        });
      } catch {
        /* 조용히 기본 선택지로 넘어간다 */
      }
      setOptions(list.length ? list : fallbackOptions());
    } finally {
      setBusy(false);
    }
  }

  /* 질문 바꾸기 / 건너뛰기 — 압박하지 않는다 */
  async function rephrase() {
    if (busy || !conv) return;
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    await ask(conv, [...history, { role: "student", content: "이 질문은 답하기 어려워. 다른 걸 물어봐 줘." }]);
  }

  async function finish() {
    if (!conv) return;
    setFinishing(true);
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    const entryForAi = { ...entry, emotionLabels: labelsOf(entry) };

    let card = null;
    try {
      card = await buildCard({
        entry: entryForAi,
        messages: history,
        fallbackFrameType: defaultFrameFor(entry.type),
      });
    } catch {
      /* AI 없이도 카드를 만든다 */
    }
    if (card) {
      const checked = validateThinkingCard(card, { fallbackFrameType: defaultFrameFor(entry.type) });
      card = checked.ok ? checked.card : null;
    }
    if (!card) card = buildLocalCard({ entry: entryForAi, messages: history });

    saveThinkingCard(entry.id, card);
    completeConversation(conv.id);
    setFinishing(false);
    navigate(`card/${entry.id}`);
  }

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs text-ink-400">{typeLabel(entry.type)}</span>
          <h1 className="mt-0.5 text-[19px] font-semibold tracking-tight text-ink-900">
            생각 대화
          </h1>
        </div>
        <Button variant="quiet" size="sm" onClick={() => navigate(`entry/${entry.id}`)}>
          기록 보기
        </Button>
      </header>

      <Card className="bg-paper-soft px-4 py-3.5">
        <p className="text-xs text-ink-400">내가 적은 기록</p>
        <p className="mt-1 line-clamp-3 text-sm leading-6 text-ink-700">{entry.initialNote}</p>
      </Card>

      {notice ? <Notice tone="warn">{notice}</Notice> : null}

      <div className="space-y-3">
        {messages.map((m) =>
          m.role === "assistant" ? (
            <div key={m.id} className="flex gap-2.5">
              <span className="mt-1 h-6 w-6 shrink-0 rounded-full bg-ochre-100" />
              <p className="max-w-[85%] rounded-xl2 rounded-tl-md bg-paper-card px-3.5 py-3 text-[15px] leading-7 text-ink-900 shadow-card">
                {m.content}
              </p>
            </div>
          ) : (
            <div key={m.id} className="flex justify-end">
              <p className="max-w-[85%] whitespace-pre-wrap rounded-xl2 rounded-br-md bg-ochre-50 px-3.5 py-3 text-[15px] leading-7 text-ink-900">
                {m.content}
              </p>
            </div>
          )
        )}
        {busy ? (
          <div className="flex gap-2.5">
            <span className="mt-1 h-6 w-6 shrink-0 rounded-full bg-ochre-100" />
            <span className="rounded-xl2 bg-paper-card px-3.5 py-4 shadow-card">
              <Dots />
            </span>
          </div>
        ) : null}
        <div ref={bottom} />
      </div>

      {options ? (
        <div className="flex flex-wrap gap-1.5">
          {options.map((o, i) => (
            <Chip key={i} onClick={() => send(o)}>
              {o}
            </Chip>
          ))}
        </div>
      ) : null}

      <div className="space-y-2">
        <Textarea
          rows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="한 단어만 적어도 괜찮아"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
          }}
        />
        <div className="flex flex-wrap items-center gap-1.5">
          <Button onClick={() => send()} disabled={busy || !input.trim()}>
            보내기
          </Button>
          <Button variant="outline" size="sm" onClick={showOptions} disabled={busy}>
            잘 모르겠어
          </Button>
          <Button variant="ghost" size="sm" onClick={rephrase} disabled={busy}>
            다른 질문
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setMemoOpen(true)}>
            메모 남기기
          </Button>
          <div className="flex-1" />
          <Button
            variant="soft"
            size="sm"
            onClick={finish}
            disabled={finishing || studentTurns === 0}
            title={studentTurns === 0 ? "한 번은 답해야 카드를 만들 수 있어요" : undefined}
          >
            {finishing ? "정리하는 중…" : "대화 마치기"}
          </Button>
        </div>
        <p className="text-xs text-ink-400">
          대화를 마치면 완성된 글 대신 키워드와 글쓰기 구조를 정리해줄게.
        </p>
      </div>

      <Modal
        open={memoOpen}
        onClose={() => setMemoOpen(false)}
        title="생각 메모"
        footer={
          <>
            <Button variant="outline" onClick={() => setMemoOpen(false)}>
              취소
            </Button>
            <Button
              onClick={() => {
                if (memo.trim()) addEntryNote(entry.id, memo);
                setMemo("");
                setMemoOpen(false);
              }}
            >
              저장
            </Button>
          </>
        }
      >
        <Textarea
          rows={4}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="대화 중에 떠오른 생각을 적어둬. 나중에 글 쓸 때 다시 볼 수 있어."
        />
      </Modal>

      <SafetyNotice open={risk} onClose={() => setRisk(false)} />
    </div>
  );
}

function labelsOf(entry) {
  return (entry.emotionTags || []).map((id) => EMOTION_MAP[id]?.label).filter(Boolean);
}
