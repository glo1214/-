import type { Word } from "../types";
import { canSpeak, speak } from "../lib/tts";
import { koPronVisible } from "../lib/scaffold";

/** 한글 발음 표기 + 발음기호 + TTS.
 *  박스 3 이상이면 한글 표기(비계)를 숨긴다. 발음기호는 병기 유지. */
export function Pronunciation({
  word,
  box,
  useKoPron,
  showTts = true,
}: {
  word: Word;
  box: number;
  useKoPron: boolean;
  showTts?: boolean;
}) {
  const showKo = koPronVisible(box, useKoPron);
  return (
    <div className="pron">
      {showTts && canSpeak() && (
        <button className="tts" onClick={() => speak(word.word)} aria-label="발음 듣기" title="발음 듣기">
          🔊
        </button>
      )}
      {word.ipa && <span className="ipa">{word.ipa}</span>}
      {showKo && word.ko.length > 0 && (
        <span className="ko">
          {word.ko.map((syl, i) => (
            <span key={i} className={i === word.koStress ? "st" : undefined}>
              {syl}
              {i < word.ko.length - 1 ? " · " : ""}
            </span>
          ))}
        </span>
      )}
    </div>
  );
}

/** 어원 카드 + 연상 문구. 오답·모름일 때 remediation으로 띄운다. */
export function EtymologyCard({ word, useEtymology }: { word: Word; useEtymology: boolean }) {
  const hasEtym = useEtymology && (word.parts?.length || word.story);
  const hasMnemonic = !!word.mnemonic;
  if (!hasEtym && !hasMnemonic) return null;
  return (
    <div className="card etym">
      {hasEtym && (
        <>
          <div className="small muted" style={{ marginBottom: 8 }}>
            어원
          </div>
          {word.parts && word.parts.length > 0 && (
            <div className="parts">
              {word.parts.map((p, i) => (
                <span key={i} className="chip">
                  <b>{p.text}</b> {p.gloss}
                </span>
              ))}
            </div>
          )}
          {word.story && <div className="small" style={{ marginBottom: hasMnemonic ? 12 : 0 }}>{word.story}</div>}
        </>
      )}
      {hasMnemonic && (
        <>
          <div className="small muted" style={{ margin: "4px 0 6px" }}>
            연상
          </div>
          <div className="mnemonic small">{word.mnemonic}</div>
        </>
      )}
    </div>
  );
}
