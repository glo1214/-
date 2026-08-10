/* 모바일은 하단 탭, 데스크톱은 왼쪽 사이드바 (기획서 11절) */

const ICONS = {
  home: "M4 11.2 12 4l8 7.2M6 10v9h12v-9",
  collect: "M5 5h14v14H5zM8.5 9.5h7M8.5 13.5h4",
  chat: "M5 5h14v10H9l-4 4z",
  write: "M5 19h14M7 15.5 16 6.5l1.8 1.8L8.8 17.3l-2.4.6z",
  map: "M12 4c3 4.2 4.5 6.6 4.5 9a4.5 4.5 0 0 1-9 0c0-2.4 1.5-4.8 4.5-9z",
  library: "M6 4h5v16H6zM13 4h5v16h-5",
  settings: "M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM12 3.5v2M12 18.5v2M20.5 12h-2M5.5 12h-2M18 6l-1.4 1.4M7.4 16.6 6 18M18 18l-1.4-1.4M7.4 7.4 6 6",
};

function Icon({ name, className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`h-5 w-5 ${className}`} aria-hidden="true">
      <path
        d={ICONS[name]}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const TABS = [
  { id: "home", label: "홈" },
  { id: "collect", label: "기록" },
  { id: "chat", label: "대화" },
  { id: "write", label: "글쓰기" },
  { id: "map", label: "나의 지도" },
];

const SIDE = [...TABS, { id: "library", label: "보관함" }, { id: "settings", label: "설정" }];

export function TabBar({ current, onNavigate }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper-card/95 backdrop-blur md:hidden">
      <ul className="mx-auto flex max-w-lg">
        {TABS.map((t) => {
          const active = current === t.id;
          return (
            <li key={t.id} className="flex-1">
              <button
                onClick={() => onNavigate(t.id)}
                className={`flex w-full flex-col items-center gap-1 py-2.5 text-[11px] ${
                  active ? "text-ochre-600" : "text-ink-400"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon name={t.id} />
                {t.label}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}

export function Sidebar({ current, onNavigate, userName }) {
  return (
    <aside className="hidden w-56 shrink-0 border-r border-line bg-paper-soft/60 px-3 py-5 md:block">
      <div className="px-3 pb-5">
        <p className="text-[15px] font-semibold tracking-tight text-ink-900">글로온 생각온</p>
        <p className="mt-0.5 text-xs text-ink-400">{userName ? `${userName}의 기록` : "생각 기록소"}</p>
      </div>
      <ul className="space-y-0.5">
        {SIDE.map((t) => {
          const active = current === t.id;
          return (
            <li key={t.id}>
              <button
                onClick={() => onNavigate(t.id)}
                className={`flex w-full items-center gap-2.5 rounded-xl2 px-3 py-2.5 text-[14px] transition-colors ${
                  active
                    ? "bg-ochre-50 text-ochre-700"
                    : "text-ink-700 hover:bg-paper-sand/70"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon name={t.id} className="h-[18px] w-[18px]" />
                {t.label}
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
