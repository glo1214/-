import React, { useState, useEffect } from "react";
import { speak, stopSpeaking, ttsSupported } from "../lib/speech.js";
import { getState } from "../lib/storage.js";
import { Icon } from "./common.jsx";

/* 텍스트를 원어민 음성으로 읽어 주는 작은 버튼 */
export default function SpeakButton({ text, size = 18, label, className = "" }) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => () => stopSpeaking(), []);

  if (!ttsSupported) return null;

  const toggle = () => {
    if (playing) {
      stopSpeaking();
      setPlaying(false);
      return;
    }
    const { settings } = getState();
    setPlaying(true);
    speak(text, {
      voiceURI: settings.voiceURI,
      rate: settings.rate,
      onend: () => setPlaying(false),
    });
  };

  return (
    <button
      onClick={toggle}
      aria-label="소리 듣기"
      className={`inline-flex items-center gap-1.5 text-brand-soft hover:text-brand transition ${
        playing ? "animate-pulseSoft" : ""
      } ${className}`}
    >
      <Icon name="speaker" size={size} />
      {label && <span className="text-xs font-semibold">{label}</span>}
    </button>
  );
}
