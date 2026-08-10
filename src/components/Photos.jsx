/* ------------------------------------------------------------------
   사진 첨부 — 손글씨 메모, 책 한 쪽, 눈에 띈 장면

   사진은 이 기기 안에만 저장된다. AI 서버로 보내지 않는다.
   (대화는 학생이 사진을 보고 쓴 말로 진행된다 — VTS 방식과 같다)
------------------------------------------------------------------ */

import { useEffect, useRef, useState } from "react";
import { currentUser } from "../lib/store.js";
import { deletePhoto, getPhoto, savePhoto } from "../lib/photos.js";
import { Button } from "./common.jsx";

/* 저장된 사진 한 장을 보여준다 */
export function Photo({ id, className = "", onClick }) {
  const [src, setSrc] = useState(null);
  const me = currentUser();

  useEffect(() => {
    let alive = true;
    getPhoto(id, me?.uid)
      .then((p) => alive && setSrc(p?.dataUrl || null))
      .catch(() => alive && setSrc(null));
    return () => {
      alive = false;
    };
  }, [id, me?.uid]);

  if (!src) {
    return <div className={`animate-pulse rounded-xl2 bg-paper-sand ${className}`} />;
  }
  return (
    <img
      src={src}
      alt=""
      onClick={onClick}
      className={`rounded-xl2 border border-line object-cover ${onClick ? "cursor-zoom-in" : ""} ${className}`}
    />
  );
}

/* 사진 목록 + 추가/삭제 */
export function PhotoField({ photoIds = [], onChange, hint }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [zoom, setZoom] = useState(null);
  const inputRef = useRef(null);
  const me = currentUser();

  async function add(files) {
    if (!files?.length) return;
    setBusy(true);
    setError("");
    try {
      const ids = [];
      for (const file of Array.from(files).slice(0, 4)) {
        ids.push(await savePhoto(file, me.uid));
      }
      onChange([...photoIds, ...ids].slice(0, 8));
    } catch (e) {
      setError(e.message || "사진을 저장하지 못했어요.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove(id) {
    deletePhoto(id);
    onChange(photoIds.filter((p) => p !== id));
  }

  return (
    <div>
      {photoIds.length ? (
        <ul className="mb-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photoIds.map((id) => (
            <li key={id} className="relative">
              <Photo id={id} className="aspect-square w-full" onClick={() => setZoom(id)} />
              <button
                onClick={() => remove(id)}
                aria-label="사진 빼기"
                className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-line bg-paper-card text-ink-500 shadow-card hover:text-ink-900"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => add(e.target.files)}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={busy || photoIds.length >= 8}
      >
        {busy ? "올리는 중…" : photoIds.length ? "사진 더 넣기" : "사진 넣기"}
      </Button>
      <p className="mt-1.5 text-xs text-ink-400">
        {hint || "손글씨 메모나 눈에 띈 장면을 찍어 넣어도 돼요."} 사진은 이 기기에만 저장돼요.
      </p>
      {error ? <p className="mt-1 text-sm text-rust">{error}</p> : null}

      {zoom ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/70 p-4"
          onClick={() => setZoom(null)}
        >
          <Photo id={zoom} className="max-h-[85vh] max-w-full object-contain" />
        </div>
      ) : null}
    </div>
  );
}
