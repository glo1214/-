/* ------------------------------------------------------------------
   선화 삽화 — 화면이 글자만으로 채워지지 않게 두는 그림

   외부 이미지 파일이나 CDN 을 쓰지 않고 SVG 로 직접 그린다.
   (오프라인에서도 보이고, 로딩이 밀리지 않고, 색이 테마와 어긋나지 않는다)

   선은 currentColor, 채움은 황토/모래 톤 고정.
------------------------------------------------------------------ */

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

/* 펼친 노트와 연필 — 홈 머리말 */
function Notebook() {
  return (
    <>
      <path d="M10 20c8-4 16-4 22 0 6-4 14-4 22 0v34c-8-4-16-4-22 0-6-4-14-4-22 0z" fill="#FCF6E6" />
      <path d="M10 20c8-4 16-4 22 0 6-4 14-4 22 0v34c-8-4-16-4-22 0-6-4-14-4-22 0z" {...STROKE} />
      <path d="M32 20v34" {...STROKE} />
      <path d="M16 28h10M16 34h10M38 28h10M38 34h7" {...STROKE} strokeWidth="1.2" opacity=".55" />
      <path d="m52 33 8-8 4 4-8 8-5 1z" fill="#EDD59A" />
      <path d="m52 33 8-8 4 4-8 8-5 1z" {...STROKE} />
      <circle cx="20" cy="12" r="1.6" fill="#DEB86A" />
      <circle cx="46" cy="10" r="1.2" fill="#DEB86A" opacity=".7" />
    </>
  );
}

/* 두 개의 말풍선 — 대화 */
function Speech() {
  return (
    <>
      <path d="M8 16h30a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H20l-8 7v-7H8a4 4 0 0 1-4-4V20a4 4 0 0 1 4-4z" fill="#FCF6E6" />
      <path d="M8 16h30a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H20l-8 7v-7H8a4 4 0 0 1-4-4V20a4 4 0 0 1 4-4z" {...STROKE} />
      <path d="M14 24h18M14 29h11" {...STROKE} strokeWidth="1.2" opacity=".55" />
      <path d="M50 30h10a4 4 0 0 1 4 4v9a4 4 0 0 1-4 4h-2v6l-7-6h-1a4 4 0 0 1-4-4v-9a4 4 0 0 1 4-4z" fill="#F6E7C2" />
      <path d="M50 30h10a4 4 0 0 1 4 4v9a4 4 0 0 1-4 4h-2v6l-7-6h-1a4 4 0 0 1-4-4v-9a4 4 0 0 1 4-4z" {...STROKE} />
    </>
  );
}

/* 자라는 싹 — 관심 지도 */
function Sprout() {
  return (
    <>
      <path d="M34 54V28" {...STROKE} />
      <path d="M34 36c-8 0-13-5-13-13 8 0 13 5 13 13z" fill="#F6E7C2" />
      <path d="M34 36c-8 0-13-5-13-13 8 0 13 5 13 13z" {...STROKE} />
      <path d="M34 30c7 0 12-4 12-11-7 0-12 4-12 11z" fill="#FCF6E6" />
      <path d="M34 30c7 0 12-4 12-11-7 0-12 4-12 11z" {...STROKE} />
      <path d="M18 54h32" {...STROKE} />
      <circle cx="52" cy="18" r="1.6" fill="#DEB86A" />
      <circle cx="16" cy="26" r="1.2" fill="#DEB86A" opacity=".7" />
    </>
  );
}

/* 빈 서랍 — 아무것도 없는 목록 */
function Tray() {
  return (
    <>
      <path d="M12 26h44v20a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4z" fill="#F7F2E7" />
      <path d="M12 26h44v20a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4z" {...STROKE} />
      <path d="M12 26 18 16h32l6 10" {...STROKE} />
      <path d="M26 36h16" {...STROKE} strokeWidth="1.2" opacity=".6" />
    </>
  );
}

/* 종이와 펜 — 글쓰기 */
function Paper() {
  return (
    <>
      <path d="M18 10h22l10 10v34a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4V14a4 4 0 0 1 4-4z" fill="#FFFFFF" />
      <path d="M18 10h22l10 10v34a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4V14a4 4 0 0 1 4-4z" {...STROKE} />
      <path d="M40 10v10h10" {...STROKE} />
      <path d="M21 30h20M21 36h20M21 42h12" {...STROKE} strokeWidth="1.2" opacity=".55" />
      <path d="m44 46 12-12 4 4-12 12-5 1z" fill="#EDD59A" />
      <path d="m44 46 12-12 4 4-12 12-5 1z" {...STROKE} />
    </>
  );
}

/* 카드 묶음 — 생각 설계 카드 */
function Cards() {
  return (
    <>
      <rect x="10" y="22" width="34" height="26" rx="4" fill="#F7F2E7" transform="rotate(-8 27 35)" />
      <rect x="10" y="22" width="34" height="26" rx="4" {...STROKE} transform="rotate(-8 27 35)" />
      <rect x="24" y="18" width="34" height="28" rx="4" fill="#FCF6E6" />
      <rect x="24" y="18" width="34" height="28" rx="4" {...STROKE} />
      <path d="M31 27h18M31 33h13" {...STROKE} strokeWidth="1.2" opacity=".6" />
      <circle cx="53" cy="52" r="1.6" fill="#DEB86A" />
    </>
  );
}

const ART = { notebook: Notebook, speech: Speech, sprout: Sprout, tray: Tray, paper: Paper, cards: Cards };

export function Illustration({ name = "tray", className = "h-16 w-16" }) {
  const Art = ART[name] || Tray;
  return (
    <svg viewBox="0 0 68 64" className={`text-clay-500 ${className}`} aria-hidden="true">
      <Art />
    </svg>
  );
}
