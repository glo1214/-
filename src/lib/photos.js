/* ------------------------------------------------------------------
   사진 저장 — 손글씨 메모, 책 한 쪽, 눈에 띈 장면

   사진은 localStorage 에 넣으면 안 된다. 용량이 5MB 남짓이라
   몇 장만 넣어도 꽉 차서 다른 기록까지 저장이 실패한다.
   그래서 사진만 IndexedDB 에 따로 둔다.

   올리기 전에 긴 변 1280px, JPEG 품질 0.82 로 줄인다.
   손글씨를 읽는 데는 충분하고, 한 장이 보통 150~300KB 로 떨어진다.
------------------------------------------------------------------ */

import { uid, nowIso } from "./id.js";

const DB_NAME = "gloon-photos";
const STORE = "photos";
const MAX_EDGE = 1280;
const QUALITY = 0.82;

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("이 브라우저에서는 사진을 저장할 수 없어요."));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(mode, run) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const store = t.objectStore(STORE);
        let result;
        try {
          result = run(store);
        } catch (e) {
          reject(e);
          return;
        }
        t.oncomplete = () => resolve(result?.result ?? result);
        t.onerror = () => reject(t.error);
      })
  );
}

/* 큰 사진을 화면에 쓸 만한 크기로 줄인다 */
function downscale(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff"; // 투명 배경(PNG)이 검게 나오지 않도록
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      resolve({ dataUrl: canvas.toDataURL("image/jpeg", QUALITY), width: w, height: h });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("사진을 읽지 못했어요."));
    };
    img.src = url;
  });
}

/**
 * 사진 한 장을 저장하고 id 를 돌려준다.
 * ownerId 를 함께 넣어 다른 계정의 사진이 섞이지 않게 한다.
 */
export async function savePhoto(file, ownerId) {
  if (!file || !String(file.type || "").startsWith("image/")) {
    throw new Error("사진 파일만 올릴 수 있어요.");
  }
  const { dataUrl, width, height } = await downscale(file);
  const id = uid("p_");
  await tx("readwrite", (store) =>
    store.put({ id, ownerId, dataUrl, width, height, createdAt: nowIso() })
  );
  return id;
}

export async function getPhoto(id, ownerId) {
  if (!id) return null;
  const row = await tx("readonly", (store) => store.get(id));
  const photo = row && typeof row === "object" && "dataUrl" in row ? row : null;
  if (!photo) return null;
  if (photo.ownerId && photo.ownerId !== ownerId) return null; // 남의 사진은 돌려주지 않는다
  return photo;
}

export async function deletePhoto(id) {
  if (!id) return;
  await tx("readwrite", (store) => store.delete(id));
}

export async function deletePhotos(ids = []) {
  for (const id of ids) await deletePhoto(id);
}

/* 계정 삭제·기록 전체 삭제 때 함께 지운다 */
export async function deletePhotosOfOwner(ownerId) {
  const db = await openDb();
  return new Promise((resolve) => {
    const t = db.transaction(STORE, "readwrite");
    const store = t.objectStore(STORE);
    const req = store.openCursor();
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor) return;
      if (cursor.value?.ownerId === ownerId) cursor.delete();
      cursor.continue();
    };
    t.oncomplete = () => resolve();
    t.onerror = () => resolve();
  });
}
