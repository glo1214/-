import React, { useState, useRef, useEffect } from "react";
import { recognizeOnce, sttSupported, similarity } from "../lib/speech.js";
import { Button, Icon } from "./common.jsx";
import SpeakButton from "./SpeakButton.jsx";

/* 원어민 문장을 듣고 → 따라 말하면 → 얼마나 비슷한지 채점 */
export default function SpeakPractice({ text }) {
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const [score, setScore] = useState(null);
  const [err, setErr] = useState("");
  const ctrl = useRef(null);

  useEffect(() => () => ctrl.current?.stop(), []);

  if (!sttSupported) {
    return (
      <p className="text-xs text-muted text-center">
        이 브라우저는 발음 채점(음성 인식)을 지원하지 않아요. Chrome에서 사용해 보세요.
      </p>
    );
  }

  const start = () => {
    setErr("");
    setHeard("");
    setScore(null);
    setListening(true);
    ctrl.current = recognizeOnce({
      onResult: ({ final, interim }) => setHeard(final || interim),
      onError: (m) => {
        setErr(m);
        setListening(false);
      },
      onEnd: (final) => {
        setListening(false);
        if (final) setScore(Math.round(similarity(text, final) * 100));
      },
    });
  };

  const stop = () => ctrl.current?.stop();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-3">
        <SpeakButton text={text} size={22} label="듣기" />
        {listening ? (
          <Button variant="danger" size="sm" onClick={stop}>
            <Icon name="mic" size={16} /> 그만 말하기
          </Button>
        ) : (
          <Button variant="primary" size="sm" onClick={start}>
            <Icon name="mic" size={16} /> 따라 말하기
          </Button>
        )}
      </div>

      {listening && (
        <p className="text-center text-sm text-brand-soft animate-pulseSoft">
          듣고 있어요… 또박또박 말해 보세요
        </p>
      )}

      {heard && (
        <p className="text-center text-sm text-gray-200">
          <span className="text-muted">들린 말: </span>“{heard}”
        </p>
      )}

      {score != null && (
        <div className="text-center">
          <div
            className={`text-3xl font-bold tnum ${
              score >= 80 ? "text-good" : score >= 50 ? "text-warm" : "text-bad"
            }`}
          >
            {score}점
          </div>
          <p className="text-xs text-muted mt-1">
            {score >= 80 ? "훌륭해요! 발음이 아주 정확해요 🎉" : score >= 50 ? "좋아요! 한 번 더 또렷하게 말해 볼까요?" : "천천히 단어 하나하나 말해 보세요."}
          </p>
        </div>
      )}

      {err && <p className="text-center text-xs text-bad">{err}</p>}
    </div>
  );
}
