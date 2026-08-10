/* 생각 설계 카드 — 완성된 글이 아니라 학생이 직접 쓸 재료 (기획서 9절) */

import { Card, Chip } from "./common.jsx";
import { frameOf } from "../lib/types.js";

function Block({ title, emoji, children, empty }) {
  return (
    <section className="border-t border-line px-4 py-3.5 first:border-t-0">
      <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-ink-400">
        {emoji ? <span aria-hidden="true" className="text-sm">{emoji}</span> : null}
        {title}
      </h4>
      {children || <p className="text-sm text-ink-400">{empty}</p>}
    </section>
  );
}

export function ThinkingCardView({ card, compact = false, onInsert }) {
  if (!card) return null;
  const w = card.studentWords || {};
  const frame = card.writingFrame || {};
  const frameMeta = frameOf(frame.frameType);
  const sections = frame.sections?.length ? frame.sections : frameMeta.sections;

  const has = (arr) => Array.isArray(arr) && arr.length > 0;

  return (
    <Card className={compact ? "overflow-hidden" : "overflow-hidden"}>
      <div className="flex items-center justify-between bg-paper-soft px-4 py-3">
        <div>
          <p className="text-[13px] font-semibold text-ink-900">생각 설계 카드</p>
          <p className="text-xs text-ink-400">네가 한 말에서 뽑은 재료야. 글은 네가 쓰는 거야.</p>
        </div>
        {card.generatedBy === "local" ? (
          <span className="shrink-0 whitespace-nowrap rounded-full bg-paper-sand px-2 py-1 text-[11px] text-ink-500">
            기기에서 정리
          </span>
        ) : null}
      </div>

      <Block emoji="🔑" title="핵심 키워드" empty="아직 뽑을 키워드가 부족해요.">
        {has(w.coreKeywords) ? (
          <div className="flex flex-wrap gap-1.5">
            {w.coreKeywords.map((k, i) => (
              <Chip key={i}>{k}</Chip>
            ))}
          </div>
        ) : null}
      </Block>

      {has(w.emotionFlow) ? (
        <Block emoji="🫧" title="감정의 흐름">
          <ol className="space-y-2">
            {w.emotionFlow.map((f, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ochre-300" />
                <span>
                  <span className="font-medium text-ink-900">{f.emotion}</span>
                  {f.evidence ? <span className="text-ink-500"> — {f.evidence}</span> : null}
                </span>
              </li>
            ))}
          </ol>
        </Block>
      ) : null}

      {has(w.memorableScenes) ? (
        <Block emoji="🖼" title="오래 머문 장면">
          <ul className="space-y-2">
            {w.memorableScenes.map((s, i) => (
              <li key={i} className="rounded-xl2 bg-paper-soft px-3 py-2.5 text-sm leading-6 text-ink-700">
                {s}
              </li>
            ))}
          </ul>
        </Block>
      ) : null}

      {has(w.studentQuestions) ? (
        <Block emoji="❓" title="내가 던진 질문">
          <ul className="space-y-1.5 text-sm text-ink-700">
            {w.studentQuestions.map((q, i) => (
              <li key={i}>· {q}</li>
            ))}
          </ul>
        </Block>
      ) : null}

      {has(w.connections) ? (
        <Block emoji="🔗" title="연결할 수 있는 생각">
          <ul className="space-y-1.5 text-sm text-ink-700">
            {w.connections.map((c, i) => (
              <li key={i}>· {c}</li>
            ))}
          </ul>
        </Block>
      ) : null}

      <Block emoji="🧱" title={`추천 글쓰기 구조 · ${frameMeta.label}`}>
        <ol className="space-y-2.5">
          {sections.map((s, i) => (
            <li key={i} className="flex gap-2.5 text-sm">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ochre-50 text-[11px] font-semibold text-ochre-700">
                {i + 1}
              </span>
              <span>
                <span className="font-medium text-ink-900">{s.label}</span>
                {s.guide ? <span className="block text-ink-500">{s.guide}</span> : null}
              </span>
            </li>
          ))}
        </ol>
      </Block>

      {has(card.sentenceStarters) ? (
        <Block emoji="✍️" title="문장 시작점">
          <p className="mb-2 text-xs text-ink-400">빈칸은 네 말로 채우면 돼.</p>
          <ul className="space-y-2">
            {card.sentenceStarters.map((s, i) => (
              <li key={i} className="flex items-center justify-between gap-2 rounded-xl2 bg-paper-soft px-3 py-2.5">
                <span className="text-sm leading-6 text-ink-700">{s}</span>
                {onInsert ? (
                  <button
                    onClick={() => onInsert(s)}
                    className="shrink-0 rounded-lg px-2 py-1 text-xs text-ochre-600 hover:bg-ochre-50"
                  >
                    넣기
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </Block>
      ) : null}
    </Card>
  );
}
