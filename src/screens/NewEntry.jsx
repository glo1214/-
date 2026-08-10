/* 새 기록 — 유형 선택 → 짧은 기록 → 감정 (기획서 5·7.1) */

import { useState } from "react";
import { navigate } from "../App.jsx";
import { createEntry } from "../lib/store.js";
import { BODY_FEELINGS, EMOTIONS, ENTRY_TYPES, ENTRY_TYPE_MAP } from "../lib/types.js";
import { detectRisk } from "../lib/safety.js";
import { SafetyNotice } from "../components/SafetyNotice.jsx";
import { PhotoField } from "../components/Photos.jsx";
import { Button, Card, Chip, Input, Label, SectionTitle, Textarea } from "../components/common.jsx";

export function NewEntry({ initialType }) {
  const [type, setType] = useState(
    ENTRY_TYPE_MAP[initialType] ? initialType : null
  );
  const [note, setNote] = useState("");
  const [emotions, setEmotions] = useState([]);
  const [feelings, setFeelings] = useState([]);
  const [source, setSource] = useState({ title: "", extra: "", url: "" });
  const [photoIds, setPhotoIds] = useState([]);
  const [visibility, setVisibility] = useState("class");
  const [risk, setRisk] = useState(false);
  const [error, setError] = useState("");

  const meta = type ? ENTRY_TYPE_MAP[type] : null;

  function toggle(list, setList, value) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  function save() {
    if (!note.trim()) {
      setError("한 줄이라도 적어야 이어갈 수 있어요.");
      return;
    }
    if (detectRisk(note)) {
      setRisk(true);
      return;
    }
    const entry = createEntry({
      type,
      initialNote: note,
      emotionTags: emotions,
      bodyFeelings: feelings,
      source,
      photoIds,
      visibility,
    });
    navigate(`entry/${entry.id}`);
  }

  if (!type) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-[22px] font-semibold tracking-tight text-ink-900">
            오늘은 어떤 생각을 기록하고 싶나요?
          </h1>
          <p className="mt-1.5 text-sm text-ink-500">고르고 나서도 언제든 바꿀 수 있어요.</p>
        </header>
        <ul className="space-y-2">
          {ENTRY_TYPES.map((t) => (
            <li key={t.id}>
              <button
                onClick={() => setType(t.id)}
                className="flex w-full items-center gap-3 rounded-xl2 border border-line bg-paper-card px-4 py-4 text-left shadow-card transition-colors hover:border-ochre-200 hover:bg-ochre-50/40"
              >
                <span
                  aria-hidden="true"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl2 bg-ochre-50 text-[21px]"
                >
                  {t.emoji}
                </span>
                <span className="min-w-0">
                  <span className="block text-[15px] font-medium text-ink-900">{t.label}</span>
                  <span className="mt-0.5 block text-sm text-ink-500">{t.hint}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-ink-900">
            <span aria-hidden="true" className="mr-1.5">{meta.emoji}</span>
            {meta.label}
          </h1>
          <p className="mt-1 text-sm text-ink-500">{meta.hint}</p>
        </div>
        <Button variant="quiet" size="sm" className="shrink-0 whitespace-nowrap" onClick={() => setType(null)}>
          유형 바꾸기
        </Button>
      </header>

      {meta.source ? (
        <Card className="space-y-3 p-4">
          <div>
            <Label>{meta.source.titleLabel}</Label>
            <Input
              value={source.title}
              onChange={(e) => setSource({ ...source, title: e.target.value })}
              placeholder=""
            />
          </div>
          <div>
            <Label hint="선택">{meta.source.extraLabel}</Label>
            <Input
              value={source.extra}
              onChange={(e) => setSource({ ...source, extra: e.target.value })}
            />
          </div>
          {meta.source.url ? (
            <div>
              <Label hint="선택 — 출처를 남겨두면 나중에 확인하기 좋아요">기사 링크</Label>
              <Input
                value={source.url}
                onChange={(e) => setSource({ ...source, url: e.target.value })}
                placeholder="https://"
                inputMode="url"
              />
            </div>
          ) : null}
        </Card>
      ) : null}

      {meta.photoFirst ? (
        <div>
          <Label hint="그림이나 사진을 넣고 보이는 대로 적어보세요">사진</Label>
          <PhotoField
            photoIds={photoIds}
            onChange={setPhotoIds}
            hint="수업에서 함께 볼 그림이나 직접 찍은 장면을 넣어보세요."
          />
        </div>
      ) : null}

      <div>
        <Label hint="맞춤법은 신경 쓰지 않아도 돼요">기록</Label>
        <Textarea
          rows={6}
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            setError("");
          }}
          placeholder={meta.placeholder}
          autoFocus
        />
      </div>

      {meta.emotion ? (
        <>
          <section>
            <SectionTitle>그때 어떤 마음이었어?</SectionTitle>
            <div className="flex flex-wrap gap-1.5">
              {EMOTIONS.map((e) => (
                <Chip
                  key={e.id}
                  active={emotions.includes(e.id)}
                  onClick={() => toggle(emotions, setEmotions, e.id)}
                >
                  <span aria-hidden="true" className="mr-1">{e.emoji}</span>
                  {e.label}
                </Chip>
              ))}
            </div>
          </section>

          <section>
            <SectionTitle>몸에서는 어떤 느낌이 났어? <span className="font-normal text-ink-400">(선택)</span></SectionTitle>
            <div className="flex flex-wrap gap-1.5">
              {BODY_FEELINGS.map((f) => (
                <Chip
                  key={f}
                  active={feelings.includes(f)}
                  onClick={() => toggle(feelings, setFeelings, f)}
                >
                  {f}
                </Chip>
              ))}
            </div>
          </section>
        </>
      ) : null}

      {!meta.photoFirst ? (
        <div>
          <Label hint="선택">사진</Label>
          <PhotoField photoIds={photoIds} onChange={setPhotoIds} />
        </div>
      ) : null}

      <section>
        <SectionTitle>어느 서랍에 넣을까?</SectionTitle>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            {
              id: "class",
              title: "수업 서랍",
              desc: "선생님이 보게 될 기록이에요",
            },
            {
              id: "private",
              title: "내 서랍",
              desc: "나만 봐요. 선생님에게 가지 않아요",
            },
          ].map((o) => (
            <button
              key={o.id}
              onClick={() => setVisibility(o.id)}
              className={`rounded-xl2 border px-4 py-3 text-left transition-colors ${
                visibility === o.id
                  ? "border-ochre-300 bg-ochre-50"
                  : "border-line bg-paper-card hover:border-line-strong"
              }`}
            >
              <span className="block text-[15px] font-medium text-ink-900">{o.title}</span>
              <span className="mt-0.5 block text-sm text-ink-500">{o.desc}</span>
            </button>
          ))}
        </div>
      </section>

      {error ? <p className="text-sm text-rust">{error}</p> : null}

      <div className="flex gap-2">
        <Button size="lg" className="flex-1" onClick={save}>
          저장하기
        </Button>
      </div>

      <SafetyNotice open={risk} onClose={() => setRisk(false)} />
    </div>
  );
}
