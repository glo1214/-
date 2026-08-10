/* 나의 관심 지도 (기획서 6.6)
   적성 판정이 아니라 '반복해서 나타난 관심'과 '해볼 수 있는 경험'만 보여준다. */

import { useState } from "react";
import { navigate } from "../App.jsx";
import { listCards, listEntries } from "../lib/store.js";
import { buildInsights } from "../lib/insights.js";
import { EMOTIONS } from "../lib/types.js";

const EMOJI_BY_LABEL = Object.fromEntries(EMOTIONS.map((e) => [e.label, e.emoji]));
import { Button, Card, Chip, Empty, Notice, SectionTitle } from "../components/common.jsx";

const RANGES = [
  { days: 30, label: "최근 한 달" },
  { days: 90, label: "최근 세 달" },
  { days: null, label: "전체" },
];

export function InterestMap() {
  const [days, setDays] = useState(30);
  const data = buildInsights({ entries: listEntries(), cards: listCards(), days });

  if (data.entryCount === 0) {
    return (
      <div className="space-y-5">
        <header>
          <h1 className="text-[20px] font-semibold tracking-tight text-ink-900">나의 관심 지도</h1>
        </header>
        <Empty
          title="아직 보여줄 게 없어요"
          art="sprout"
          description="점이 몇 개 모이면 이어지는 선이 보이기 시작해요."
          action={<Button variant="soft" onClick={() => navigate("new")}>점 찍으러 가기</Button>}
        />
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <header>
        <h1 className="text-[20px] font-semibold tracking-tight text-ink-900">나의 관심 지도</h1>
        <p className="mt-1.5 text-sm text-ink-500">
          {data.entryCount < 3
            ? `지금까지 찍은 점 ${data.entryCount}개. 조금 더 모이면 이어지는 선이 보여요.`
            : `지금까지 찍은 점 ${data.entryCount}개가 이어진 자리예요.`}
        </p>
        <div className="mt-3 flex gap-1.5">
          {RANGES.map((r) => (
            <Chip key={r.label} active={days === r.days} onClick={() => setDays(r.days)}>
              {r.label}
            </Chip>
          ))}
        </div>
      </header>

      {data.themes.length ? (
        <section>
          <SectionTitle>자주 나타난 관심</SectionTitle>
          <div className="space-y-2">
            {data.themes.map((t) => (
              <Card key={t.id} className="flex items-center gap-3 px-4 py-3.5">
                <span
                  aria-hidden="true"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl2 bg-ochre-50 text-[20px]"
                >
                  {t.emoji}
                </span>
                <span>
                  <span className="block text-[15px] font-medium text-ink-900">{t.label}</span>
                  <span className="mt-0.5 block text-sm text-ink-500">
                    이 주제와 이어지는 표현이 {t.hits}번 나왔어요.
                  </span>
                </span>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {data.topKeywords.length ? (
        <section>
          <SectionTitle>자주 등장한 키워드</SectionTitle>
          <div className="flex flex-wrap gap-1.5">
            {data.topKeywords.map(([word, n]) => (
              <Chip key={word}>
                {word}
                {n > 1 ? <span className="ml-1 text-xs text-ink-400">{n}</span> : null}
              </Chip>
            ))}
          </div>
        </section>
      ) : null}

      {data.topEmotions.length ? (
        <section>
          <SectionTitle>자주 느낀 감정</SectionTitle>
          <ul className="space-y-2">
            {data.topEmotions.map(([label, n]) => {
              const max = data.topEmotions[0][1] || 1;
              return (
                <li key={label} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-sm text-ink-700">
                    <span aria-hidden="true" className="mr-1">{EMOJI_BY_LABEL[label]}</span>
                    {label}
                  </span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-paper-sand">
                    <span
                      className="block h-full rounded-full bg-ochre-300"
                      style={{ width: `${Math.round((n / max) * 100)}%` }}
                    />
                  </span>
                  <span className="w-6 text-right text-xs text-ink-400">{n}</span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {data.topTypes.length ? (
        <section>
          <SectionTitle>자주 기록한 종류</SectionTitle>
          <div className="flex flex-wrap gap-1.5">
            {data.topTypes.map(([label, n]) => (
              <Chip key={label}>
                {label} <span className="ml-1 text-xs text-ink-400">{n}</span>
              </Chip>
            ))}
          </div>
        </section>
      ) : null}

      {data.questions.length ? (
        <section>
          <SectionTitle>내가 던진 질문</SectionTitle>
          <ul className="space-y-2">
            {data.questions.map((q, i) => (
              <li key={i} className="rounded-xl2 bg-paper-soft px-3.5 py-3 text-sm leading-6 text-ink-700">
                {q}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {data.suggestions.length ? (
        <section>
          <SectionTitle>더 해볼 수 있는 경험</SectionTitle>
          <ul className="space-y-2">
            {data.suggestions.map((s, i) => (
              <li key={i} className="flex gap-2.5 rounded-xl2 border border-line bg-paper-card px-3.5 py-3 text-sm leading-6 text-ink-700 shadow-card">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ochre-300" />
                {s}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Notice>
        이건 검사 결과가 아니에요. 지금까지 찍어둔 점에서 자주 보인 것을 모아둔 것뿐이라,
        직업이나 적성을 정해주지 않아요. 관심은 바뀔 수 있고, 바뀌어도 괜찮아요.
      </Notice>
    </div>
  );
}
