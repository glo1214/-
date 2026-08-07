import React, { useState, useEffect } from "react";
import { useStore } from "../lib/useStore.js";
import { updateSettings, getState } from "../lib/storage.js";
import { onVoicesReady, speak, ttsSupported, sttSupported } from "../lib/speech.js";
import { checkAIStatus } from "../lib/ai.js";
import { Card, Button, SectionTitle, Icon, Pill } from "../components/common.jsx";

export default function Settings() {
  const state = useStore();
  const s = state.settings;
  const [voices, setVoices] = useState([]);
  const [aiStatus, setAiStatus] = useState("checking");

  useEffect(() => onVoicesReady(setVoices), []);
  useEffect(() => {
    checkAIStatus().then(setAiStatus);
  }, []);

  const exportData = () => {
    const blob = new Blob([JSON.stringify(getState(), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `think-in-english-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetAll = () => {
    if (!confirm("정말 모든 일기와 복습 기록을 지울까요? 되돌릴 수 없어요.")) return;
    localStorage.removeItem("think-in-english/v1");
    location.reload();
  };

  return (
    <div className="pb-4 space-y-6">
      <SectionTitle title="설정" subtitle="이름·음성·데이터 관리" />

      {/* 이름 */}
      <Card className="p-4">
        <label className="text-sm font-semibold text-gray-100">이름 (선택)</label>
        <p className="text-xs text-muted mt-0.5 mb-2.5">AI가 이름을 불러 주고 첨삭에 반영해요.</p>
        <input
          value={s.name}
          onChange={(e) => updateSettings({ name: e.target.value.slice(0, 20) })}
          placeholder="예) 지민"
          className="w-full bg-ink-700 border border-line rounded-lg px-3 py-2.5 text-[15px] text-gray-100 outline-none focus:border-brand/50"
        />
      </Card>

      {/* AI 상태 */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold text-gray-100">AI 첨삭 상태</span>
          {aiStatus === "checking" && <Pill tone="muted">확인 중…</Pill>}
          {aiStatus === "ready" && (
            <Pill tone="good">
              <Icon name="check" size={13} /> 켜짐
            </Pill>
          )}
          {(aiStatus === "no_key" || aiStatus === "offline") && (
            <Pill tone="warm">오프라인 모드</Pill>
          )}
        </div>
        <p className="text-xs text-muted leading-relaxed mt-1.5">
          {aiStatus === "ready" &&
            "원어민 수준 첨삭과 영어식 사고 설명을 사용할 수 있어요. API 키는 서버에만 저장되어 안전해요."}
          {aiStatus === "no_key" &&
            "AI 첨삭이 아직 켜지지 않았어요. 배포한 Netlify 사이트의 환경변수 ANTHROPIC_API_KEY 를 설정하면 켜져요. 지금도 오프라인 연습 모드로 일기·읽기·음성·복습은 모두 사용할 수 있어요."}
          {aiStatus === "offline" &&
            "지금은 서버에 연결할 수 없어요(로컬 미리보기이거나 오프라인). 배포된 사이트에서 AI 첨삭이 동작해요."}
        </p>
      </Card>

      {/* 음성 */}
      <Card className="p-4 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-gray-100">원어민 음성</span>
            <span className="flex gap-2">
              {ttsSupported ? <Pill tone="good">듣기 지원</Pill> : <Pill tone="bad">듣기 미지원</Pill>}
              {sttSupported ? <Pill tone="good">말하기 지원</Pill> : <Pill tone="muted">말하기 미지원</Pill>}
            </span>
          </div>
          {ttsSupported ? (
            <select
              value={s.voiceURI}
              onChange={(e) => updateSettings({ voiceURI: e.target.value })}
              className="w-full bg-ink-700 border border-line rounded-lg px-3 py-2.5 text-sm text-gray-100 outline-none focus:border-brand/50 mt-1"
            >
              <option value="">자동 (기본 영어 음성)</option>
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          ) : (
            <p className="text-xs text-muted">이 브라우저는 음성 읽기를 지원하지 않아요. Chrome 권장.</p>
          )}
        </div>

        {ttsSupported && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-200">읽기 속도</span>
              <span className="text-xs text-muted tnum">{s.rate.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.6"
              max="1.2"
              step="0.05"
              value={s.rate}
              onChange={(e) => updateSettings({ rate: Number(e.target.value) })}
              className="w-full accent-brand"
            />
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() =>
                speak("Now that I've eaten breakfast, I'm getting sleepy.", {
                  voiceURI: s.voiceURI,
                  rate: s.rate,
                })
              }
            >
              <Icon name="speaker" size={15} /> 미리 듣기
            </Button>
          </div>
        )}
      </Card>

      {/* 데이터 */}
      <Card className="p-4 space-y-2.5">
        <span className="text-sm font-semibold text-gray-100">내 데이터</span>
        <p className="text-xs text-muted leading-relaxed">
          모든 일기와 복습은 이 기기(브라우저)에만 저장돼요. 기기를 바꾸기 전엔 백업하세요.
        </p>
        <div className="flex gap-2.5 pt-1">
          <Button variant="ghost" size="sm" onClick={exportData}>
            <Icon name="book" size={15} /> 백업 내보내기
          </Button>
          <Button variant="danger" size="sm" onClick={resetAll}>
            <Icon name="trash" size={15} /> 전체 초기화
          </Button>
        </div>
      </Card>

      <p className="text-center text-xs text-ink-500 pt-2">
        Think in English · 영어를 번역하지 말고, 영어로 생각하세요.
      </p>
    </div>
  );
}
