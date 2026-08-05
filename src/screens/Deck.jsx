import React, { useMemo, useRef, useState } from "react";
import { Screen, Header, Card, Button, Empty, Sheet, Field, inputCls, Pill } from "../components/common.jsx";
import { ocrWords, fillMeanings, AIError } from "../lib/ai.js";
import { flattenWords } from "../lib/session.js";

export default function Deck({ decks, addWords, editWord, removeWord, progress }) {
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState(null); // { deckId, word }

  const all = useMemo(() => flattenWords(decks), [decks]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (w) => w.word.toLowerCase().includes(q) || (w.meaning || "").toLowerCase().includes(q)
    );
  }, [all, query]);

  return (
    <Screen>
      <Header
        title="단어장"
        sub={`${all.length}개 단어`}
        right={
          <Button onClick={() => setAddOpen(true)} className="px-4 py-2.5 text-sm">
            + 추가
          </Button>
        }
      />

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="단어 · 뜻 검색"
        className={inputCls + " mb-5"}
      />

      {all.length === 0 ? (
        <Empty
          icon="📚"
          title="단어장이 비어있어요"
          desc="사진으로 한 번에 추가하거나, 직접 입력해보세요."
          action={<Button onClick={() => setAddOpen(true)}>단어 추가</Button>}
        />
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted py-10">"{query}" 검색 결과 없음</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((w) => (
            <WordRow key={w.id} w={w} box={progress[w.id]?.box} onEdit={() => setEditing({ deckId: w.deckId, word: w })} />
          ))}
        </div>
      )}

      <AddSheet open={addOpen} onClose={() => setAddOpen(false)} addWords={addWords} />
      <EditSheet
        editing={editing}
        onClose={() => setEditing(null)}
        onSave={(patch) => {
          editWord(editing.deckId, editing.word.id, patch);
          setEditing(null);
        }}
        onDelete={() => {
          removeWord(editing.deckId, editing.word.id);
          setEditing(null);
        }}
      />
    </Screen>
  );
}

function WordRow({ w, box, onEdit }) {
  return (
    <button
      onClick={onEdit}
      className="w-full text-left bg-ink-800 border border-line rounded-xl px-4 py-3 flex items-center justify-between hover:border-accent/30 transition"
    >
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-gray-100 truncate">{w.word}</span>
          {w.pos && <span className="text-xs text-muted shrink-0">[{w.pos}]</span>}
        </div>
        <div className="text-sm text-muted truncate">{w.meaning || "뜻 없음"}</div>
      </div>
      {box ? <Pill tone={box >= 5 ? "good" : "neutral"}>박스 {box}</Pill> : <Pill tone="accent">신규</Pill>}
    </button>
  );
}

