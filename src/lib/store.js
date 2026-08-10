/* ------------------------------------------------------------------
   데이터 계층 — 저장소 어댑터

   기획서 15절의 Firestore 컬렉션 구조(users / entries / conversations /
   thinkingCards / drafts / interestSignals)를 그대로 따르되, 지금은
   브라우저 localStorage 백엔드로 동작한다.

   ⚠️ 지금은 '로컬 모드'다. 인증과 저장이 모두 이 기기 안에서만 이루어지며
   서버 검증이 없다. 실제 Firebase 를 붙일 때는 아래 Backend 인터페이스만
   교체하면 화면 코드는 그대로 쓸 수 있게 분리해 두었다.
   (README 의 'Firebase 로 전환하기' 참고)

   모든 문서에는 ownerId 가 들어가고, 읽기/쓰기 시 현재 로그인 사용자와
   대조한다. 다른 계정의 문서는 조회 자체가 되지 않는다.
------------------------------------------------------------------ */

import { useSyncExternalStore } from "react";
import { uid, nowIso } from "./id.js";
import { deletePhotos, deletePhotosOfOwner } from "./photos.js";

const KEY = "gloon.v1";
const CONSENT_VERSION = "2026-01";

const EMPTY = {
  version: 1,
  currentUid: null,
  users: {},
  entries: {},
  conversations: {},
  thinkingCards: {},
  drafts: {},
};

/* ---------------- 로컬 백엔드 ---------------- */

function readRaw() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(EMPTY);
    const parsed = JSON.parse(raw);
    return { ...structuredClone(EMPTY), ...parsed };
  } catch {
    return structuredClone(EMPTY);
  }
}

let state = typeof localStorage === "undefined" ? structuredClone(EMPTY) : readRaw();
let listeners = new Set();
let flushTimer = null;

function persist() {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    flushTimer = null;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("저장 실패:", e);
    }
  }, 120);
}

export function flushNow() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* 저장 공간 부족 등 — 화면에는 별도로 알리지 않는다 */
  }
}

function commit(next) {
  state = next;
  persist();
  listeners.forEach((fn) => fn());
}

function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function getSnapshot() {
  return state;
}

export function useDb() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/* ---------------- 인증 (로컬 모드) ---------------- */

/* PIN 은 평문으로 두지 않되, 이건 어디까지나 같은 기기를 쓰는 형제·친구가
   실수로 열어보는 것을 막는 수준이다. 서버 인증이 아니다. */
