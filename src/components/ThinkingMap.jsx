import React from "react";
import { Icon } from "./common.jsx";
import SpeakButton from "./SpeakButton.jsx";

/* 사고 흐름 시각화: 사건 → 연결 → 결과 ... */
export default function ThinkingMap({ steps }) {
  if (!steps || steps.length === 0) return null;
  return (
    <div className="flex flex-col items-center py-1">
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <div className="w-full max-w-sm rounded-xl bg-ink-700 border border-line px-4 py-3 text-center animate-slideup">
            {s.step && (
              <div className="text-[11px] font-semibold text-brand-soft uppercase tracking-wide mb-1">
                {s.step}
              </div>
            )}
            <div className="flex items-center justify-center gap-2">
              <span className="font-serif text-[15px] text-gray-100">{s.en}</span>
              {s.en && <SpeakButton text={s.en} size={15} />}
            </div>
          </div>
          {i < steps.length - 1 && (
            <div className="text-brand/60 my-1">
              <Icon name="arrow-down" size={18} />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
