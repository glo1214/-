import { describe, it, expect, beforeEach } from "vitest";
import type { Profile, ProgressMap } from "../types";
import { DEFAULT_PROFILE } from "./storage";
import { buildSession, makeQuestion, reinsertOffset } from "./session";
import { judge } from "./scheduler";
import { koPronVisible } from "./scaffold";
import unit04 from "../data/unit04.json";
import type { Deck } from "../types";

const TODAY = "2026-08-06";
const decks = [structuredClone(unit04) as Deck];

function profile(over: Partial<Profile> = {}): Profile {
  return { ...structuredClone(DEFAULT_PROFILE), ...over };
}

describe("완료 기준 — 통합", () => {
  it("[1] 시드 12개로 첫 세션이 정상 시작된다", () => {
    const { queue, seeded } = buildSession(decks, {}, profile(), TODAY);
    expect(queue.length).toBeGreaterThan(0);
    // 첫 문제를 실제로 생성할 수 있어야 한다
    const q = makeQuestion(decks, queue[0], seeded);
    expect(q.choices).toHaveLength(4);
    expect(q.choices.filter((c) => c.correct)).toHaveLength(1);
  });

  it("[2] splitBox 단어(magnitude/spare/vague)는 뜻별로 progress 2개씩 만든다", () => {
    const { seeded } = buildSession(decks, {}, profile(), TODAY);
    for (const w of ["magnitude", "spare", "vague"]) {
      expect(seeded[`${w}#0`]).toBeTruthy();
      expect(seeded[`${w}#1`]).toBeTruthy();
      expect(seeded[`${w}#2`]).toBeUndefined();
    }
    // splitBox=false 단어는 #0 하나만
    expect(seeded["verify#0"]).toBeTruthy();
    expect(seeded["verify#1"]).toBeUndefined();
  });

  it("[3] 7초 이상 끌고 정답을 눌러도 박스가 오르지 않는다", () => {
    const { seeded } = buildSession(decks, {}, profile(), TODAY);
    const key = "verify#0";
    const before = seeded[key].box;
    const r = judge(seeded[key], {
      answer: "correct",
      ms: 7000, // > slow(6000)
      selfWord: "verify",
      isReinsert: false,
      threshold: profile().timeThreshold,
      today: TODAY,
    });
    expect(r.next.box).toBe(before); // 유지
    expect(r.promoted).toBe(false);
  });

  it("[4] 오답 후 재삽입분을 맞혀도 박스가 오르지 않는다", () => {
    const { seeded } = buildSession(decks, {}, profile(), TODAY);
    const key = "verify#0";
    // 오답
    const wrong = judge(seeded[key], {
      answer: "wrong",
      ms: 3000,
      selfWord: "verify",
      chosenWord: "sustain",
      isReinsert: false,
      threshold: profile().timeThreshold,
      today: TODAY,
    });
    expect(wrong.next.box).toBe(1);
    expect(wrong.requeue).toBe(true);
    // 재삽입분 정답
    const re = judge(wrong.next, {
      answer: "correct",
      ms: 500,
      selfWord: "verify",
      isReinsert: true,
      threshold: profile().timeThreshold,
      today: TODAY,
    });
    expect(re.next.box).toBe(1); // 오르지 않음
    expect(re.promoted).toBe(false);
  });

  it("[4] 재삽입 위치는 4~6문제 뒤", () => {
    for (let i = 0; i < 50; i++) {
      const off = reinsertOffset();
      expect(off).toBeGreaterThanOrEqual(4);
      expect(off).toBeLessThanOrEqual(6);
    }
  });

  it("[5] 모름은 confusedWith를 늘리지 않고, 오답은 늘린다", () => {
    const { seeded } = buildSession(decks, {}, profile(), TODAY);
    const th = profile().timeThreshold;
    const dunno = judge(seeded["magnitude#0"], {
      answer: "dunno",
      ms: 3000,
      selfWord: "magnitude",
      isReinsert: false,
      threshold: th,
      today: TODAY,
    });
    expect(Object.keys(dunno.next.confusedWith)).toHaveLength(0);
    const wrong = judge(seeded["magnitude#0"], {
      answer: "wrong",
      ms: 3000,
      selfWord: "magnitude",
      chosenWord: "spare",
      isReinsert: false,
      threshold: th,
      today: TODAY,
    });
    expect(wrong.next.confusedWith.spare).toBe(1);
  });

  it("[7] fast/slow를 바꾸면 판정이 즉시 달라진다", () => {
    const { seeded } = buildSession(decks, {}, profile(), TODAY);
    const p = seeded["verify#0"];
    // 기본 임계값(2000/6000): 5초 → mid band, 승급 O
    const def = judge(p, {
      answer: "correct",
      ms: 5000,
      selfWord: "verify",
      isReinsert: false,
      threshold: { fast: 2000, slow: 6000 },
      today: TODAY,
    });
    expect(def.promoted).toBe(true);
    // 임계값을 조이면(1000/3000): 5초 → slow 초과, 승급 X
    const strict = judge(p, {
      answer: "correct",
      ms: 5000,
      selfWord: "verify",
      isReinsert: false,
      threshold: { fast: 1000, slow: 3000 },
      today: TODAY,
    });
    expect(strict.promoted).toBe(false);
  });

  it("새 단어는 '하루' 상한을 지킨다 (세션마다 쏟아지지 않음)", () => {
    const p = profile({ dailyNew: 5 });
    // 오늘 이미 5개 도입했으면 더 이상 새 단어 없음
    const full = buildSession(decks, {}, p, TODAY, 5);
    expect(full.newWords).toBe(0);
    // 3개 도입했으면 2개만 더
    const partial = buildSession(decks, {}, p, TODAY, 3);
    expect(partial.newWords).toBe(2);
  });

  it("반복(reps) 상한에 도달하면 제외되어 복습 큐에서 빠진다", () => {
    const p = profile({ retireAfter: 3, dailyNew: 0 });
    const prog: ProgressMap = {
      "verify#0": {
        box: 1,
        nextDue: TODAY,
        wrongCount: 3,
        avgMs: 4000,
        weak: true,
        lastSeen: "2026-08-05",
        confusedWith: {},
        reps: 3, // 상한 도달 → 제외
      },
    };
    const built = buildSession(decks, prog, p, TODAY, 0);
    expect(built.queue.find((q) => q.key === "verify#0")).toBeUndefined();
    // retireAfter=0(끔)이면 다시 나온다
    const built2 = buildSession(decks, prog, profile({ retireAfter: 0, dailyNew: 0 }), TODAY, 0);
    expect(built2.queue.find((q) => q.key === "verify#0")).toBeTruthy();
  });

  it("[8] 박스 3 이상이면 한글 발음 표기가 사라진다", () => {
    expect(koPronVisible(2, true)).toBe(true);
    expect(koPronVisible(3, true)).toBe(false);
    expect(koPronVisible(5, true)).toBe(false);
    expect(koPronVisible(1, false)).toBe(false); // 끈 경우
  });
});

/* [6] 새로고침 후 진행 상황 보존 — localStorage 왕복 */
describe("완료 기준 — 저장 왕복 [6]", () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    (globalThis as unknown as { localStorage: Storage }).localStorage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
      clear: () => {
        for (const k of Object.keys(store)) delete store[k];
      },
      key: () => null,
      length: 0,
    } as Storage;
  });

  it("progress를 저장하면 다시 읽을 때 그대로 남는다", async () => {
    const { saveProgress, loadProgress } = await import("./storage");
    const m: ProgressMap = {
      "magnitude#0": {
        box: 4,
        nextDue: "2026-08-22",
        wrongCount: 2,
        avgMs: 3100,
        weak: true,
        lastSeen: "2026-08-06",
        confusedWith: { spare: 1 },
      },
    };
    saveProgress(m);
    expect(loadProgress()).toEqual(m);
  });
});
