import React from "react";
import { Card, Pill, Icon } from "./common.jsx";
import SpeakButton from "./SpeakButton.jsx";

/* 문장별 교정: 원문 → 원어민 버전 + 이유 */
export default function CorrectionView({ entry }) {
  const { corrected, sentences, aiSource } = entry;

  return (
    <div className="space-y-4">
      {/* 전체 교정문 */}
      {corrected && (
        <Card className="p-4 bg-gradient-to-b from-brand/10 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <Pill tone="brand">
              <Icon name="sparkles" size={13} /> 원어민 버전
            </Pill>
            <SpeakButton text={corrected} size={18} label="전체 듣기" />
          </div>
          <p className="font-serif text-[16px] leading-relaxed text-gray-50 whitespace-pre-wrap">
            {corrected}
          </p>
        </Card>
      )}

      {/* 문장별 설명 */}
      {sentences && sentences.length > 0 && (
        <div className="space-y-2.5">
          {sentences.map((s, i) => {
            const changed = s.original && s.corrected && s.original.trim() !== s.corrected.trim();
            return (
              <Card key={i} className="p-3.5">
                {s.original && (
                  <div className="flex items-start gap-2 mb-1.5">
                    <span
                      className={`mt-1 shrink-0 ${changed ? "text-bad" : "text-muted"}`}
                    >
                      <Icon name={changed ? "x" : "check"} size={14} />
                    </span>
                    <span
                      className={`text-sm leading-snug text-muted ${
                        changed ? "line-through decoration-bad/50" : ""
                      }`}
                    >
                      {s.original}
                    </span>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <span className="mt-1 shrink-0 text-good">
                    <Icon name="check" size={14} />
                  </span>
                  <span className="flex-1 font-serif text-[15px] leading-snug text-gray-100">
                    {s.corrected}
                  </span>
                  <SpeakButton text={s.corrected} size={16} className="mt-0.5 shrink-0" />
                </div>
                {s.reason && (
                  <p className="text-[13px] text-brand-soft/90 mt-2 pl-6 leading-relaxed">
                    💡 {s.reason}
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {aiSource === "offline" && (
        <p className="text-xs text-warm-soft/80 text-center leading-relaxed px-4">
          지금은 <b>오프라인 연습 모드</b> 교정이에요. 설정에서 AI 첨삭을 켜면 원어민 수준
          첨삭과 사고방식 설명을 받을 수 있어요.
        </p>
      )}
    </div>
  );
}
