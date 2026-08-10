/* 홈 — 오늘 할 수 있는 활동과 최근 기록 (기획서 6.1) */

import { navigate } from "../App.jsx";
import { listDrafts, listEntries } from "../lib/store.js";
import { DAILY_PROMPTS, typeLabel } from "../lib/types.js";
import { weeklySummary } from "../lib/insights.js";
import { Button, Card, Chip, Empty, SectionTitle } from "../components/common.jsx";

const ACTIONS = [
  {
    id: "new",
    title: "지금 떠오른 생각 기록하기",
    desc: "한 줄이어도 괜찮아요",
    to: "new",
  },
  {
    id: "chat",
    title: "AI와 이야기하며 생각 찾기",
    desc: "질문을 따라가며 발견하기",
    to: "chat",
  },
  {
    id: "media",
    title: "책·영화·뉴스 기록하기",
    desc: "보고 읽은 것에 내 관점 붙이기",
    to: "new?type=book",
  },
  {
    id: "map",
    title: "나의 관심 지도 보기",
    desc: "반복해서 나타난 주제 확인하기",
    to: "map",
  },
];

function dailyPrompt() {
  const now = new Date();
  const dayIndex = Math.floor(
    (now - new Date(now.getFullYear(), 0, 0)) / (24 * 60 * 60 * 1000)
  );
  return DAILY_PROMPTS[dayIndex % DAILY_PROMPTS.length];
}

export function Home({ user }) {
  const entries = listEntries();
  const drafts = listDrafts().filter((d) => d.status === "writing" && (d.content || d.title));
  const week = weeklySummary(entries);
  const resumable = entries.filter((e) => e.status === "idea" || e.status === "chatting").slice(0, 3);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-[22px] font-semibold leading-8 tracking-tight text-ink-900">
          안녕, {user.displayName}.
          <br />
          오늘 마음에 남은 것은 무엇이었어?
        </h1>
      </header>

      <section className="grid gap-2.5 sm:grid-cols-2">
        {ACTIONS.map((a) => (
          <button
            key={a.id}
            onClick={() => navigate(a.to)}
            className="rounded-xl2 border border-line bg-paper-card px-4 py-4 text-left shadow-card transition-colors hover:border-ochre-200 hover:bg-ochre-50/40"
          >
            <p className="text-[15px] font-medium text-ink-900">{a.title}</p>
            <p className="mt-1 text-sm text-ink-500">{a.desc}</p>
          </button>
        ))}
      </section>

      <section>
        <SectionTitle>오늘의 글쓰기 질문</SectionTitle>
        <Card className="px-4 py-4">
          <p className="text-[15px] leading-7 text-ink-700">{dailyPrompt()}</p>
          <Button variant="soft" size="sm" className="mt-3" onClick={() => navigate("new")}>
            이 질문으로 기록하기
          </Button>
        </Card>
      </section>

      <section>
        <SectionTitle
          action={
            <button
              onClick={() => navigate("library")}
              className="text-sm text-ink-500 hover:text-ink-900"
            >
              보관함
            </button>
          }
        >
          작성 중인 글
        </SectionTitle>
        {drafts.length ? (
          <ul className="space-y-2">
            {drafts.slice(0, 3).map((d) => (
              <li key={d.id}>
                <button
                  onClick={() => navigate(`write/${d.entryId}`)}
                  className="w-full rounded-xl2 border border-line bg-paper-card px-4 py-3.5 text-left shadow-card hover:border-line-strong"
                >
                  <p className="text-[15px] font-medium text-ink-900">
                    {d.title || "제목 없는 글"}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-ink-500">
                    {d.content ? d.content.slice(0, 80) : "아직 본문이 비어 있어요"}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <Empty
            title="아직 쓰고 있는 글이 없어요"
            description="기록을 하나 남기고 대화를 나눠보면 글쓰기 재료가 만들어져요."
            action={
              <Button variant="soft" onClick={() => navigate("new")}>
                기록 시작하기
              </Button>
            }
          />
        )}
      </section>

      {resumable.length ? (
        <section>
          <SectionTitle>다시 이어 쓰고 싶은 기록</SectionTitle>
          <ul className="space-y-2">
            {resumable.map((e) => (
              <li key={e.id}>
                <button
                  onClick={() => navigate(`entry/${e.id}`)}
                  className="w-full rounded-xl2 border border-line bg-paper-card px-4 py-3.5 text-left shadow-card hover:border-line-strong"
                >
                  <span className="text-xs text-ink-400">{typeLabel(e.type)}</span>
                  <p className="mt-0.5 line-clamp-2 text-sm leading-6 text-ink-700">{e.initialNote}</p>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="grid gap-2.5 sm:grid-cols-2">
        <Card className="px-4 py-4">
          <p className="text-xs text-ink-400">이번 주 기록</p>
          <p className="mt-1 text-2xl font-semibold text-ink-900">{week.count}번</p>
        </Card>
        <Card className="px-4 py-4">
          <p className="text-xs text-ink-400">자주 등장한 말</p>
          {week.keywords.length ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {week.keywords.map((k) => (
                <Chip key={k}>{k}</Chip>
              ))}
            </div>
          ) : (
            <p className="mt-1.5 text-sm text-ink-400">기록이 쌓이면 보여요</p>
          )}
        </Card>
      </section>
    </div>
  );
}
