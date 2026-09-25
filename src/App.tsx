import { useEffect, useRef, useState } from "react";
import type { Deck, Profile, ProgressMap } from "./types";
import {
  loadDecks,
  loadProfile,
  loadProgress,
  makeBackup,
  readBackup,
  saveDecks,
  saveProfile,
  saveProgress,
} from "./lib/storage";
import { todayKey } from "./lib/date";
import { clearAuth, fetchState, getStoredUser, health, pushState, type User } from "./lib/api";
import { Nav } from "./components/Nav";
import { Home } from "./screens/Home";
import { Study } from "./screens/Study";
import { DeckScreen } from "./screens/Deck";
import { Settings } from "./screens/Settings";
import { Login } from "./screens/Login";
import { Teacher } from "./screens/Teacher";

export type Screen = "home" | "study" | "deck" | "settings";

export default function App() {
  const [profile, setProfile] = useState<Profile>(loadProfile);
  const [decks, setDecks] = useState<Deck[]>(loadDecks);
  const [progress, setProgress] = useState<ProgressMap>(loadProgress);
  const [screen, setScreen] = useState<Screen>("home");
  const [sessionKey, setSessionKey] = useState(0);

  // 인증
  const [user, setUser] = useState<User | null>(getStoredUser);
  const [skipped, setSkipped] = useState(false);
  const [backendUp, setBackendUp] = useState<boolean | null>(getStoredUser() ? true : null);
  const syncReady = useRef(false);
  const pushTimer = useRef<number | undefined>(undefined);

  // 백엔드 존재 여부 감지 (없으면 로그인 화면 건너뛰고 단독 동작)
  useEffect(() => {
    if (user) return;
    health().then(setBackendUp);
  }, [user]);

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

  const restoreWord = (word: string) => {
    const next: ProgressMap = { ...progress };
    let changed = false;
    Object.keys(next).forEach((k) => {
      if (k.startsWith(word + "#")) {
        next[k] = { ...next[k], reps: 0, nextDue: todayKey() };
        changed = true;
      }
    });
    if (changed) commitProgress(next);
  };

  // '안 외워진 단어' 목록에서 외웠다고 표시 → 틀림 기록만 지운다(진도는 유지).
  const clearWrong = (word: string) => {
    const next: ProgressMap = { ...progress };
    let changed = false;
    Object.keys(next).forEach((k) => {
      if (k.startsWith(word + "#") && (next[k].wrongCount > 0 || next[k].weak)) {
        next[k] = { ...next[k], wrongCount: 0, weak: false };
        changed = true;
      }
    });
    if (changed) commitProgress(next);
  };

  const startStudy = () => {
    setSessionKey((k) => k + 1);
    setScreen("study");
  };

  const exportBackup = () => makeBackup(profile, decks, progress);
  const importBackup = (raw: string) => {
    const restored = readBackup(raw);
    updateProfile(restored.profile);
    updateDecks(restored.decks);
    commitProgress(restored.progress);
  };

  /* ---------- 학생 로그인 시: 서버와 동기화 ---------- */
  useEffect(() => {
    syncReady.current = false;
    if (!user || user.role !== "student") return;
    let cancelled = false;
    (async () => {
      try {
        const remote = await fetchState();
        if (cancelled) return;
        if (remote && Array.isArray(remote.decks)) {
          // 서버에 저장된 상태를 우선 적용
          updateProfile(remote.profile);
          updateDecks(remote.decks);
          commitProgress(remote.progress);
        } else {
          // 서버가 비어 있으면 현재 기기 상태를 업로드(계정으로 이전)
          await pushState({ profile, decks, progress });
        }
      } catch (e) {
        console.error("동기화 실패:", (e as Error).message);
      } finally {
        if (!cancelled) syncReady.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line
  }, [user?.id]);

  /* ---------- 변경 시: 디바운스로 서버 저장 ---------- */
  useEffect(() => {
    if (!user || user.role !== "student" || !syncReady.current) return;
    clearTimeout(pushTimer.current);
    pushTimer.current = window.setTimeout(() => {
      pushState({ profile, decks, progress }).catch((e) =>
        console.error("저장 실패:", (e as Error).message),
      );
    }, 1500);
    return () => clearTimeout(pushTimer.current);
    // eslint-disable-next-line
  }, [profile, decks, progress]);

  const onLogout = () => {
    clearAuth();
    setUser(null);
    setSkipped(false);
    syncReady.current = false;
    setScreen("home");
  };

  // 로그인 안 됨: 백엔드가 있으면 로그인 화면, 없으면(정적) 단독 동작
  if (!user) {
    if (backendUp === null) return <div className="app" />; // 감지 중(깜빡임 방지)
    if (backendUp && !skipped) {
      return (
        <div className="app">
          <Login onAuth={(u) => setUser(u)} onSkip={() => setSkipped(true)} />
        </div>
      );
    }
  }

  // 선생님 → 대시보드
  if (user?.role === "teacher") {
    return (
      <div className="app">
        <Teacher me={user} onLogout={onLogout} />
      </div>
    );
  }

  // 학생 또는 오프라인 사용 → 학습 앱
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
      {screen === "deck" && (
        <DeckScreen
          decks={decks}
          updateDecks={updateDecks}
          progress={progress}
          retireAfter={profile.retireAfter}
          restoreWord={restoreWord}
          clearWrong={clearWrong}
        />
      )}
      {screen === "settings" && (
        <Settings
          profile={profile}
          updateProfile={updateProfile}
          exportBackup={exportBackup}
          importBackup={importBackup}
          user={user}
          onLogout={user ? onLogout : undefined}
          onLoginScreen={!user && backendUp ? () => setSkipped(false) : undefined}
        />
      )}
      <Nav screen={screen} go={(s) => (s === "study" ? startStudy() : setScreen(s))} />
    </div>
  );
}
