/* 로그인 / 가입 — 로컬 모드임을 숨기지 않고 그대로 알린다 */

import { useState } from "react";
import { listAccounts, signIn, signUp } from "../lib/store.js";
import { Button, Card, Input, Label, Notice } from "../components/common.jsx";

export function Auth() {
  const accounts = listAccounts();
  const [mode, setMode] = useState(accounts.length ? "signin" : "signup");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [selected, setSelected] = useState(accounts[0]?.uid || "");
  const [error, setError] = useState("");

  function submit(e) {
    e.preventDefault();
    setError("");
    try {
      if (mode === "signup") signUp({ displayName: name, pin, birthYear });
      else signIn({ uid: selected, pin });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-7">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">글로온 생각온</h1>
        <p className="mt-2 text-[15px] leading-7 text-ink-500">
          오늘 마음에 남은 것을 기록하고, 질문을 따라가며 내 생각을 발견하고,
          내 언어로 글을 완성하는 공간이에요.
        </p>
      </div>

      <Card className="p-5">
        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" ? (
            <>
              <div>
                <Label hint="본명이 아니어도 괜찮아요">이름 또는 별명</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="예) 지오"
                  maxLength={12}
                  autoFocus
                />
              </div>
              <div>
                <Label hint="숫자 4자리">비밀번호</Label>
                <Input
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="0000"
                  inputMode="numeric"
                  type="password"
                />
              </div>
              <div>
                <Label hint="선택 — 안 적어도 돼요">태어난 해</Label>
                <Input
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="2011"
                  inputMode="numeric"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <Label>이 기기에 있는 계정</Label>
                <select
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                  className="w-full rounded-xl2 border border-line bg-paper-card px-3.5 py-2.5 text-[15px] text-ink-900 outline-none focus:border-ochre-300"
                >
                  {accounts.map((a) => (
                    <option key={a.uid} value={a.uid}>
                      {a.displayName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label hint="숫자 4자리">비밀번호</Label>
                <Input
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="0000"
                  inputMode="numeric"
                  type="password"
                  autoFocus
                />
              </div>
            </>
          )}

          {error ? <p className="text-sm text-rust">{error}</p> : null}

          <Button type="submit" size="lg" className="w-full">
            {mode === "signup" ? "시작하기" : "들어가기"}
          </Button>
        </form>

        <div className="mt-4 text-center">
          {accounts.length ? (
            <button
              onClick={() => {
                setMode(mode === "signup" ? "signin" : "signup");
                setError("");
                setPin("");
              }}
              className="text-sm text-ink-500 underline underline-offset-4 hover:text-ink-900"
            >
              {mode === "signup" ? "이미 만든 계정으로 들어가기" : "새로 시작하기"}
            </button>
          ) : null}
        </div>
      </Card>

      <div className="mt-5">
        <Notice>
          <strong className="font-medium text-ink-900">기록은 이 기기에만 저장돼요.</strong>{" "}
          지금은 서버 계정 없이 브라우저 안에 저장하는 방식이라, 다른 기기에서는 보이지 않고
          브라우저 데이터를 지우면 함께 지워져요. 비밀번호는 같은 기기를 쓰는 사람이 실수로 열어보는
          것을 막는 정도이지, 강력한 보안은 아니에요. 설정에서 언제든 전체 삭제할 수 있어요.
        </Notice>
      </div>
    </div>
  );
}
