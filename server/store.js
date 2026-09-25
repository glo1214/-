/* 아주 작은 JSON 파일 DB (학생 1~2명 규모용).
   동시 쓰기 충돌을 피하려고 쓰기를 순차 큐로 처리한다. */
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from "node:fs";
import { dirname } from "node:path";

const DATA_PATH = process.env.DATA_PATH || "/data/db.json";

const empty = { users: [], states: {} };

function ensureDir(p) {
  const dir = dirname(p);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

let db = load();

function load() {
  try {
    if (existsSync(DATA_PATH)) return JSON.parse(readFileSync(DATA_PATH, "utf8"));
  } catch (e) {
    console.error("DB load failed, starting empty:", e.message);
  }
  return structuredClone(empty);
}

let writing = Promise.resolve();
function persist() {
  // 원자적 쓰기: 임시 파일에 쓰고 rename
  writing = writing.then(() => {
    try {
      ensureDir(DATA_PATH);
      const tmp = DATA_PATH + ".tmp";
      writeFileSync(tmp, JSON.stringify(db, null, 2));
      renameSync(tmp, DATA_PATH);
    } catch (e) {
      console.error("DB write failed:", e.message);
    }
  });
  return writing;
}

export const store = {
  get raw() {
    return db;
  },
  findUserByEmail(email) {
    const e = String(email || "").trim().toLowerCase();
    return db.users.find((u) => u.email === e);
  },
  findUserById(id) {
    return db.users.find((u) => u.id === id);
  },
  addUser(user) {
    db.users.push(user);
    persist();
    return user;
  },
  studentsOf(teacherId) {
    return db.users.filter((u) => u.role === "student" && u.teacherId === teacherId);
  },
  getState(userId) {
    return db.states[userId] || null;
  },
  setState(userId, state) {
    db.states[userId] = { ...state, updatedAt: new Date().toISOString() };
    persist();
    return db.states[userId];
  },
};
