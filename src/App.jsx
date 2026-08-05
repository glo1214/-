import React, { useEffect, useMemo, useState } from "react";

import TabBar from "./components/TabBar.jsx";
import { Sheet, Field, inputCls, Button } from "./components/common.jsx";
import Home from "./screens/Home.jsx";
import Study from "./screens/Study.jsx";
import Sentences from "./screens/Sentences.jsx";
import Deck from "./screens/Deck.jsx";
import Stats from "./screens/Stats.jsx";

import {
  loadSettings,
  loadDecks,
  loadProgress,
  loadSentences,
  saveSettings,
  saveDecks,
  saveProgress,
  saveSentences,
  uid,
  wipeAll,
} from "./lib/storage.js";
import { SEED_DECKS } from "./lib/seed.js";
import { ddayFrom, todayKey } from "./lib/srs.js";
import { todayCount, pickSessionWords, flattenWords } from "./lib/session.js";

/* 기본 수능일: 올해 11월 셋째 목요일, 지났으면 내년 */
function defaultExamDate() {
  const now = new Date();
  const year = now.getFullYear();
  const thirdThu = (y) => {
    const d = new Date(y, 10, 1);
    const offset = (4 - d.getDay() + 7) % 7; // 첫 목요일
    return new Date(y, 10, 1 + offset + 14);
  };
  let exam = thirdThu(year);
  if (exam < now) exam = thirdThu(year + 1);
  return todayKey(exam);
}

function makeWords(rawList) {
  return rawList.map((w) => ({
    id: uid("w"),
    word: String(w.word || "").trim(),
    meaning: String(w.meaning || "").trim(),
    pos: (w.pos || "").trim(),
  }));
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState(null);
  const [decks, setDecks] = useState({});
  const [progress, setProgress] = useState({});
  const [sentences, setSentences] = useState([]);

  const [tab, setTab] = useState("home");
  const [studying, setStudying] = useState(false);
  const [sessionWords, setSessionWords] = useState([]);
  const [pendingWrong, setPendingWrong] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  /* ---------- 초기화 ---------- */
  useEffect(() => {
    let s = loadSettings();
    let d = loadDecks();
    const p = loadProgress();
    const sen = loadSentences();

    if (!s) {
      s = { examDate: defaultExamDate(), dailyNew: 20, dailyReview: 200, sessionSize: 20 };
      saveSettings(s);
    }
    if (!d) d = {};
    // 사진에서 넣은 단어장들을 보장 — 기존 데이터가 있어도 없는 것만 추가
    let seedChanged = false;
    for (const sd of SEED_DECKS) {
      if (!d[sd.id]) {
        d = { ...d, [sd.id]: { id: sd.id, name: sd.name, words: makeWords(sd.words) } };
        seedChanged = true;
      }
    }
    if (seedChanged) saveDecks(d);

    setSettings(s);
    setDecks(d);
    setProgress(p || {});
    setSentences(Array.isArray(sen) ? sen : []);
    setReady(true);
  }, []);

  /* ---------- 파생값 ---------- */
  const dueCount = useMemo(() => {
    if (!ready) return 0;
    return todayCount(decks, progress, settings);
  }, [ready, decks, progress, settings]);

  const dday = useMemo(() => ddayFrom(settings?.examDate), [settings]);

  const homeStats = useMemo(() => {
    const all = flattenWords(decks);
    let started = 0;
    let mastered = 0;
    let overdue = 0;
    const t = todayKey();
    for (const w of all) {
      const p = progress[w.id];
      if (!p) continue;
      started += 1;
      if (p.box >= 5) mastered += 1;
      // 밀린 복습: nextDue 가 오늘보다 이전
      if (p.nextDue < t) overdue += 1;
    }
    return { total: all.length, started, mastered, overdue };
  }, [decks, progress]);

  /* ---------- 단어 관리 ---------- */
  function primaryDeckId(d) {
    const keys = Object.keys(d);
    return keys[0] || null;
  }

  function addWords(rawWords) {
    const words = makeWords(rawWords).filter((w) => w.word);
    if (words.length === 0) return;
    setDecks((prev) => {
      const next = { ...prev };
      let did = primaryDeckId(next);
      if (!did) {
        did = uid("deck");
        next[did] = { id: did, name: "내 단어장", words: [] };
      }
      next[did] = { ...next[did], words: [...next[did].words, ...words] };
      saveDecks(next);
      return next;
    });
  }

  function editWord(deckId, wordId, patch) {
    setDecks((prev) => {
      const deck = prev[deckId];
      if (!deck) return prev;
      const next = {
        ...prev,
        [deckId]: {
          ...deck,
          words: deck.words.map((w) => (w.id === wordId ? { ...w, ...patch } : w)),
        },
      };
      saveDecks(next);
      return next;
    });
  }

  function removeWord(deckId, wordId) {
    setDecks((prev) => {
      const deck = prev[deckId];
      if (!deck) return prev;
      const next = {
        ...prev,
        [deckId]: { ...deck, words: deck.words.filter((w) => w.id !== wordId) },
      };
      saveDecks(next);
      return next;
    });
    setProgress((prev) => {
      if (!prev[wordId]) return prev;
      const next = { ...prev };
      delete next[wordId];
      saveProgress(next);
      return next;
    });
  }

  /* ---------- 세션 ---------- */
  function startSession() {
    const words = pickSessionWords(decks, progress, settings);
    if (words.length === 0) return;
    setSessionWords(words);
    setStudying(true);
  }

  function completeSession(patch) {
    setProgress((prev) => {
      const next = { ...prev, ...patch };
      saveProgress(next);
      return next;
    });
  }

  function goSentences(wrongWords) {
    setStudying(false);
    setPendingWrong(wrongWords && wrongWords.length ? wrongWords : null);
    setTab("sentences");
  }

  function addSentences(list) {
    setSentences((prev) => {
      const next = [...prev, ...list];
      saveSentences(next);
      return next;
    });
  }

  /* ---------- 설정 ---------- */
  function updateSettings(patch) {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }

  function resetAll() {
    if (!window.confirm("모든 단어·진행도·문장을 삭제하고 처음 상태로 되돌릴까요?")) return;
    wipeAll();
    window.location.reload();
  }

  if (!ready) {
    return (
      <div className="min-h-full flex items-center justify-center text-muted">불러오는 중…</div>
    );
  }

  /* ---------- 학습 중이면 전체화면 ---------- */
  if (studying) {
    return (
      <Study
        sessionWords={sessionWords}
        decks={decks}
        progress={progress}
        sentences={sentences}
        examDate={settings.examDate}
        onComplete={completeSession}
        onGoSentences={goSentences}
        onGoHome={() => {
          setStudying(false);
          setTab("home");
        }}
      />
    );
  }

  return (
    <div className="min-h-full">
      {tab === "home" && (
        <Home
          dday={dday}
          dueCount={dueCount}
          stats={homeStats}
          examDate={settings.examDate}
          onStart={startSession}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      )}
      {tab === "sentences" && (
        <Sentences
          sentences={sentences}
          decks={decks}
          pendingWrong={pendingWrong}
          onAddSentences={addSentences}
          onClearPending={() => setPendingWrong(null)}
        />
      )}
      {tab === "deck" && (
        <Deck
          decks={decks}
          addWords={addWords}
          editWord={editWord}
          removeWord={removeWord}
          progress={progress}
        />
      )}
      {tab === "stats" && <Stats decks={decks} progress={progress} />}

      <TabBar tab={tab} onChange={setTab} dueCount={dueCount} />

      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSave={updateSettings}
        onReset={resetAll}
      />
    </div>
  );
}

