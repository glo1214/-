import { useEffect, useState } from "react";
import {
  teacherStudent,
  teacherStudents,
  type StudentRow,
  type SyncState,
  type User,
} from "../lib/api";

/** 선생님 대시보드 — 담당 학생들의 진도를 본다. */
export function Teacher({ me, onLogout }: { me: User; onLogout: () => void }) {
  const [rows, setRows] = useState<StudentRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ student: User; state: SyncState | null } | null>(null);

  function reload() {
    setErr(null);
    teacherStudents()
      .then(setRows)
      .catch((e) => setErr((e as Error).message));
  }
  useEffect(reload, []);

  if (detail) {
    const prog = detail.state?.progress || {};
    const rowsD = Object.entries(prog).sort((a, b) => (b[1].wrongCount || 0) - (a[1].wrongCount || 0));
    return (
      <div className="screen">
        <div className="row" style={{ marginBottom: 12 }}>
          <button className="btn small" onClick={() => setDetail(null)}>
            ← 목록
          </button>
          <span className="spacer" />
          <h2 style={{ margin: 0, fontSize: 18 }}>{detail.student.name}</h2>
        </div>
        {rowsD.length === 0 && <div className="muted small">아직 학습 기록이 없어요.</div>}
        {rowsD.map(([key, p]) => (
          <div className="deck-item" key={key}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="en">{key.split("#")[0]}</div>
              <div className="small muted">
                박스 {p.box} · 반복 {p.reps ?? 0}회 · 틀림 {p.wrongCount || 0}회
                {p.lastSeen ? ` · ${p.lastSeen}` : ""}
              </div>
            </div>
            <span className={"badge" + (p.box >= 4 ? " box" : "")}>
              {p.box >= 4 ? "숙달" : p.box >= 2 ? "학습중" : "새단어"}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="row" style={{ marginBottom: 14 }}>
        <h2 style={{ margin: 0 }}>학생 진도</h2>
        <span className="spacer" />
        <button className="btn small" onClick={reload}>
          새로고침
        </button>
        <button className="btn small" onClick={onLogout}>
          로그아웃
        </button>
      </div>
      <div className="muted small" style={{ marginBottom: 12 }}>
        {me.name} 선생님 · 학생이 가입할 때 <b>{me.email}</b> 를 선생님 이메일로 입력하면 여기 나타나요.
      </div>

      {err && <div className="small" style={{ color: "var(--bad)", marginBottom: 10 }}>{err}</div>}
      {!rows && !err && <div className="muted small">불러오는 중…</div>}
      {rows && rows.length === 0 && (
        <div className="card">
          <div className="small">아직 등록된 학생이 없어요.</div>
          <div className="small muted" style={{ marginTop: 6 }}>
            학생에게 가입 시 선생님 이메일 <b>{me.email}</b> 을 입력하라고 알려주세요.
          </div>
        </div>
      )}

      {rows?.map((s) => {
        const done = s.summary.mastered;
        const total = s.summary.total || 1;
        const pct = Math.round((done / total) * 100);
        return (
          <div className="card" key={s.id} onClick={() => {
            teacherStudent(s.id).then(setDetail).catch((e) => setErr((e as Error).message));
          }} style={{ cursor: "pointer" }}>
            <div className="row" style={{ marginBottom: 6 }}>
              <b>{s.name}</b>
              <span className="spacer" />
              <span className="small muted">{s.summary.lastSeen || "기록 없음"}</span>
            </div>
            <div className="progressbar">
              <div style={{ width: `${pct}%` }} />
            </div>
            <div className="small muted" style={{ marginTop: 6 }}>
              전체 {s.summary.total}개 · 숙달 {s.summary.mastered} · 학습중 {s.summary.learning} · 새단어{" "}
              {s.summary.fresh}
              {s.summary.retired ? ` · 제외 ${s.summary.retired}` : ""}
            </div>
          </div>
        );
      })}
    </div>
  );
}
