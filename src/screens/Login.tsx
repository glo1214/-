import { useState } from "react";
import { login, register, type Role, type User } from "../lib/api";

/** 로그인 / 가입 화면. 서버가 있을 때만 동작(정적 배포에선 '오프라인으로 쓰기'로 넘어감). */
export function Login({
  onAuth,
  onSkip,
}: {
  onAuth: (u: User) => void;
  onSkip: () => void;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("student");
  const [teacherEmail, setTeacherEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setErr(null);
    setBusy(true);
    try {
      const u =
        mode === "login"
          ? await login(email.trim(), password)
          : await register({
              email: email.trim(),
              password,
              name: name.trim() || email.split("@")[0],
              role,
              teacherEmail: role === "student" ? teacherEmail.trim() : undefined,
            });
      onAuth(u);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="screen">
      <div style={{ textAlign: "center", margin: "24px 0 18px" }}>
        <div className="dday" style={{ fontSize: 32, color: "var(--accent)" }}>단어 리셋</div>
        <div className="muted small" style={{ marginTop: 6 }}>
          로그인하면 진도가 저장되고, 선생님이 진도를 볼 수 있어요.
        </div>
      </div>

      <div className="row" style={{ marginBottom: 16, gap: 8 }}>
        <button
          className={"btn" + (mode === "login" ? " primary" : "")}
          onClick={() => setMode("login")}
        >
          로그인
        </button>
        <button
          className={"btn" + (mode === "register" ? " primary" : "")}
          onClick={() => setMode("register")}
        >
          가입
        </button>
      </div>

      {mode === "register" && (
        <>
          <div className="small muted" style={{ marginBottom: 8 }}>
            역할 선택
          </div>
          <div className="row" style={{ marginBottom: 14, gap: 8 }}>
            <button
              className={"btn" + (role === "student" ? " primary" : "")}
              onClick={() => setRole("student")}
            >
              🎓 학생
            </button>
            <button
              className={"btn" + (role === "teacher" ? " primary" : "")}
              onClick={() => setRole("teacher")}
            >
              🧑‍🏫 선생님
            </button>
          </div>
          <label className="field">
            <span>이름</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" />
          </label>
          {role === "student" && (
            <label className="field">
              <span>선생님 이메일 (선생님이 먼저 가입해야 해요)</span>
              <input
                value={teacherEmail}
                onChange={(e) => setTeacherEmail(e.target.value)}
                placeholder="teacher@example.com"
                autoCapitalize="none"
              />
            </label>
          )}
        </>
      )}

      <label className="field">
        <span>이메일</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="me@example.com"
          autoCapitalize="none"
        />
      </label>
      <label className="field">
        <span>비밀번호 (4자 이상)</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
      </label>

      {err && (
        <div className="small" style={{ color: "var(--bad)", marginBottom: 12 }}>
          {err}
        </div>
      )}

      <button className="btn primary" onClick={submit} disabled={busy || !email || !password}>
        {busy ? "처리 중…" : mode === "login" ? "로그인" : "가입하기"}
      </button>

      <button className="btn ghost" style={{ marginTop: 10 }} onClick={onSkip}>
        로그인 없이 이 기기에서만 쓰기
      </button>
    </div>
  );
}
