/* ------------------------------------------------------------------
   앱 셸 — 해시 라우팅, 로그인 게이트, 레이아웃

   해시 라우팅을 쓰는 이유: Vercel·Netlify 어디에 올려도 새로고침이
   깨지지 않고, 별도의 서버 리라이트 설정이 필요 없다.
------------------------------------------------------------------ */

import { useEffect, useState } from "react";
import { useDb, currentUser } from "./lib/store.js";
import { Sidebar, TabBar } from "./components/Nav.jsx";
import { Auth } from "./screens/Auth.jsx";
import { Home } from "./screens/Home.jsx";
import { Collect } from "./screens/Collect.jsx";
import { NewEntry } from "./screens/NewEntry.jsx";
import { EntryDetail } from "./screens/EntryDetail.jsx";
import { Chat } from "./screens/Chat.jsx";
import { CardView } from "./screens/CardView.jsx";
import { Write } from "./screens/Write.jsx";
import { Submit } from "./screens/Submit.jsx";
import { Library } from "./screens/Library.jsx";
import { InterestMap } from "./screens/InterestMap.jsx";
import { Settings } from "./screens/Settings.jsx";

function parseHash() {
  const raw = window.location.hash.replace(/^#\/?/, "");
  const [path, query = ""] = raw.split("?");
  const parts = path.split("/").filter(Boolean);
  return {
    name: parts[0] || "home",
    id: parts[1] || null,
    query: Object.fromEntries(new URLSearchParams(query)),
  };
}

export function navigate(to) {
  window.location.hash = `#/${to}`.replace("#//", "#/");
}

export default function App() {
  const db = useDb();
  const user = currentUser();
  const [route, setRoute] = useState(parseHash);

  useEffect(() => {
    const onHash = () => {
      setRoute(parseHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  if (!user) return <Auth />;

  /* 하단 탭에서 강조할 항목 */
  const tabFor = {
    home: "home",
    collect: "collect",
    new: "collect",
    entry: "collect",
    chat: "chat",
    card: "chat",
    write: "write",
    submit: "write",
    map: "map",
    library: "collect",
    settings: "home",
  };

  const screen = renderScreen(route, user, db);

  return (
    <div className="flex min-h-full">
      <Sidebar
        current={route.name}
        userName={user.displayName}
        onNavigate={(id) => navigate(id)}
      />
      <div className="min-w-0 flex-1">
        {/* 글쓰기 화면만 카드와 에디터를 나란히 두려고 더 넓게 쓴다 */}
        <main
          className={`mx-auto w-full px-4 pb-28 pt-5 md:px-8 md:pb-12 md:pt-8 ${
            route.name === "write" ? "max-w-5xl" : "max-w-3xl"
          }`}
        >
          {screen}
        </main>
      </div>
      <TabBar current={tabFor[route.name] || "home"} onNavigate={(id) => navigate(id)} />
    </div>
  );
}

function renderScreen(route, user) {
  switch (route.name) {
    case "collect":
      return <Collect />;
    case "new":
      return <NewEntry initialType={route.query.type} />;
    case "entry":
      return <EntryDetail entryId={route.id} />;
    case "chat":
      return <Chat entryId={route.id} />;
    case "card":
      return <CardView entryId={route.id} />;
    case "write":
      return <Write entryId={route.id} />;
    case "submit":
      return <Submit entryId={route.id} />;
    case "library":
      return <Library />;
    case "map":
      return <InterestMap />;
    case "settings":
      return <Settings />;
    case "home":
    default:
      return <Home user={user} />;
  }
}
