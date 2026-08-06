import { describe, it, expect } from "vitest";
import {
  BOX_INTERVAL,
  judge,
  meaningIndices,
  newProgress,
  pickCard,
  progressKey,
} from "./scheduler";
import { addDays } from "./date";
import type { Word } from "../types";

const TODAY = "2026-08-06";
const TH = { fast: 2000, slow: 6000 };

function base() {
  const p = newProgress(TODAY);
  p.lastSeen = null; // 오늘 처음
  return p;
}

const common = { selfWord: "magnitude", isReinsert: false, threshold: TH, today: TODAY };

describe("응답시간 판정", () => {
  it("정답 & ms < fast → 박스 +1, weak=false", () => {
    const r = judge({ ...base() }, { ...common, answer: "correct", ms: 1500 });
    expect(r.next.box).toBe(2);
    expect(r.promoted).toBe(true);
    expect(r.next.weak).toBe(false);
    expect(r.next.nextDue).toBe(addDays(TODAY, BOX_INTERVAL[2])); // 3일 후
  });

  it("정답 & fast ≤ ms ≤ slow → 박스 +1, weak=true", () => {
    const r = judge({ ...base() }, { ...common, answer: "correct", ms: 4000 });
    expect(r.next.box).toBe(2);
    expect(r.promoted).toBe(true);
    expect(r.next.weak).toBe(true);
  });

  it("정답 & ms > slow → 박스 유지, nextDue = 3일 후", () => {
    const p = base();
    p.box = 2;
    const r = judge(p, { ...common, answer: "correct", ms: 7000 });
    expect(r.next.box).toBe(2); // 유지
    expect(r.promoted).toBe(false);
    expect(r.next.nextDue).toBe(addDays(TODAY, 3));
  });

  it("임계값을 바꾸면 판정이 즉시 달라진다 (7초가 fast가 되면 승급)", () => {
    const loose = { fast: 8000, slow: 9000 };
    const r = judge(base(), { ...common, threshold: loose, answer: "correct", ms: 7000 });
    expect(r.next.box).toBe(2); // 이제 fast band → 승급
    expect(r.promoted).toBe(true);
  });
});

describe("오답 / 모름", () => {
  it("오답 → 박스 1로, 재삽입, confusedWith[고른단어]++", () => {
    const p = base();
    p.box = 3;
    const r = judge(p, { ...common, answer: "wrong", ms: 3000, chosenWord: "spare" });
    expect(r.next.box).toBe(1);
    expect(r.requeue).toBe(true);
    expect(r.next.confusedWith.spare).toBe(1);
    expect(r.next.wrongCount).toBe(1);
  });

  it("모름 → 박스 1로, 재삽입, confusedWith는 그대로", () => {
    const p = base();
    p.box = 3;
    const r = judge(p, { ...common, answer: "dunno", ms: 3000 });
    expect(r.next.box).toBe(1);
    expect(r.requeue).toBe(true);
    expect(Object.keys(r.next.confusedWith)).toHaveLength(0);
    expect(r.next.wrongCount).toBe(1);
  });

  it("자기 자신을 고른 오답은 confusedWith에 넣지 않는다", () => {
    const r = judge(base(), {
      ...common,
      answer: "wrong",
      ms: 3000,
      chosenWord: "magnitude", // == selfWord
    });
    expect(Object.keys(r.next.confusedWith)).toHaveLength(0);
  });
});

describe("재삽입분 비승급", () => {
  it("isReinsert=true 정답이면 박스가 오르지 않는다", () => {
    const p = base();
    p.box = 1;
    p.lastSeen = TODAY; // 이미 오늘 봄
    const r = judge(p, { ...common, isReinsert: true, answer: "correct", ms: 1000 });
    expect(r.next.box).toBe(1); // 그대로
    expect(r.promoted).toBe(false);
    expect(r.requeue).toBe(false);
  });

  it("lastSeen이 오늘이면(재삽입 아니어도) 승급하지 않는다", () => {
    const p = base();
    p.lastSeen = TODAY;
    const r = judge(p, { ...common, answer: "correct", ms: 1000 });
    expect(r.next.box).toBe(1);
    expect(r.promoted).toBe(false);
  });

  it("오답으로 강등된 뒤 재삽입분을 맞히면 오답표시만 풀고 박스 유지", () => {
    // 1차: 오답 → box 1, lastSeen=today
    const first = judge(base(), { ...common, answer: "wrong", ms: 3000, chosenWord: "spare" });
    expect(first.next.box).toBe(1);
    // 2차: 재삽입분 정답 → 박스 그대로, 재삽입 없음
    const second = judge(first.next, {
      ...common,
      isReinsert: true,
      answer: "correct",
      ms: 800,
    });
    expect(second.next.box).toBe(1);
    expect(second.promoted).toBe(false);
    expect(second.requeue).toBe(false);
  });
});

describe("splitBox 뜻 분리", () => {
  const split: Word = {
    word: "magnitude",
    ipa: "",
    ko: [],
    koStress: 0,
    splitBox: true,
    meanings: [
      { def: "규모", pos: "n", koSentence: "지진의 ____" },
      { def: "중요성", pos: "n", koSentence: "사태의 ____" },
    ],
  };
  const single: Word = {
    word: "verify",
    ipa: "",
    ko: [],
    koStress: 0,
    splitBox: false,
    meanings: [{ def: "입증하다", pos: "v", koSentence: "____ 해야" }],
  };

  it("splitBox=true는 뜻마다 인덱스를 만든다", () => {
    expect(meaningIndices(split)).toEqual([0, 1]);
    expect(meaningIndices(split).map((i) => progressKey(split.word, i))).toEqual([
      "magnitude#0",
      "magnitude#1",
    ]);
  });

  it("splitBox=false는 #0 하나만 만든다", () => {
    expect(meaningIndices(single)).toEqual([0]);
    expect(progressKey(single.word, 0)).toBe("verify#0");
  });
});

describe("박스별 출제 카드", () => {
  const en = { card1: true, card2: true, card3: true };
  const split: Word = {
    word: "vague",
    ipa: "",
    ko: [],
    koStress: 0,
    splitBox: true,
    meanings: [
      { def: "모호한", pos: "a", koSentence: "너무 ____" },
      { def: "희미한", pos: "a", koSentence: "기억이 ____" },
    ],
  };
  it("box1→카드1, box2→카드2, splitBox box3→카드3", () => {
    expect(pickCard(1, split, split.meanings[0], en)).toBe(1);
    expect(pickCard(2, split, split.meanings[0], en)).toBe(2);
    expect(pickCard(3, split, split.meanings[0], en)).toBe(3);
  });
  it("카드3을 끄면 splitBox box3도 카드2로 폴백", () => {
    expect(pickCard(3, split, split.meanings[0], { ...en, card3: false })).toBe(2);
  });
});
