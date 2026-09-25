/* 영단어 앱 백엔드
   - 이메일/비밀번호 로그인 (JWT)
   - 학생: 자기 상태(profile/decks/progress) 저장·불러오기
   - 선생님: 담당 학생 목록 + 진도 요약/상세 조회
   - 빌드된 프론트(dist)도 같이 서빙 → 단일 컨테이너/단일 URL
*/
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";
import { store } from "./store.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || "dev-insecure-secret-change-me";
const TOKEN_TTL = "30d";

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

function sign(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}
function publicUser(u) {
  return { id: u.id, email: u.email, name: u.name, role: u.role, teacherId: u.teacherId ?? null };
}

/* 인증 미들웨어 */
function auth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: "로그인이 필요해요." });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = store.findUserById(payload.id);
    if (!user) return res.status(401).json({ error: "사용자를 찾을 수 없어요." });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "로그인이 만료됐어요. 다시 로그인해 주세요." });
  }
}

/* ---------- 인증 ---------- */
app.post("/api/register", async (req, res) => {
  const { email, password, name, role, teacherEmail } = req.body || {};
  const e = String(email || "").trim().toLowerCase();
  if (!e || !password || String(password).length < 4) {
    return res.status(400).json({ error: "이메일과 4자 이상 비밀번호가 필요해요." });
  }
  if (role !== "teacher" && role !== "student") {
    return res.status(400).json({ error: "역할(teacher/student)이 필요해요." });
  }
  if (store.findUserByEmail(e)) {
    return res.status(409).json({ error: "이미 가입된 이메일이에요." });
  }
  let teacherId = null;
  if (role === "student") {
    const t = store.findUserByEmail(teacherEmail);
    if (!t || t.role !== "teacher") {
      return res.status(400).json({ error: "선생님 이메일을 확인해 주세요 (먼저 선생님이 가입해야 해요)." });
    }
    teacherId = t.id;
  }
  const user = store.addUser({
    id: uid(),
    email: e,
    name: String(name || e.split("@")[0]).trim(),
    role,
    teacherId,
    passwordHash: bcrypt.hashSync(String(password), 10),
    createdAt: new Date().toISOString(),
  });
  res.json({ token: sign(user), user: publicUser(user) });
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body || {};
  const user = store.findUserByEmail(email);
  if (!user || !bcrypt.compareSync(String(password || ""), user.passwordHash)) {
    return res.status(401).json({ error: "이메일 또는 비밀번호가 맞지 않아요." });
  }
  res.json({ token: sign(user), user: publicUser(user) });
});

app.get("/api/me", auth, (req, res) => res.json({ user: publicUser(req.user) }));

/* ---------- 학생 상태 동기화 ---------- */
app.get("/api/state", auth, (req, res) => {
  const state = store.getState(req.user.id);
  res.json({ state: state || null });
});

app.put("/api/state", auth, (req, res) => {
  const { profile, decks, progress, daily } = req.body || {};
  if (typeof progress !== "object" || !Array.isArray(decks)) {
    return res.status(400).json({ error: "올바르지 않은 상태 데이터예요." });
  }
  const saved = store.setState(req.user.id, { profile, decks, progress, daily: daily ?? null });
  res.json({ ok: true, updatedAt: saved.updatedAt });
});

/* ---------- 선생님 대시보드 ---------- */
function summarize(state) {
  const prog = (state && state.progress) || {};
  const retireAfter = state?.profile?.retireAfter ?? 0;
  let total = 0,
    mastered = 0,
    learning = 0,
    fresh = 0,
    retired = 0,
    wrong = 0;
  let lastSeen = null;
  for (const p of Object.values(prog)) {
    total++;
    const reps = p.reps ?? 0;
    if (retireAfter > 0 && reps >= retireAfter) retired++;
    else if (p.box >= 4) mastered++;
    else if (p.box >= 2) learning++;
    else fresh++;
    wrong += p.wrongCount || 0;
    if (p.lastSeen && (!lastSeen || p.lastSeen > lastSeen)) lastSeen = p.lastSeen;
  }
  return { total, mastered, learning, fresh, retired, wrong, lastSeen, updatedAt: state?.updatedAt ?? null };
}

app.get("/api/teacher/students", auth, (req, res) => {
  if (req.user.role !== "teacher") return res.status(403).json({ error: "선생님만 볼 수 있어요." });
  const students = store.studentsOf(req.user.id).map((s) => ({
    ...publicUser(s),
    summary: summarize(store.getState(s.id)),
  }));
  res.json({ students });
});

app.get("/api/teacher/student/:id", auth, (req, res) => {
  if (req.user.role !== "teacher") return res.status(403).json({ error: "선생님만 볼 수 있어요." });
  const s = store.findUserById(req.params.id);
  if (!s || s.teacherId !== req.user.id) return res.status(404).json({ error: "학생을 찾을 수 없어요." });
  res.json({ student: publicUser(s), state: store.getState(s.id) });
});

/* ---------- 정적 프론트(dist) 서빙 + SPA 폴백 ---------- */
const distDir = join(__dirname, "..", "dist");
if (existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(join(distDir, "index.html"));
  });
}

app.listen(PORT, () => console.log(`word-reset server on :${PORT}`));