function hashPin(pin, salt) {
  let h = 2166136261;
  const s = `${salt}:${pin}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

export function currentUser() {
  return state.currentUid ? state.users[state.currentUid] || null : null;
}

export function listAccounts() {
  return Object.values(state.users).map((u) => ({
    uid: u.uid,
    displayName: u.displayName,
  }));
}

export function signUp({ displayName, pin, birthYear }) {
  const name = String(displayName || "").trim();
  if (name.length < 1) throw new Error("이름(또는 별명)을 적어주세요.");
  if (!/^\d{4}$/.test(String(pin || ""))) throw new Error("비밀번호는 숫자 4자리로 정해주세요.");
  const taken = Object.values(state.users).some((u) => u.displayName === name);
  if (taken) throw new Error("이 기기에 같은 이름이 이미 있어요. 다른 이름을 써주세요.");

  const id = uid("u_");
  const salt = uid("");
  const user = {
    uid: id,
    displayName: name,
    role: "student",
    birthYear: birthYear ? Number(birthYear) : null,
    createdAt: nowIso(),
    consentVersion: CONSENT_VERSION,
    salt,
    pinHash: hashPin(pin, salt),
    settings: {
      allowAiTraining: false, // 기획서 16절 — 기본값은 '사용 안 함'
      shareWithTeacher: false,
    },
  };
  commit({ ...state, users: { ...state.users, [id]: user }, currentUid: id });
  return user;
}

export function signIn({ uid: id, pin }) {
  const user = state.users[id];
  if (!user) throw new Error("계정을 찾을 수 없어요.");
  if (user.pinHash !== hashPin(pin, user.salt)) throw new Error("비밀번호가 맞지 않아요.");
  commit({ ...state, currentUid: id });
  return user;
}

export function signOut() {
  commit({ ...state, currentUid: null });
}

export function updateSettings(patch) {
  const me = requireUser();
  const user = { ...me, settings: { ...me.settings, ...patch } };
  commit({ ...state, users: { ...state.users, [me.uid]: user } });
}

export function updateProfile(patch) {
  const me = requireUser();
  const user = { ...me, ...patch, uid: me.uid };
  commit({ ...state, users: { ...state.users, [me.uid]: user } });
}

/* 계정과 그 계정의 모든 기록을 지운다 (기획서 16절) */
export function deleteAccountAndData() {
  const me = requireUser();
  deletePhotosOfOwner(me.uid);
  const keep = (coll) =>
    Object.fromEntries(Object.entries(coll).filter(([, doc]) => doc.ownerId !== me.uid));
  const users = { ...state.users };
  delete users[me.uid];
  commit({
    ...state,
    users,
    currentUid: null,
    entries: keep(state.entries),
    conversations: keep(state.conversations),
    thinkingCards: keep(state.thinkingCards),
    drafts: keep(state.drafts),
  });
  flushNow();
}

/* 기록만 전부 삭제 (계정은 유지) */
export function deleteAllRecords() {
  const me = requireUser();
  deletePhotosOfOwner(me.uid);
  const keep = (coll) =>
    Object.fromEntries(Object.entries(coll).filter(([, doc]) => doc.ownerId !== me.uid));
  commit({
    ...state,
    entries: keep(state.entries),
    conversations: keep(state.conversations),
    thinkingCards: keep(state.thinkingCards),
    drafts: keep(state.drafts),
  });
  flushNow();
}

function requireUser() {
  const me = currentUser();
  if (!me) throw new Error("로그인이 필요해요.");
  return me;
}

/* 소유자 확인 — Firestore Security Rules 의 request.auth.uid == resource.data.ownerId 에 해당 */
function own(doc) {
  if (!doc) return null;
  const me = currentUser();
  if (!me || doc.ownerId !== me.uid) return null;
  return doc;
}

/* ---------------- entries ---------------- */

export function createEntry({ type, initialNote, emotionTags, bodyFeelings, source, visibility, photoIds }) {
  const me = requireUser();
  const id = uid("e_");
  const entry = {
    id,
    ownerId: me.uid,
    type,
    title: "",
    sourceTitle: source?.title || "",
    sourceExtra: source?.extra || "",
    sourceUrl: source?.url || "",
    initialNote: String(initialNote || "").trim(),
    emotionTags: emotionTags || [],
    bodyFeelings: bodyFeelings || [],
    notes: [], // 대화 중 저장한 생각 메모
    photoIds: photoIds || [], // 손글씨·장면 사진 (IndexedDB 에 따로 저장)
    status: "idea", // idea | chatting | writing | completed
    /* 서랍이 둘이다 (기획서 16절의 '공개 범위'를 학생이 고르는 형태)
       class   — 수업 서랍. 선생님이 보게 될 자리
       private — 내 서랍. 나만 본다
       잠그는 게 아니라 처음부터 공간을 나눠서, 비공개가 특별한 행동이 되지 않게 한다. */
    visibility: visibility === "private" ? "private" : "class",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  commit({ ...state, entries: { ...state.entries, [id]: entry } });
  return entry;
}

export function getEntry(id) {
  return own(state.entries[id]);
}

export function updateEntry(id, patch) {
  const cur = own(state.entries[id]);
  if (!cur) throw new Error("기록을 찾을 수 없어요.");
  const next = { ...cur, ...patch, id: cur.id, ownerId: cur.ownerId, updatedAt: nowIso() };
  commit({ ...state, entries: { ...state.entries, [id]: next } });
  return next;
}

export function addEntryNote(id, text) {
  const cur = own(state.entries[id]);
  if (!cur) throw new Error("기록을 찾을 수 없어요.");
  const notes = [...(cur.notes || []), { id: uid("n_"), text: String(text).trim(), createdAt: nowIso() }];
  return updateEntry(id, { notes });
}

export function deleteEntry(id) {
  const cur = own(state.entries[id]);
  if (!cur) return;
  deletePhotos(cur.photoIds || []); // 사진도 함께 지운다
  const entries = { ...state.entries };
  delete entries[id];
  const drop = (coll) =>
    Object.fromEntries(Object.entries(coll).filter(([, d]) => d.entryId !== id));
  commit({
    ...state,
    entries,
    conversations: drop(state.conversations),
    thinkingCards: drop(state.thinkingCards),
    drafts: drop(state.drafts),
  });
}

export function listEntries({ type, status, query, visibility } = {}) {
  const me = currentUser();
  if (!me) return [];
  let rows = Object.values(state.entries).filter((e) => e.ownerId === me.uid);
  if (type) rows = rows.filter((e) => e.type === type);
  if (status) rows = rows.filter((e) => e.status === status);
  if (visibility) rows = rows.filter((e) => (e.visibility || "class") === visibility);
  if (query) {
    const q = query.trim().toLowerCase();
    rows = rows.filter((e) => searchHaystack(e).includes(q));
  }
  return rows.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

/* 검색 대상: 기록 원문·출처뿐 아니라 대화 중 메모, 생각 카드 키워드,
   쓰고 있는 글의 제목과 본문까지 함께 훑는다. */
function searchHaystack(entry) {
  const me = currentUser();
  const card = Object.values(state.thinkingCards).find(
    (c) => c.ownerId === me.uid && c.entryId === entry.id
  );
  const draft = Object.values(state.drafts).find(
    (d) => d.ownerId === me.uid && d.entryId === entry.id
  );
  return [
    entry.title,
    entry.initialNote,
    entry.sourceTitle,
    entry.sourceExtra,
    ...(entry.notes || []).map((n) => n.text),
    ...(card?.studentWords?.coreKeywords || []),
    ...(card?.studentWords?.memorableScenes || []),
    draft?.title,
    draft?.content,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

/* ---------------- conversations ---------------- */

export function startConversation(entryId) {
  const me = requireUser();
  const entry = own(state.entries[entryId]);
  if (!entry) throw new Error("기록을 찾을 수 없어요.");

  const existing = Object.values(state.conversations).find(
    (c) => c.ownerId === me.uid && c.entryId === entryId && c.status === "open"
  );
  if (existing) return existing;

  const id = uid("c_");
  const conv = {
    id,
    ownerId: me.uid,
    entryId,
    mode: entry.type,
    status: "open", // open | completed
    messages: [],
    createdAt: nowIso(),
    completedAt: null,
  };
  commit({
    ...state,
    conversations: { ...state.conversations, [id]: conv },
    entries: {
      ...state.entries,
      [entryId]: { ...entry, status: entry.status === "idea" ? "chatting" : entry.status },
    },
  });
  return conv;
}

export function getConversation(id) {
  return own(state.conversations[id]);
}

export function conversationOfEntry(entryId) {
  const me = currentUser();
  if (!me) return null;
  const rows = Object.values(state.conversations)
    .filter((c) => c.ownerId === me.uid && c.entryId === entryId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return rows[0] || null;
}

export function appendMessage(convId, { role, content, meta }) {
  const cur = own(state.conversations[convId]);
  if (!cur) throw new Error("대화를 찾을 수 없어요.");
  const msg = {
    id: uid("m_"),
    role, // "student" | "assistant" | "system"
    content: String(content),
    meta: meta || null,
    createdAt: nowIso(),
  };
  const next = { ...cur, messages: [...cur.messages, msg] };
  commit({ ...state, conversations: { ...state.conversations, [convId]: next } });
  return msg;
}

export function completeConversation(convId) {
  const cur = own(state.conversations[convId]);
  if (!cur) return null;
  const next = { ...cur, status: "completed", completedAt: nowIso() };
  commit({ ...state, conversations: { ...state.conversations, [convId]: next } });
  return next;
}

/* ---------------- thinkingCards ---------------- */

export function saveThinkingCard(entryId, card) {
  const me = requireUser();
  const entry = own(state.entries[entryId]);
  if (!entry) throw new Error("기록을 찾을 수 없어요.");
  const prev = Object.values(state.thinkingCards).find(
    (c) => c.ownerId === me.uid && c.entryId === entryId
  );
  const id = prev?.id || uid("card_");
  const doc = {
    id,
    ownerId: me.uid,
    entryId,
    ...card,
    createdAt: prev?.createdAt || nowIso(),
    updatedAt: nowIso(),
  };
  commit({ ...state, thinkingCards: { ...state.thinkingCards, [id]: doc } });
  return doc;
}

export function cardOfEntry(entryId) {
  const me = currentUser();
  if (!me) return null;
  return (
    Object.values(state.thinkingCards).find((c) => c.ownerId === me.uid && c.entryId === entryId) ||
    null
  );
}

export function listCards() {
  const me = currentUser();
  if (!me) return [];
  return Object.values(state.thinkingCards).filter((c) => c.ownerId === me.uid);
}

/* ---------------- drafts ---------------- */

export function draftOfEntry(entryId) {
  const me = currentUser();
  if (!me) return null;
  return Object.values(state.drafts).find((d) => d.ownerId === me.uid && d.entryId === entryId) || null;
}

export function ensureDraft(entryId) {
  const me = requireUser();
  const found = draftOfEntry(entryId);
  if (found) return found;
  const entry = own(state.entries[entryId]);
  if (!entry) throw new Error("기록을 찾을 수 없어요.");
  const id = uid("d_");
  const draft = {
    id,
    ownerId: me.uid,
    entryId,
    title: "",
    content: "",
    version: 1,
    versions: [],
    status: "writing", // writing | completed
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  commit({
    ...state,
    drafts: { ...state.drafts, [id]: draft },
    entries: { ...state.entries, [entryId]: { ...entry, status: "writing", updatedAt: nowIso() } },
  });
  return draft;
}

export function saveDraft(draftId, patch) {
  const cur = own(state.drafts[draftId]);
  if (!cur) throw new Error("글을 찾을 수 없어요.");
  const next = { ...cur, ...patch, id: cur.id, ownerId: cur.ownerId, updatedAt: nowIso() };
  commit({ ...state, drafts: { ...state.drafts, [draftId]: next } });
  return next;
}

/* 지금 내용을 이전 버전으로 남긴다 (기획서 6.4 '이전 버전 보기') */
export function snapshotDraft(draftId) {
  const cur = own(state.drafts[draftId]);
  if (!cur) return null;
  if (!cur.content.trim()) return cur;
  const last = cur.versions[cur.versions.length - 1];
  if (last && last.content === cur.content) return cur;
  const versions = [
    ...cur.versions,
    { version: cur.version, title: cur.title, content: cur.content, savedAt: nowIso() },
  ].slice(-20);
  return saveDraft(draftId, { versions, version: cur.version + 1 });
}

export function completeDraft(draftId) {
  const cur = own(state.drafts[draftId]);
  if (!cur) return null;
  const entry = state.entries[cur.entryId];
  const next = { ...cur, status: "completed", updatedAt: nowIso() };
  commit({
    ...state,
    drafts: { ...state.drafts, [draftId]: next },
    entries: entry
      ? { ...state.entries, [entry.id]: { ...entry, status: "completed", updatedAt: nowIso() } }
      : state.entries,
  });
  return next;
}

export function reopenDraft(draftId) {
  const cur = own(state.drafts[draftId]);
  if (!cur) return null;
  const entry = state.entries[cur.entryId];
  const next = { ...cur, status: "writing", updatedAt: nowIso() };
  commit({
    ...state,
    drafts: { ...state.drafts, [draftId]: next },
    entries: entry
      ? { ...state.entries, [entry.id]: { ...entry, status: "writing", updatedAt: nowIso() } }
      : state.entries,
  });
  return next;
}

export function listDrafts() {
  const me = currentUser();
  if (!me) return [];
  return Object.values(state.drafts)
    .filter((d) => d.ownerId === me.uid)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

/* ---------------- 내보내기 (기획서 16절 — 내 데이터 가져가기) ---------------- */

export function exportMyData() {
  const me = requireUser();
  const mine = (coll) => Object.values(coll).filter((d) => d.ownerId === me.uid);
  return {
    exportedAt: nowIso(),
    user: { displayName: me.displayName, createdAt: me.createdAt },
    entries: mine(state.entries),
    conversations: mine(state.conversations),
    thinkingCards: mine(state.thinkingCards),
    drafts: mine(state.drafts),
  };
}
