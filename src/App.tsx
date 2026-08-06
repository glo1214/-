import { useState } from "react";
import type { Deck, Profile, ProgressMap } from "./types";
import {
  loadDecks,
  loadProfile,
  loadProgress,
  saveDecks,
  saveProfile,
  saveProgress,
} from "./lib/storage";
import { Nav } from "./components/Nav";
import { Home } from "./screens/Home";
import { Study } from "./screens/Study";
import { DeckScreen } from "./screens/Deck";
import { Settings } from "./screens/Settings";

export type Screen = "home" | "study" | "deck" | "settings";

export default function App() {
  const [profile, setProfile] = useState<Profile>(loadProfile);
  const [decks, setDecks] = useState<Deck[]>(loadDecks);
  const [progress, setProgress] = useState<ProgressMap>(loadProgress);
  const [screen, setScreen] = useState<Screen>("home");
  // 학습 세션을 새로 시작할 때마다 Study를 리마운트시키는 키
  const [sessionKey, setSessionKey] = useState(0);

  const updateProfile = (p: Profile) => {
    setProfile(p);
    saveProfile(p);
  };
  const updateDecks = (d: Deck[]) => {
    setDecks(d);
    saveDecks(d);
  };
  const commitProgress = (m: ProgressMap) => {
    setProgress(m);
    saveProgress(m);
  };

  const startStudy = () => {
    setSessionKey((k) => k + 1);
    setScreen("study");
  };

  return (
    <div className="app">
      {screen === "home" && (
        <Home profile={profile} decks={decks} progress={progress} onStart={startStudy} />
      )}
      {screen === "study" && (
        <Study
          key={sessionKey}
          profile={profile}
          decks={decks}
          progress={progress}
          commitProgress={commitProgress}
          onHome={() => setScreen("home")}
        />
      )}
      {screen === "deck" && <DeckScreen decks={decks} updateDecks={updateDecks} />}
      {screen === "settings" && (
        <Settings profile={profile} updateProfile={updateProfile} />
      )}
      <Nav
        screen={screen}
        go={(s) => (s === "study" ? startStudy() : setScreen(s))}
      />
    </div>
  );
}