/* ---------------- 추가 시트 ---------------- */
function AddSheet({ open, onClose, addWords }) {
  const [mode, setMode] = useState("manual"); // manual | paste | photo

  return (
    <Sheet open={open} onClose={onClose} title="단어 추가">
      <div className="flex gap-2 mb-5">
        {[
          ["manual", "직접 입력"],
          ["paste", "붙여넣기"],
          ["photo", "사진"],
        ].map(([m, label]) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
              mode === m ? "bg-accent text-accent-ink" : "bg-ink-700 text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "manual" && <ManualForm addWords={addWords} onDone={onClose} />}
      {mode === "paste" && <PasteForm addWords={addWords} onDone={onClose} />}
      {mode === "photo" && <PhotoForm addWords={addWords} onDone={onClose} />}
    </Sheet>
  );
}

function ManualForm({ addWords, onDone }) {
  const [word, setWord] = useState("");
  const [meaning, setMeaning] = useState("");
  const [pos, setPos] = useState("");
  const [count, setCount] = useState(0);

  function submit(e) {
    e.preventDefault();
    if (!word.trim()) return;
    addWords([{ word: word.trim(), meaning: meaning.trim(), pos }]);
    setWord("");
    setMeaning("");
    setPos("");
    setCount((c) => c + 1);
  }

  return (
    <form onSubmit={submit}>
      <Field label="영단어">
        <input autoFocus value={word} onChange={(e) => setWord(e.target.value)} className={inputCls} placeholder="abandon" autoCapitalize="none" />
      </Field>
      <Field label="뜻">
        <input value={meaning} onChange={(e) => setMeaning(e.target.value)} className={inputCls} placeholder="버리다, 포기하다" />
      </Field>
      <Field label="품사 (선택)">
        <PosSelect value={pos} onChange={setPos} />
      </Field>
      <Button type="submit" className="w-full py-3.5" disabled={!word.trim()}>
        추가하고 계속
      </Button>
      {count > 0 && <p className="text-center text-good text-sm mt-3">{count}개 추가됨</p>}
      {count > 0 && (
        <Button variant="subtle" className="w-full py-2 mt-1" onClick={onDone}>
          완료
        </Button>
      )}
    </form>
  );
}

function PasteForm({ addWords, onDone }) {
  const [text, setText] = useState("");
  const parsed = useMemo(() => parseBulk(text), [text]);

  function submit() {
    if (parsed.length === 0) return;
    addWords(parsed);
    onDone();
  }

  return (
    <div>
      <p className="text-sm text-muted mb-3 leading-relaxed">
        한 줄에 하나씩. <span className="text-gray-300">단어[탭/쉼표] 뜻</span> 형식이면 자동으로 나뉩니다.
      </p>
      <textarea
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        placeholder={"abandon\t버리다, 포기하다\nabundant, 풍부한\nabsorb - 흡수하다"}
        className={inputCls + " font-mono text-sm resize-none"}
      />
      <p className="text-sm text-muted my-3">인식된 단어: {parsed.length}개</p>
      <Button className="w-full py-3.5" onClick={submit} disabled={parsed.length === 0}>
        {parsed.length}개 추가
      </Button>
    </div>
  );
}

function PhotoForm({ addWords, onDone }) {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState(null); // 추출 결과 편집용
  const [err, setErr] = useState(null);
  const [fillBusy, setFillBusy] = useState(false);

  async function onFiles(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setErr(null);
    setBusy(true);
    try {
      const images = await Promise.all(files.slice(0, 6).map(fileToBase64));
      const words = await ocrWords(images);
      setRows(words.map((w, i) => ({ id: i, ...w, keep: true })));
    } catch (e2) {
      setErr(e2 instanceof AIError ? e2.message : "사진 인식에 실패했어요.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function autoFill() {
    if (!rows) return;
    const need = rows.filter((r) => r.keep && !r.meaning.trim());
    if (need.length === 0) return;
    setFillBusy(true);
    setErr(null);
    try {
      const filled = await fillMeanings(need.map((r) => ({ word: r.word })));
      const byWord = new Map(filled.map((f) => [f.word.toLowerCase(), f]));
      setRows((rs) =>
        rs.map((r) => {
          const f = byWord.get(r.word.toLowerCase());
          return f && !r.meaning.trim() ? { ...r, meaning: f.meaning, pos: r.pos || f.pos } : r;
        })
      );
    } catch (e2) {
      setErr(e2 instanceof AIError ? e2.message : "뜻 자동 생성 실패");
    } finally {
      setFillBusy(false);
    }
  }

  function confirm() {
    const keep = rows.filter((r) => r.keep && r.word.trim());
    if (keep.length === 0) return;
    addWords(keep.map((r) => ({ word: r.word.trim(), meaning: r.meaning.trim(), pos: r.pos })));
    onDone();
  }

  if (rows) {
    const missing = rows.filter((r) => r.keep && !r.meaning.trim()).length;
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-muted">추출 {rows.length}개 · 확인/수정 후 추가</p>
          {missing > 0 && (
            <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={autoFill} disabled={fillBusy}>
              {fillBusy ? "생성 중…" : `뜻 자동생성 ${missing}`}
            </Button>
          )}
        </div>
        {err && <p className="text-bad text-sm mb-2">{err}</p>}
        <div className="space-y-2 max-h-[46vh] overflow-y-auto pr-1 -mr-1">
          {rows.map((r) => (
            <div
              key={r.id}
              className={`flex items-center gap-2 bg-ink-900 border rounded-lg p-2 ${
                r.keep ? "border-line" : "border-line opacity-40"
              }`}
            >
              <input
                value={r.word}
                onChange={(e) => setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, word: e.target.value } : x)))}
                className="w-[38%] bg-transparent text-gray-100 text-sm px-1 focus:outline-none"
                autoCapitalize="none"
              />
              <input
                value={r.meaning}
                onChange={(e) => setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, meaning: e.target.value } : x)))}
                placeholder="뜻"
                className="flex-1 bg-transparent text-gray-300 text-sm px-1 focus:outline-none border-l border-line"
              />
              <button
                onClick={() => setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, keep: !x.keep } : x)))}
                className="text-muted hover:text-bad text-sm px-1 shrink-0"
                aria-label="삭제"
              >
                {r.keep ? "✕" : "↩"}
              </button>
            </div>
          ))}
        </div>
        <Button className="w-full py-3.5 mt-4" onClick={confirm}>
          {rows.filter((r) => r.keep && r.word.trim()).length}개 추가
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center py-4">
      <input ref={fileRef} type="file" accept="image/*" multiple capture="environment" onChange={onFiles} className="hidden" />
      <div className="text-4xl mb-3">📷</div>
      <p className="text-sm text-muted mb-1">단어장·시험지 사진을 올리면</p>
      <p className="text-sm text-muted mb-5">AI가 단어를 뽑아줍니다 (여러 장 가능)</p>
      {err && <p className="text-bad text-sm mb-3">{err}</p>}
      <Button className="w-full py-3.5" onClick={() => fileRef.current?.click()} disabled={busy}>
        {busy ? "인식 중…" : "사진 선택"}
      </Button>
      <p className="text-xs text-muted mt-3 leading-relaxed">
        한 번에 20~30개씩 잘라서 찍으면 정확도가 올라가요.<br />
        AI 기능은 서버에 API 키가 설정돼야 동작합니다.
      </p>
    </div>
  );
}

