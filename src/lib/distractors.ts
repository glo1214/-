/* ------------------------------------------------------------------
   오답 선지 생성 (v1 규칙)
   우선순위: 1) confusedWith 단어  2) 같은 덱·같은 품사  3) 같은 덱 랜덤
   어근 기반 선지는 만들지 않는다(v2). 정답 위치는 매번 무작위.
------------------------------------------------------------------ */
import type { CardType, Choice, Deck, ProgressMap, Word } from "../types";
import { progressKey } from "./scheduler";

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Cand {
  word: string;
  def: string;
  pos: string;
}

function explain(word: string, def: string): string {
  return `${word} — ${def}`;
}

/** 4지선다 선지 생성. 정답 1 + 오답 3, 위치 무작위. */
export function buildChoices(
  deck: Deck,
  target: Word,
  meaningIndex: number,
  progress: ProgressMap,
  card: CardType,
): Choice[] {
  const targetMeaning = target.meanings[meaningIndex];
  const correct: Choice = {
    label: targetMeaning.def,
    word: target.word,
    correct: true,
    explain: explain(target.word, targetMeaning.def),
  };

  const usedKeys = new Set<string>([progressKey(target.word, meaningIndex)]);
  const usedLabels = new Set<string>([targetMeaning.def]);
  const distract: Cand[] = [];

  const push = (c: Cand, key: string) => {
    if (usedKeys.has(key) || usedLabels.has(c.def) || !c.def) return;
    usedKeys.add(key);
    usedLabels.add(c.def);
    distract.push(c);
  };
  const addWord = (w: Word, samePosOnly: boolean) => {
    w.meanings.forEach((m, i) => {
      if (samePosOnly && m.pos !== targetMeaning.pos) return;
      push({ word: w.word, def: m.def, pos: m.pos }, progressKey(w.word, i));
    });
  };

  // 카드3(문맥 속 뜻): 같은 단어의 다른 뜻을 최우선 오답으로 → 진짜 '뜻 구분'
  if (card === 3) {
    target.meanings.forEach((m, i) => {
      if (i === meaningIndex) return;
      push({ word: target.word, def: m.def, pos: m.pos }, progressKey(target.word, i));
    });
  }

  const others = deck.words.filter((w) => w.word !== target.word);

  // 1) confusedWith 단어
  const cw = progress[progressKey(target.word, meaningIndex)]?.confusedWith ?? {};
  Object.entries(cw)
    .sort((a, b) => b[1] - a[1])
    .forEach(([w]) => {
      const wd = others.find((x) => x.word === w);
      if (wd) addWord(wd, false);
    });

  // 2) 같은 덱, 같은 품사
  shuffle(others).forEach((w) => addWord(w, true));
  // 3) 같은 덱 랜덤
  shuffle(others).forEach((w) => addWord(w, false));

  const wrong = distract.slice(0, 3).map<Choice>((c) => ({
    label: c.def,
    word: c.word,
    correct: false,
    explain: explain(c.word, c.def),
  }));

  return shuffle([correct, ...wrong]);
}
