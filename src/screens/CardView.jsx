/* 생각 설계 카드 화면 — 대화 종료 후 여기로 온다 */

import { navigate } from "../App.jsx";
import { cardOfEntry, getEntry } from "../lib/store.js";
import { typeLabel } from "../lib/types.js";
import { ThinkingCardView } from "../components/ThinkingCard.jsx";
import { Button, Empty, Notice } from "../components/common.jsx";

export function CardView({ entryId }) {
  const entry = getEntry(entryId);
  const card = entry ? cardOfEntry(entryId) : null;

  if (!entry) {
    return <div className="py-10 text-center text-ink-500">기록을 찾을 수 없어요.</div>;
  }

  if (!card) {
    return (
      <Empty
        title="아직 생각 카드가 없어요"
        description="AI와 대화를 나누고 '대화 마치기'를 누르면 카드가 만들어져요."
        action={<Button variant="soft" onClick={() => navigate(`chat/${entryId}`)}>대화 시작하기</Button>}
      />
    );
  }

  return (
    <div className="space-y-5">
      <header>
        <span className="text-xs text-ink-400">{typeLabel(entry.type)}</span>
        <h1 className="mt-0.5 text-[20px] font-semibold tracking-tight text-ink-900">
          네 말에서 뽑은 재료야
        </h1>
      </header>

      <Notice>
        여기 있는 건 완성된 글이 아니야. 이 재료를 보면서 글은 네 문장으로 쓰면 돼.
        마음에 안 드는 항목은 그냥 넘어가도 괜찮아.
      </Notice>

      <ThinkingCardView card={card} />

      <div className="flex flex-wrap gap-2">
        <Button size="lg" onClick={() => navigate(`write/${entryId}`)}>
          이 카드로 글쓰기
        </Button>
        <Button variant="outline" size="lg" onClick={() => navigate(`chat/${entryId}`)}>
          대화 더 하기
        </Button>
      </div>
    </div>
  );
}
