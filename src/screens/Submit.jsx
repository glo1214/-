/* ------------------------------------------------------------------
   숙제로 내기 — 글과 '어떻게 만들어졌는지'를 한 장으로

   선생님이 결과물만 보면 코칭할 게 별로 없다.
   점을 언제 찍었고, 몇 번 주고받았고, 몇 번 고쳐 썼는지가 함께 보여야
   "이 학생은 이유를 찾는 데서 막힌다" 같은 게 보인다.

   지금은 선생님 화면(서버)이 없으므로, 학생이 이미지로 저장해서 낸다.
------------------------------------------------------------------ */

import { useState } from "react";
import { navigate } from "../App.jsx";
import {
  cardOfEntry,
  conversationOfEntry,
  currentUser,
  draftOfEntry,
  getEntry,
} from "../lib/store.js";
import { typeEmoji, typeLabel } from "../lib/types.js";
import { downloadDataUrl, renderSubmissionImage } from "../lib/exportImage.js";
import { ThinkingCardView } from "../components/ThinkingCard.jsx";
import { Button, Card, Chip, Empty, Notice, SectionTitle } from "../components/common.jsx";

export function Submit({ entryId }) {
  const entry = getEntry(entryId);
  const me = currentUser();
  const [saved, setSaved] = useState(false);

  if (!entry) return <div className="py-10 text-center text-ink-500">기록을 찾을 수 없어요.</div>;

  const draft = draftOfEntry(entryId);
  const card = cardOfEntry(entryId);
  const conv = conversationOfEntry(entryId);

  if (!draft || !draft.content.trim()) {
    return (
      <Empty
        title="아직 낼 글이 없어요"
        art="paper"
        description="글쓰기 작업실에서 글을 쓰고 나면 여기서 한 장으로 정리할 수 있어요."
        action={<Button variant="soft" onClick={() => navigate(`write/${entryId}`)}>글 쓰러 가기</Button>}
      />
    );
  }

  const talkTurns = (conv?.messages || []).filter((m) => m.role === "student").length;
  const revisions = draft.versions?.length || 0;
  const stats = [
    {
      label: "점 찍은 날",
      value: new Date(entry.createdAt).toLocaleDateString("ko-KR", {
        month: "long",
        day: "numeric",
      }),
    },
    { label: "주고받은 질문", value: `${talkTurns}번` },
    { label: "고쳐 쓴 횟수", value: `${revisions}번` },
    { label: "글 길이", value: `${draft.content.replace(/\s/g, "").length}자` },
  ];

  function saveImage() {
    const dataUrl = renderSubmissionImage({
      eyebrow: `글로온 생각온 · ${typeLabel(entry.type)}`,
      title: draft.title || "제목 없는 글",
      author: me.displayName,
      dateText: new Date(draft.updatedAt).toLocaleDateString("ko-KR"),
      bodyText: draft.content,
      keywords: card?.studentWords?.coreKeywords || [],
      stats,
    });
    downloadDataUrl(dataUrl, `${me.displayName}_${draft.title || "글"}.png`);
    setSaved(true);
  }

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs text-ink-400">
            {typeEmoji(entry.type)} {typeLabel(entry.type)}
          </span>
          <h1 className="mt-0.5 text-[20px] font-semibold tracking-tight text-ink-900">숙제로 내기</h1>
        </div>
        <Button variant="quiet" size="sm" className="shrink-0" onClick={() => navigate(`write/${entryId}`)}>
          글로 돌아가기
        </Button>
      </header>

      <Notice>
        글과 함께 <strong className="font-medium text-ink-900">어떻게 만들어졌는지</strong>도 한 장에 담겨요.
        선생님은 이걸 보고 결과보다 과정을 봐줄 수 있어요.
      </Notice>

      <Card className="overflow-hidden">
        <div className="border-b border-line bg-paper-soft px-4 py-3">
          <p className="text-xs text-ochre-700">미리 보기</p>
        </div>
        <div className="px-4 py-4">
          <h2 className="text-[17px] font-semibold text-ink-900">{draft.title || "제목 없는 글"}</h2>
          <p className="mt-1 text-xs text-ink-400">
            {me.displayName} · {new Date(draft.updatedAt).toLocaleDateString("ko-KR")}
          </p>
          {card?.studentWords?.coreKeywords?.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {card.studentWords.coreKeywords.slice(0, 6).map((k, i) => (
                <Chip key={i}>{k}</Chip>
              ))}
            </div>
          ) : null}
          <p className="mt-4 whitespace-pre-wrap border-t border-line pt-4 text-[15px] leading-7 text-ink-700">
            {draft.content}
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-2 rounded-xl2 bg-paper-soft px-3.5 py-3 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="text-[11px] text-ink-400">{s.label}</dt>
                <dd className="mt-0.5 text-sm font-medium text-ink-900">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button size="lg" onClick={saveImage}>
          이미지로 저장
        </Button>
        <Button variant="outline" size="lg" onClick={() => window.print()}>
          인쇄 · PDF
        </Button>
      </div>
      {saved ? (
        <p className="text-sm text-leaf">저장했어요. 사진첩이나 다운로드 폴더에서 확인해보세요.</p>
      ) : null}

      {card ? (
        <section>
          <SectionTitle>같이 낼 생각 카드 (선택)</SectionTitle>
          <ThinkingCardView card={card} />
        </section>
      ) : null}
    </div>
  );
}