function SettingsSheet({ open, onClose, settings, onSave, onReset }) {
  const [examDate, setExamDate] = useState(settings.examDate || "");
  const [dailyNew, setDailyNew] = useState(settings.dailyNew ?? 20);
  const [sessionSize, setSessionSize] = useState(settings.sessionSize ?? 20);

  useEffect(() => {
    if (open) {
      setExamDate(settings.examDate || "");
      setDailyNew(settings.dailyNew ?? 20);
      setSessionSize(settings.sessionSize ?? 20);
    }
  }, [open, settings]);

  function save() {
    onSave({
      examDate: examDate || null,
      dailyNew: clampNum(dailyNew, 1, 200, 20),
      sessionSize: clampNum(sessionSize, 5, 60, 20),
    });
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title="설정">
      <Field label="수능일 (D-day)" hint="D-30부터 복습 간격에 상한을 걸어, 모든 단어를 시험 전 한 번 더 노출합니다.">
        <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className={inputCls} />
      </Field>
      <Field label="하루 새 단어" hint="세션에 새로 등장시킬 단어 수">
        <input type="number" inputMode="numeric" value={dailyNew} onChange={(e) => setDailyNew(e.target.value)} className={inputCls} />
      </Field>
      <Field label="한 세션 문항 수" hint="짧게 2~3분. 20문항 권장">
        <input type="number" inputMode="numeric" value={sessionSize} onChange={(e) => setSessionSize(e.target.value)} className={inputCls} />
      </Field>
      <Button className="w-full py-3.5 mt-1" onClick={save}>
        저장
      </Button>
      <button onClick={onReset} className="w-full text-center text-sm text-bad/80 hover:text-bad py-3 mt-2">
        데이터 초기화
      </button>
      <p className="text-center text-xs text-muted mt-2">
        모든 데이터는 이 기기에만 저장됩니다.
      </p>
    </Sheet>
  );
}

function clampNum(v, min, max, dflt) {
  const n = parseInt(v, 10);
  if (isNaN(n)) return dflt;
  return Math.max(min, Math.min(max, n));
}
