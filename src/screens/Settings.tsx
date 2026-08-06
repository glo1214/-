import type { Profile } from "../types";
import { DEFAULT_PROFILE, resetAll } from "../lib/storage";

/** 설정 — profile 항목 전부를 화면에서 수정. v1의 숨은 목표:
 *  학생마다 앱을 새로 만들지 않고 이 값만 바꿔 쓴다. */
export function Settings({
  profile,
  updateProfile,
}: {
  profile: Profile;
  updateProfile: (p: Profile) => void;
}) {
  const set = (patch: Partial<Profile>) => updateProfile({ ...profile, ...patch });

  return (
    <div className="screen">
      <h2>설정</h2>

      <label className="field">
        <span>시험일 (D-day 역산 표시용)</span>
        <input
          type="date"
          value={profile.examDate ?? ""}
          onChange={(e) => set({ examDate: e.target.value || null })}
        />
      </label>

      <div className="row" style={{ gap: 12 }}>
        <label className="field" style={{ flex: 1 }}>
          <span>하루 새 단어</span>
          <input
            type="number"
            min={0}
            value={profile.dailyNew}
            onChange={(e) => set({ dailyNew: Math.max(0, Number(e.target.value)) })}
          />
        </label>
        <label className="field" style={{ flex: 1 }}>
          <span>하루 복습 상한</span>
          <input
            type="number"
            min={0}
            value={profile.dailyReviewCap}
            onChange={(e) => set({ dailyReviewCap: Math.max(0, Number(e.target.value)) })}
          />
        </label>
      </div>

      <h3 style={{ marginTop: 12 }}>응답시간 판정 (ms)</h3>
      <div className="small muted" style={{ marginBottom: 10 }}>
        fast 미만이면 바로 승급, fast~slow는 승급하되 weak 표시, slow 초과면 승급 보류.
      </div>
      <div className="row" style={{ gap: 12 }}>
        <label className="field" style={{ flex: 1 }}>
          <span>fast</span>
          <input
            type="number"
            min={0}
            step={100}
            value={profile.timeThreshold.fast}
            onChange={(e) =>
              set({ timeThreshold: { ...profile.timeThreshold, fast: Number(e.target.value) } })
            }
          />
        </label>
        <label className="field" style={{ flex: 1 }}>
          <span>slow</span>
          <input
            type="number"
            min={0}
            step={100}
            value={profile.timeThreshold.slow}
            onChange={(e) =>
              set({ timeThreshold: { ...profile.timeThreshold, slow: Number(e.target.value) } })
            }
          />
        </label>
      </div>

      <h3 style={{ marginTop: 12 }}>출제 카드</h3>
      <label className="toggle" style={{ marginBottom: 8 }}>
        <input
          type="checkbox"
          checked={profile.cardsEnabled.card1}
          onChange={(e) => set({ cardsEnabled: { ...profile.cardsEnabled, card1: e.target.checked } })}
        />
        카드 1 · 영단어 → 뜻
      </label>
      <label className="toggle" style={{ marginBottom: 8 }}>
        <input
          type="checkbox"
          checked={profile.cardsEnabled.card2}
          onChange={(e) => set({ cardsEnabled: { ...profile.cardsEnabled, card2: e.target.checked } })}
        />
        카드 2 · 한글 문장 빈칸
      </label>
      <label className="toggle" style={{ marginBottom: 16 }}>
        <input
          type="checkbox"
          checked={profile.cardsEnabled.card3}
          onChange={(e) => set({ cardsEnabled: { ...profile.cardsEnabled, card3: e.target.checked } })}
        />
        카드 3 · 문맥 속 뜻 (splitBox 단어)
      </label>

      <h3 style={{ marginTop: 12 }}>비계 (스캐폴딩)</h3>
      <label className="toggle" style={{ marginBottom: 8 }}>
        <input
          type="checkbox"
          checked={profile.useEtymology}
          onChange={(e) => set({ useEtymology: e.target.checked })}
        />
        어원 카드 표시 (오답 시)
      </label>
      <label className="toggle" style={{ marginBottom: 16 }}>
        <input
          type="checkbox"
          checked={profile.useKoPron}
          onChange={(e) => set({ useKoPron: e.target.checked })}
        />
        한글 발음 표기 (박스 3부터는 자동 숨김)
      </label>

      <div className="row" style={{ marginTop: 8 }}>
        <button className="btn" onClick={() => updateProfile({ ...DEFAULT_PROFILE })}>
          기본값으로
        </button>
        <button
          className="btn danger"
          onClick={() => {
            if (confirm("모든 진행 상황과 단어장을 초기화할까요?")) {
              resetAll();
              location.reload();
            }
          }}
        >
          전체 초기화
        </button>
      </div>
    </div>
  );
}
