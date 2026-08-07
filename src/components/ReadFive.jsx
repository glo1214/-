import React from "react";
import { bumpRead } from "../lib/storage.js";
import SpeakButton from "./SpeakButton.jsx";
import { Icon } from "./common.jsx";

/* 원어민 문장을 5번 반복해 읽으며 익히기.
   각 문장을 탭할 때마다 1/5 → 5/5 카운트가 오른다. */
export default function ReadFive({ dateKey, sentences, readCounts }) {
  const lines = (sentences || [])
    .map((s) => (typeof s === "string" ? s : s.corrected))
    .filter(Boolean);

  if (lines.length === 0) return null;

  return (
    <div className="space-y-2.5">
      {lines.map((line, i) => {
        const count = readCounts?.[i] || 0;
        const done = count >= 5;
        return (
          <div
            key={i}
            className={`rounded-xl border px-3.5 py-3 transition ${
              done ? "border-good/40 bg-good/5" : "border-line bg-ink-700"
            }`}
          >
            <div className="flex items-start gap-2">
              <button
                onClick={() => bumpRead(dateKey, i)}
                className="flex-1 text-left"
                aria-label="한 번 읽음"
              >
                <span className="font-serif text-[15px] leading-relaxed text-gray-100">
                  {line}
                </span>
              </button>
              <SpeakButton text={line} size={18} className="mt-0.5 shrink-0" />
            </div>

            <div className="flex items-center gap-1.5 mt-2.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => bumpRead(dateKey, i)}
                  aria-label={`${n}번째 읽기`}
                  className={`flex-1 h-1.5 rounded-full transition ${
                    n <= count ? "bg-good" : "bg-ink-500"
                  }`}
                />
              ))}
              <span
                className={`ml-2 text-xs font-bold tnum w-9 text-right ${
                  done ? "text-good" : "text-muted"
                }`}
              >
                {count}/5
              </span>
            </div>
          </div>
        );
      })}
      <p className="text-xs text-muted text-center pt-1">
        <Icon name="speaker" size={12} className="inline mr-1 align-middle" />
        문장을 탭하면 읽은 횟수가 올라가요. 소리 아이콘으로 원어민 발음을 들어 보세요.
      </p>
    </div>
  );
}
