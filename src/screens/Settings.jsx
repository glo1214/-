/* 설정 — 개인정보와 청소년 보호 (기획서 16절) */

import { useState } from "react";
import {
  currentUser,
  deleteAccountAndData,
  deleteAllRecords,
  exportMyData,
  signOut,
  updateSettings,
} from "../lib/store.js";
import { HELP_LINES } from "../lib/safety.js";
import { Button, Card, Modal, Notice, SectionTitle } from "../components/common.jsx";

export function Settings() {
  const user = currentUser();
  const [confirm, setConfirm] = useState(null); // "records" | "account"

  function download() {
    const data = exportMyData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `글로온-생각온-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-7">
      <header>
        <h1 className="text-[20px] font-semibold tracking-tight text-ink-900">설정</h1>
        <p className="mt-1.5 text-sm text-ink-500">{user.displayName}으로 로그인 중</p>
      </header>

      <section>
        <SectionTitle>내 기록의 공개 범위</SectionTitle>
        <Card className="space-y-3 p-4 text-sm leading-6 text-ink-700">
          <p>
            <strong className="font-medium text-ink-900">지금은 모든 기록이 나만 볼 수 있어요.</strong>{" "}
            선생님이나 보호자에게 자동으로 공개되지 않아요. 나중에 공유 기능이 생기더라도,
            어떤 글을 공유할지는 네가 하나씩 골라야 열려요.
          </p>
          <label className="flex items-start gap-2.5">
            <input
              type="checkbox"
              checked={Boolean(user.settings?.allowAiTraining)}
              onChange={(e) => updateSettings({ allowAiTraining: e.target.checked })}
              className="mt-1 h-4 w-4 accent-[#C08A2E]"
            />
            <span>
              내 글을 AI 성능 개선에 사용해도 좋아요
              <span className="block text-ink-400">
                기본은 사용하지 않음이에요. 지금 버전에서는 어떤 경우에도 글이 학습에 쓰이지 않아요.
              </span>
            </span>
          </label>
        </Card>
      </section>

      <section>
        <SectionTitle>내 데이터</SectionTitle>
        <Card className="space-y-3 p-4">
          <p className="text-sm leading-6 text-ink-700">
            기록은 이 브라우저 안에만 저장돼요. 다른 기기로 옮기고 싶거나 백업하고 싶으면
            파일로 내려받을 수 있어요.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={download}>
              내 기록 내려받기
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirm("records")}>
              기록 전체 삭제
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirm("account")}>
              계정까지 삭제
            </Button>
          </div>
        </Card>
      </section>

      <section>
        <SectionTitle>힘들 때 연락할 곳</SectionTitle>
        <Card className="p-4">
          <ul className="space-y-2">
            {HELP_LINES.map((h) => (
              <li key={h.name} className="flex items-baseline justify-between gap-3 text-sm">
                <span>
                  <span className="font-medium text-ink-900">{h.name}</span>
                  <span className="block text-xs text-ink-400">{h.note}</span>
                </span>
                <a
                  href={`tel:${h.number.replace("#", "")}`}
                  className="shrink-0 font-semibold text-ochre-700"
                >
                  {h.number}
                </a>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <Notice>
        이 앱은 상담이나 심리 검사 도구가 아니에요. 관심 지도는 적성을 판정하지 않고,
        AI는 완성된 글을 대신 써주지 않아요.
      </Notice>

      <Button variant="outline" className="w-full" onClick={signOut}>
        로그아웃
      </Button>

      <Modal
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title={confirm === "account" ? "계정과 기록을 모두 지울까?" : "기록을 모두 지울까?"}
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirm(null)}>
              그대로 두기
            </Button>
            <Button
              onClick={() => {
                if (confirm === "account") deleteAccountAndData();
                else deleteAllRecords();
                setConfirm(null);
              }}
            >
              지우기
            </Button>
          </>
        }
      >
        기록, 대화, 생각 카드, 쓰던 글이 함께 지워지고 되돌릴 수 없어요.
        {confirm === "account" ? " 계정도 함께 사라져요." : ""} 먼저 내려받기를 해두면
        파일로 남겨둘 수 있어요.
      </Modal>
    </div>
  );
}
