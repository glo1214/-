import React from "react";
import { Card, Pill, Icon } from "./common.jsx";
import SpeakButton from "./SpeakButton.jsx";

/* 핵심 패턴 + 오늘 배운 표현 */
export function PatternList({ patterns }) {
  if (!patterns || patterns.length === 0) return null;
  return (
    <div className="space-y-2.5">
      {patterns.map((p, i) => (
        <Card key={i} className="p-3.5">
          <div className="font-mono text-sm text-warm-soft font-semibold mb-1.5">
            {p.pattern}
          </div>
          {p.meaningKo && <div className="text-[13px] text-muted mb-2">{p.meaningKo}</div>}
          {p.example && (
            <div className="flex items-center gap-2 rounded-lg bg-ink-700 px-3 py-2">
              <span className="flex-1 font-serif text-[14px] text-gray-100">{p.example}</span>
              <SpeakButton text={p.example} size={15} />
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

export function ExpressionList({ expressions }) {
  if (!expressions || expressions.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {expressions.map((ex, i) => (
        <div
          key={i}
          className="inline-flex items-center gap-1.5 rounded-full bg-warm/10 border border-warm/25 pl-3 pr-2 py-1.5"
        >
          <span className="font-serif text-[14px] text-warm-soft">{ex}</span>
          <SpeakButton text={ex} size={14} />
        </div>
      ))}
    </div>
  );
}
