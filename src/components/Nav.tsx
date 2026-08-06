import type { Screen } from "../App";

const TABS: { id: Screen; label: string; ic: string }[] = [
  { id: "home", label: "홈", ic: "🏠" },
  { id: "study", label: "학습", ic: "✏️" },
  { id: "deck", label: "단어장", ic: "📚" },
  { id: "settings", label: "설정", ic: "⚙️" },
];

export function Nav({ screen, go }: { screen: Screen; go: (s: Screen) => void }) {
  return (
    <div className="nav">
      {TABS.map((t) => (
        <button key={t.id} className={screen === t.id ? "active" : ""} onClick={() => go(t.id)}>
          <span className="ic">{t.ic}</span>
          {t.label}
        </button>
      ))}
    </div>
  );
}
