/* 백엔드 API 클라이언트.
   VITE_API_URL 이 없으면 같은 출처(/api)로 호출 → 단일 컨테이너 배포에 맞음.
   토큰은 localStorage에 보관. 서버가 없으면(정적 배포) 로그인만 실패하고
   앱은 기존처럼 localStorage 단독으로 동작한다. */
import type { Deck, Profile, ProgressMap } from "../types";

const BASE = (import.meta.env.VITE_API_URL as string | undefined) || "";
const K_TOKEN = "wr.token";
const K_USER = "wr.user";

export type Role = "teacher" | "student";
export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  teacherId: string | null;
}
export interface SyncState {
  profile: Profile;
  decks: Deck[];
  progress: ProgressMap;
  daily?: unknown;
  updatedAt?: string;
}
export interface StudentSummary {
  total: number;
  mastered: number;
  learning: number;
  fresh: number;
  retired: number;
  wrong: number;
  lastSeen: string | null;
  updatedAt: string | null;
}
export interface StudentRow extends User {
  summary: StudentSummary;
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(K_TOKEN);
  } catch {
    return null;
  }
}
export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(K_USER);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}
function setAuth(token: string, user: User) {
  try {
    localStorage.setItem(K_TOKEN, token);
    localStorage.setItem(K_USER, JSON.stringify(user));
  } catch {
    /* ignore */
  }
}
export function clearAuth() {
  try {
    localStorage.removeItem(K_TOKEN);
    localStorage.removeItem(K_USER);
  } catch {
    /* ignore */
  }
}

/** 백엔드가 있는지 확인 (정적 배포면 false → 로그인 없이 단독 동작). */
export async function health(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/api/health`, { cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}/api${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data.error || `요청 실패 (${res.status})`);
  return data as T;
}

export async function register(input: {
  email: string;
  password: string;
  name: string;
  role: Role;
  teacherEmail?: string;
}): Promise<User> {
  const { token, user } = await req<{ token: string; user: User }>("/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
  setAuth(token, user);
  return user;
}

export async function login(email: string, password: string): Promise<User> {
  const { token, user } = await req<{ token: string; user: User }>("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setAuth(token, user);
  return user;
}

export async function fetchState(): Promise<SyncState | null> {
  const { state } = await req<{ state: SyncState | null }>("/state");
  return state;
}

export async function pushState(state: SyncState): Promise<void> {
  await req("/state", { method: "PUT", body: JSON.stringify(state) });
}

export async function teacherStudents(): Promise<StudentRow[]> {
  const { students } = await req<{ students: StudentRow[] }>("/teacher/students");
  return students;
}

export async function teacherStudent(id: string): Promise<{ student: User; state: SyncState | null }> {
  return req(`/teacher/student/${id}`);
}
