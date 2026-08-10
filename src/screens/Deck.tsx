import { useRef, useState } from "react";
import type { Deck, Meaning, Word } from "../types";
import { importDeckJSON, normalizeWord } from "../lib/storage";
import { parseCandidates, recognizeImage, type WordCandidate } from "../lib/ocr";

function emptyWord(): Word {
  return {
    word: "",
    ipa: "",
    ko: [],
    koStress: 0,
    splitBox: false,
    meanings: [{ def: "", pos: "", koSentence: "" }],
  };
}

interface EditTarget {
  deckIdx: number;
  wordIdx: number; // -1 이면 새 단어
}

export function DeckScreen({
  decks,
  updateDecks,
}: {
  decks: Deck[];
  updateDecks: (d: Deck[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [edit, setEdit] = useState<EditTarget | null>(null);
  const [draft, setDraft] = useState<Word>(emptyWord);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [photo, setPhoto] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const q = query.trim().toLowerCase();

  function startNew() {
    setDraft(emptyWord());
    setEdit({ deckIdx: 0, wordIdx: -1 });
  }
  function startEdit(deckIdx: number, wordIdx: number) {
    setDraft(structuredClone(decks[deckIdx].words[wordIdx]));
    setEdit({ deckIdx, wordIdx });
  }
  function cancel() {
    setEdit(null);
  }

  function saveDraft() {
    if (!edit) return;
    const w: Word = {
      ...draft,
      word: draft.word.trim(),
      splitBox: draft.meanings.length > 1,
      meanings: draft.meanings.map((m) => ({
        def: m.def.trim(),
        pos: m.pos.trim(),
        koSentence: m.koSentence.trim(),
      })),
    };
    if (!w.word || !w.meanings[0].def) return;
    const next = decks.map((d) => ({ ...d, words: [...d.words] }));
    if (edit.wordIdx < 0) next[edit.deckIdx].words.push(w);
    else next[edit.deckIdx].words[edit.wordIdx] = w;
    updateDecks(next);
    setEdit(null);
  }

  function remove(deckIdx: number, wordIdx: number) {
    const next = decks.map((d) => ({ ...d, words: [...d.words] }));
    next[deckIdx].words.splice(wordIdx, 1);
    updateDecks(next);
  }

  function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    f.text().then((raw) => {
      try {
        const next = importDeckJSON(raw, decks);
        updateDecks(next);
        setImportMsg("가져오기 완료 ✅");
      } catch (err) {
        setImportMsg("실패: " + (err as Error).message);
      }
      if (fileRef.current) fileRef.current.value = "";
    });
  }

  if (photo) {
    return <PhotoAdd decks={decks} updateDecks={updateDecks} onClose={() => setPhoto(false)} />;
  }

  if (edit) {
    return (
      <div className="screen">
        <h2>{edit.wordIdx < 0 ? "단어 추가" : "단어 수정"}</h2>
        <WordEditor draft={draft} setDraft={setDraft} />
        <div className="row">
          <button className="btn" onClick={cancel}>
            취소
          </button>
          <button className="btn primary" onClick={saveDraft}>
            저장
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="row" style={{ marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>단어장</h2>
        <span className="spacer" />
        <button className="btn small" onClick={() => setPhoto(true)}>
          📷 사진
        </button>
        <button className="btn small" onClick={() => fileRef.current?.click()}>
          JSON
        </button>
        <button className="btn small primary" onClick={startNew}>
          + 추가
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          style={{ display: "none" }}
          onChange={onImport}
        />
      </div>
      {importMsg && (
        <div className="small muted" style={{ marginBottom: 10 }}>
          {importMsg}
        </div>
      )}

      <input
        placeholder="검색 (영단어 · 뜻)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ marginBottom: 12 }}
      />

      {decks.map((deck, di) => {
        const rows = deck.words
          .map((w, wi) => ({ w, wi }))
          .filter(
            ({ w }) =>
              !q ||
              w.word.toLowerCase().includes(q) ||
              w.meanings.some((m) => m.def.toLowerCase().includes(q)),
          );
        return (
          <div key={deck.id} style={{ marginBottom: 18 }}>
            <div className="small muted" style={{ marginBottom: 4 }}>
              {deck.name} · {deck.words.length}단어
            </div>
            {rows.map(({ w, wi }) => (
              <div className="deck-item" key={w.word + wi}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="en">
                    {w.word}{" "}
                    {w.splitBox && <span className="badge">뜻 {w.meanings.length}</span>}
                  </div>
                  <div className="small muted">
                    {w.meanings.map((m) => m.def).join(" / ")}
                  </div>
                </div>
                <button className="btn small" onClick={() => startEdit(di, wi)}>
                  수정
                </button>
                <button className="btn small danger" onClick={() => remove(di, wi)}>
                  삭제
                </button>
              </div>
            ))}
            {rows.length === 0 && <div className="small muted">검색 결과 없음</div>}
          </div>
        );
      })}
    </div>
  );
}

function PhotoAdd({
  decks,
  updateDecks,
  onClose,
}: {
  decks: Deck[];
  updateDecks: (d: Deck[]) => void;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const [rows, setRows] = useState<WordCandidate[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (inputRef.current) inputRef.current.value = "";
    if (!f) return;
    setError(null);
    setRows(null);
    setBusy(true);
    setProgress("사진 여는 중…");
    try {
      const text = await recognizeImage(f, (p, status) => {
        const label = status === "recognizing text" ? "글자 읽는 중" : "준비 중";
        setProgress(`${label}… ${Math.round(p * 100)}%`);
      });
      const cands = parseCandidates(text);
      if (cands.length === 0) {
        setError("사진에서 단어를 찾지 못했어요. 글자가 크고 또렷한 사진으로 다시 시도해 주세요.");
      }
      setRows(cands);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
      setProgress("");
    }
  }

  function setRow(i: number, patch: Partial<WordCandidate>) {
    setRows((rs) => (rs ? rs.map((r, j) => (j === i ? { ...r, ...patch } : r)) : rs));
  }
  function removeRow(i: number) {
    setRows((rs) => (rs ? rs.filter((_, j) => j !== i) : rs));
  }

  function save() {
    if (!rows) return;
    const valid = rows.filter((r) => r.word.trim() && r.meaning.trim());
    if (valid.length === 0) return;
    const next = decks.map((d) => ({ ...d, words: [...d.words] }));
    const target = next[0];
    const byWord = new Map(target.words.map((w) => [w.word.toLowerCase(), w] as const));
    for (const r of valid) {
      const w = normalizeWord({
        word: r.word.trim(),
        meanings: [{ def: r.meaning.trim(), pos: "", koSentence: "" }],
      });
      const existing = byWord.get(w.word.toLowerCase());
      if (existing) existing.meanings = w.meanings;
      else {
        target.words.push(w);
        byWord.set(w.word.toLowerCase(), w);
      }
    }
    updateDecks(next);
    onClose();
  }

  return (
    <div className="screen">
      <div className="row" style={{ marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>사진으로 단어 추가</h2>
        <span className="spacer" />
        <button className="btn small" onClick={onClose}>
          닫기
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={onPick}
      />

      {!rows && !busy && (
        <>
          <button className="btn primary" onClick={() => inputRef.current?.click()}>
            📷 사진 찍기 / 사진 고르기
          </button>
          <p className="small muted" style={{ marginTop: 12, lineHeight: 1.6 }}>
            단어장·시험지 사진을 찍으면 앱이 글자를 읽어 단어 목록을 만들어 줍니다.
            읽은 결과는 저장 전에 직접 고칠 수 있어요.
            <br />
            <b>팁:</b> 한 줄에 "영단어 뜻" 형태가 가장 정확해요. 2단(양쪽 컬럼) 페이지는
            <b> 한쪽 컬럼씩</b> 크고 밝게 찍으면 훨씬 잘 읽습니다.
          </p>
        </>
      )}

      {busy && (
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 18, marginBottom: 6 }}>글자 읽는 중…</div>
          <div className="muted small">{progress || "잠시만요"}</div>
          <div className="muted small" style={{ marginTop: 8 }}>
            처음엔 인식 기능을 내려받느라 몇십 초 걸릴 수 있어요.
          </div>
        </div>
      )}

      {error && (
        <div className="card" style={{ borderColor: "var(--bad)" }}>
          <div className="small" style={{ color: "var(--bad)" }}>{error}</div>
          <button className="btn" style={{ marginTop: 10 }} onClick={() => inputRef.current?.click()}>
            다시 찍기
          </button>
        </div>
      )}

      {rows && rows.length > 0 && (
        <>
          <div className="small muted" style={{ margin: "4px 0 10px" }}>
            읽은 단어 {rows.length}개 — 확인하고 고친 뒤 저장하세요.
          </div>
          {rows.map((r, i) => (
            <div className="card" key={i}>
              <div className="row" style={{ marginBottom: 8 }}>
                <b className="small">#{i + 1}</b>
                <span className="spacer" />
                <button className="btn small danger" onClick={() => removeRow(i)}>
                  삭제
                </button>
              </div>
              <label className="field">
                <span>영단어</span>
                <input value={r.word} onChange={(e) => setRow(i, { word: e.target.value })} />
              </label>
              <label className="field" style={{ marginBottom: 0 }}>
                <span>뜻</span>
                <input value={r.meaning} onChange={(e) => setRow(i, { meaning: e.target.value })} />
              </label>
            </div>
          ))}
          <div className="row" style={{ marginTop: 4 }}>
            <button className="btn" onClick={() => inputRef.current?.click()}>
              다시 찍기
            </button>
            <button className="btn primary" onClick={save}>
              {rows.filter((r) => r.word.trim() && r.meaning.trim()).length}개 저장
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function WordEditor({ draft, setDraft }: { draft: Word; setDraft: (w: Word) => void }) {
  const set = (patch: Partial<Word>) => setDraft({ ...draft, ...patch });
  const setMeaning = (i: number, patch: Partial<Meaning>) => {
    const meanings = draft.meanings.map((m, j) => (j === i ? { ...m, ...patch } : m));
    setDraft({ ...draft, meanings });
  };
  const addMeaning = () =>
    setDraft({ ...draft, meanings: [...draft.meanings, { def: "", pos: "", koSentence: "" }] });
  const removeMeaning = (i: number) =>
    setDraft({ ...draft, meanings: draft.meanings.filter((_, j) => j !== i) });

  return (
    <>
      <label className="field">
        <span>영단어</span>
        <input value={draft.word} onChange={(e) => set({ word: e.target.value })} />
      </label>
      <label className="field">
        <span>발음기호 (선택)</span>
        <input value={draft.ipa} onChange={(e) => set({ ipa: e.target.value })} placeholder="/ˈword/" />
      </label>
      <label className="field">
        <span>한글 발음 (음절을 쉼표로, 선택)</span>
        <input
          value={draft.ko.join(",")}
          onChange={(e) =>
            set({ ko: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })
          }
          placeholder="매,그,니,튜드"
        />
      </label>
      {draft.ko.length > 0 && (
        <label className="field">
          <span>강세 음절 인덱스 (0부터)</span>
          <input
            type="number"
            min={0}
            max={Math.max(0, draft.ko.length - 1)}
            value={draft.koStress}
            onChange={(e) => set({ koStress: Number(e.target.value) })}
          />
        </label>
      )}

      <div className="small muted" style={{ margin: "4px 0 8px" }}>
        뜻 (2개 이상이면 자동으로 뜻 분리 · splitBox)
      </div>
      {draft.meanings.map((m, i) => (
        <div className="card" key={i}>
          <div className="row" style={{ marginBottom: 8 }}>
            <b className="small">뜻 {i + 1}</b>
            <span className="spacer" />
            {draft.meanings.length > 1 && (
              <button className="btn small danger" onClick={() => removeMeaning(i)}>
                삭제
              </button>
            )}
          </div>
          <label className="field">
            <span>뜻</span>
            <input value={m.def} onChange={(e) => setMeaning(i, { def: e.target.value })} />
          </label>
          <label className="field">
            <span>품사 (n/v/a/ad)</span>
            <input value={m.pos} onChange={(e) => setMeaning(i, { pos: e.target.value })} />
          </label>
          <label className="field" style={{ marginBottom: 0 }}>
            <span>한글 예문 — 빈칸은 ____ (카드2용, 선택)</span>
            <input
              value={m.koSentence}
              onChange={(e) => setMeaning(i, { koSentence: e.target.value })}
              placeholder="이번 지진의 ____는 7.2였다."
            />
          </label>
        </div>
      ))}
      <button className="btn" style={{ marginBottom: 16 }} onClick={addMeaning}>
        + 뜻 추가
      </button>
    </>
  );
}