function EditSheet({ editing, onClose, onSave, onDelete }) {
  const [word, setWord] = useState("");
  const [meaning, setMeaning] = useState("");
  const [pos, setPos] = useState("");

  React.useEffect(() => {
    if (editing) {
      setWord(editing.word.word);
      setMeaning(editing.word.meaning || "");
      setPos(editing.word.pos || "");
    }
  }, [editing]);

  if (!editing) return null;
  return (
    <Sheet open={!!editing} onClose={onClose} title="단어 수정">
      <Field label="영단어">
        <input value={word} onChange={(e) => setWord(e.target.value)} className={inputCls} autoCapitalize="none" />
      </Field>
      <Field label="뜻">
        <input value={meaning} onChange={(e) => setMeaning(e.target.value)} className={inputCls} />
      </Field>
      <Field label="품사">
        <PosSelect value={pos} onChange={setPos} />
      </Field>
      <div className="flex gap-3 mt-2">
        <Button variant="danger" className="px-5 py-3" onClick={onDelete}>
          삭제
        </Button>
        <Button className="flex-1 py-3" onClick={() => onSave({ word: word.trim(), meaning: meaning.trim(), pos })} disabled={!word.trim()}>
          저장
        </Button>
      </div>
    </Sheet>
  );
}

function PosSelect({ value, onChange }) {
  const opts = [
    ["", "—"],
    ["n", "명사"],
    ["v", "동사"],
    ["a", "형용사"],
    ["ad", "부사"],
  ];
  return (
    <div className="flex gap-2">
      {opts.map(([v, label]) => (
        <button
          key={v || "none"}
          type="button"
          onClick={() => onChange(v)}
          className={`flex-1 py-2 rounded-lg text-sm transition ${
            value === v ? "bg-accent text-accent-ink font-semibold" : "bg-ink-700 text-muted"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/* ---------- 유틸 ---------- */

function parseBulk(text) {
  const out = [];
  const lines = String(text || "").split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    let word = "";
    let meaning = "";
    // 구분자 우선순위: 탭 > 2+공백 > 쉼표 > " - "/하이픈
    let m = line.split(/\t/);
    if (m.length < 2) m = line.split(/\s{2,}/);
    if (m.length < 2) m = splitFirst(line, ",");
    if (m.length < 2) m = splitFirst(line, " - ");
    if (m.length < 2) {
      // 첫 공백 기준 (영단어 뜻)
      const sp = line.indexOf(" ");
      if (sp > 0) m = [line.slice(0, sp), line.slice(sp + 1)];
    }
    if (m.length >= 2) {
      word = m[0].trim();
      meaning = m.slice(1).join(" ").trim();
    } else {
      word = line;
    }
    if (word) out.push({ word, meaning, pos: "" });
  }
  return out;
}

function splitFirst(s, sep) {
  const i = s.indexOf(sep);
  if (i === -1) return [s];
  return [s.slice(0, i), s.slice(i + sep.length)];
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = String(reader.result || "");
      const comma = res.indexOf(",");
      const data = comma >= 0 ? res.slice(comma + 1) : res;
      const media_type = (res.match(/^data:([^;]+);/) || [])[1] || file.type || "image/jpeg";
      resolve({ media_type, data });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
