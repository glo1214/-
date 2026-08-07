import React from "react";
import { Icon } from "./common.jsx";

const TABS = [
  { id: "today", label: "오늘", icon: "pen" },
  { id: "review", label: "복습", icon: "book" },
  { id: "stats", label: "분석", icon: "chart" },
  { id: "settings", label: "설정", icon: "gear" },
];

export default function TabBar({ tab, onChange, dueCount = 0 }) {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-20 bg-ink-800/95 backdrop-blur border-t border-line"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="max-w-md mx-auto grid grid-cols-4">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={`relative flex flex-col items-center gap-1 py-2.5 transition ${
                active ? "text-brand" : "text-muted hover:text-gray-300"
              }`}
            >
              <div className="relative">
                <Icon name={t.icon} size={22} />
                {t.id === "review" && dueCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-warm text-ink-900 text-[10px] font-bold grid place-items-center">
                    {dueCount > 99 ? "99+" : dueCount}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-semibold">{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
