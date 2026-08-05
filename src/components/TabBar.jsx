import React from "react";

const TABS = [
  { id: "home", label: "홈", icon: HomeIcon },
  { id: "sentences", label: "문장", icon: SentenceIcon },
  { id: "deck", label: "단어장", icon: DeckIcon },
  { id: "stats", label: "통계", icon: StatsIcon },
];

export default function TabBar({ tab, onChange, dueCount }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-ink-800/95 backdrop-blur border-t border-line safe-b">
      <div className="max-w-xl mx-auto grid grid-cols-4">
        {TABS.map((t) => {
          const active = tab === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={`relative flex flex-col items-center gap-1 py-2.5 transition ${
                active ? "text-accent-deep" : "text-muted"
              }`}
            >
              <Icon active={active} />
              <span className="text-[11px] font-medium">{t.label}</span>
              {t.id === "home" && dueCount > 0 && (
                <span className="absolute top-1.5 right-[26%] min-w-[16px] h-4 px-1 rounded-full bg-accent text-accent-ink text-[10px] font-bold flex items-center justify-center tnum">
                  {dueCount > 99 ? "99+" : dueCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 2}>
      <path d="M3 10.5 12 3l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 9.5V20h14V9.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function SentenceIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 2}>
      <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
    </svg>
  );
}
function DeckIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 2}>
      <rect x="4" y="4" width="16" height="16" rx="2.5" />
      <path d="M8 9h8M8 13h5" strokeLinecap="round" />
    </svg>
  );
}
function StatsIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 2}>
      <path d="M5 20V10M12 20V4M19 20v-7" strokeLinecap="round" />
    </svg>
  );
}
