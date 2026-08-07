import React, { useState } from "react";
import { monthGrid, monthLabel, todayKey, fromKey } from "../lib/date.js";
import { Card, Icon } from "./common.jsx";

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];

export default function Calendar({ entries, selected, onSelect }) {
  const sel = fromKey(selected);
  const [view, setView] = useState({ y: sel.getFullYear(), m: sel.getMonth() });
  const today = todayKey();
  const cells = monthGrid(view.y, view.m);

  const shift = (delta) => {
    let m = view.m + delta;
    let y = view.y;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setView({ y, m });
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => shift(-1)}
          className="w-8 h-8 grid place-items-center rounded-lg hover:bg-ink-700 text-muted"
          aria-label="이전 달"
        >
          <span className="text-lg">‹</span>
        </button>
        <div className="text-sm font-bold text-gray-100">{monthLabel(view.y, view.m)}</div>
        <button
          onClick={() => shift(1)}
          className="w-8 h-8 grid place-items-center rounded-lg hover:bg-ink-700 text-muted"
          aria-label="다음 달"
        >
          <span className="text-lg">›</span>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEK.map((w, i) => (
          <div
            key={w}
            className={`text-center text-[11px] font-semibold py-1 ${
              i === 0 ? "text-bad/80" : i === 6 ? "text-brand-soft/80" : "text-muted"
            }`}
          >
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map(({ key, inMonth, date }) => {
          const has = !!(entries[key] && (entries[key].text || "").trim());
          const isToday = key === today;
          const isSel = key === selected;
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className={[
                "relative aspect-square rounded-lg text-sm flex items-center justify-center transition",
                isSel
                  ? "bg-brand text-ink-900 font-bold"
                  : has
                    ? "bg-brand/15 text-brand-soft font-semibold hover:bg-brand/25"
                    : "hover:bg-ink-700",
                inMonth ? (isSel ? "" : "text-gray-200") : "text-ink-500",
                isToday && !isSel ? "ring-1 ring-inset ring-warm/60" : "",
              ].join(" ")}
            >
              {date.getDate()}
              {has && !isSel && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-brand" />
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );
}
