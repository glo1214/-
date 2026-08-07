import React, { useState } from "react";
import { useStore } from "./lib/useStore.js";
import { dueReviews } from "./lib/storage.js";
import TabBar from "./components/TabBar.jsx";
import Today from "./screens/Today.jsx";
import Review from "./screens/Review.jsx";
import Stats from "./screens/Stats.jsx";
import Settings from "./screens/Settings.jsx";

export default function App() {
  const state = useStore();
  const [tab, setTab] = useState("today");
  const dueCount = dueReviews().length;

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-10 bg-ink-900/90 backdrop-blur border-b border-line">
        <div className="max-w-md mx-auto px-4 h-12 flex items-center gap-2">
          <span className="font-serif text-lg font-bold text-brand">Think</span>
          <span className="text-sm text-muted font-medium">in English</span>
          <span className="ml-auto text-[11px] text-ink-500">영어로 생각하기</span>
        </div>
      </header>

      <main
        key={tab}
        className="max-w-md mx-auto px-4 pt-4 animate-fadein"
        style={{ paddingBottom: "calc(72px + env(safe-area-inset-bottom))" }}
      >
        {tab === "today" && <Today />}
        {tab === "review" && <Review />}
        {tab === "stats" && <Stats />}
        {tab === "settings" && <Settings />}
      </main>

      <TabBar tab={tab} onChange={setTab} dueCount={dueCount} />
    </div>
  );
}
