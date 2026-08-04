import React, { useState, useEffect, useRef, useCallback } from "react";

/* ------------------------------------------------------------------
   재수생 전용 · 공부가 안 될 때 / 밤에 잠이 안 올 때
   답안지(OMR)를 마킹하듯 지금 상태를 고르고, 1·2·3교시로 타고 들어감
------------------------------------------------------------------ */

const C = {
  paper: "#E6EAE6",
  ink: "#1F2A28",
  faint: "#6C7B77",
  line: "rgba(31,42,40,0.10)",
  graphite: "#39424A",
  marker: "#F0D24E",
  body: "#2F7A70",
  feel: "#8A4A67",
  mind: "#3A5A8C",
  night: "#0E1420",
  lamp: "#E9C68A",
  lampDim: "#8C7A61",
};

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Hahmlet:wght@400;600;800&family=IBM+Plex+Sans+KR:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;600&display=swap');
.dp { font-family: 'Hahmlet', 'Nanum Myeongjo', serif; }
.bd { font-family: 'IBM Plex Sans KR', system-ui, sans-serif; }
.mo { font-family: 'IBM Plex Mono', ui-monospace, monospace; font-variant-numeric: tabular-nums; }
@media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
`;

const GRID = {
  backgroundColor: C.paper,
  backgroundImage:
    "repeating-linear-gradient(0deg, rgba(31,42,40,0.055) 0 1px, transparent 1px 22px), repeating-linear-gradient(90deg, rgba(31,42,40,0.055) 0 1px, transparent 1px 22px)",
};

/* ---------------------------- 문항 데이터 ---------------------------- */

const PARTS = ["눈", "머리", "목·어깨", "등·허리", "손목", "속·배", "다리", "가슴"];

const SENSATIONS = [
  "심장이 빨리 뛴다",
  "가슴이 답답하다",
  "숨이 얕다",
  "손이 떨리거나 땀난다",
  "속이 울렁거린다",
  "머리가 멍하다",
  "눈이 뻑뻑하다",
  "몸이 무겁다",
];

const EMOTIONS = [
  "불안",
  "초조",
  "짜증",
  "무기력",
  "우울",
  "죄책감",
  "억울함",
  "조급함",
  "두려움",
  "외로움",
  "창피함",
  "멍함",
];

const THOUGHTS = [
  "이러다 올해도 안 될 것 같다",
  "남들은 다 앞서 가는 것 같다",
  "작년의 나랑 똑같다",
  "이 정도 해서는 택도 없다",
  "시간이 너무 없다",
  "부모님 볼 낯이 없다",
  "나는 원래 머리가 나쁘다",
  "쉬면 큰일 난다",
  "다 놓아버리고 싶다",
  "지금 안 되면 끝이다",
];

const STRETCH = {
  "눈": "6m 밖 한 점을 20초 보기 → 눈을 꽉 감았다 뜨기 5회 → 손바닥으로 눈을 덮고 10초 어둡게 두기.",
  "머리": "관자놀이를 손가락 세 개로 20초 원 그리며 누르기 → 뒷목과 두피 경계선을 엄지로 10초씩 세 군데 누르기.",
  "목·어깨": "어깨를 귀까지 올렸다가 5초 뒤 툭 떨어뜨리기 5회 → 귀를 어깨에 붙이듯 좌우 20초씩 늘리기.",
  "등·허리": "의자 끝에 앉아 등을 둥글게 말았다가 가슴을 열기 10회 → 일어나서 허리 뒤로 젖히고 10초.",
  "손목": "손등을 몸 쪽으로 당겨 15초 → 손바닥을 밀어 15초 → 주먹 쥐었다 펴기 20회.",
  "속·배": "따뜻한 물 반 컵 → 배를 시계 방향으로 문지르며 배로 숨 쉬기 10회. 카페인은 지금 멈추기.",
  "다리": "일어나서 종아리 들었다 내리기 20회 → 벽 짚고 종아리 20초씩 늘리기.",
  "가슴": "양손을 문틀에 대고 가슴을 20초 열기 → 코로 4초 들이마시고 입으로 8초 내쉬기 5회.",
};

const NEXT_STEP = [
  "문제 딱 1개만 풀기",
  "오답 1개 옮겨 적기",
  "단어 10개 보기",
  "인강 5분만 재생",
  "책상 정리하고 5분 타이머",
  "10분 자고 다시 시작",
];

const SHUFFLE_WORDS = [
  "구름", "국자", "양말", "기차", "호수", "바구니", "연필", "고양이", "우산", "자갈",
  "창문", "벽돌", "바다", "솔방울", "접시", "계단", "풍선", "장갑", "모래", "등대",
  "수건", "종이배", "거울", "상자", "조약돌", "시계", "빗자루", "달팽이", "돌담", "밀짚모자",
  "베개", "낙엽", "목도리", "촛불", "열쇠", "유리병", "담요", "눈사람", "우물", "손수레",
];

const PMR = [
  "발가락과 발바닥",
  "종아리",
  "허벅지",
  "엉덩이와 배",
  "양손 주먹",
  "팔 전체",
  "어깨 (귀 쪽으로)",
  "목과 턱",
  "이마와 눈",
];

/* 만져주기 · 여섯 부위 (머리 → 아랫배 순서) */
const TOUCH = [
  { name: "머리", tip: "손바닥 전체를 정수리에 가볍게 얹으세요. 누르지도, 문지르지도 않습니다." },
  { name: "얼굴", tip: "두 손으로 눈과 볼을 덮습니다. 눈꺼풀에 손의 온기만 전해 주세요." },
  { name: "쇄골 아래", tip: "양손을 엇갈려 좌우 쇄골 아래에 얹습니다. 팔 무게만큼만." },
  { name: "가슴 한가운데", tip: "두 손을 포개 가슴 정중앙에 올립니다. 손 아래 심장이 뛰는 걸 그냥 두세요." },
  { name: "윗배", tip: "명치와 배꼽 사이에 손을 얹고, 숨에 따라 손이 오르내리게 둡니다." },
  { name: "아랫배", tip: "배꼽 아래에 두 손을 얹습니다. 숨이 손을 밀어 올리게 두세요." },
];

const TENSION = ["목", "어깨", "턱", "가슴·명치", "배", "허리", "다리", "손끝", "잘 모르겠음"];

const REACTIONS = ["따뜻해짐", "찌릿함", "한숨이 나옴", "눈물이 차오름", "옛 기억이 스침", "별 느낌 없음"];

const PHRASES = ["괜찮아요", "안전해요", "고마워요"];

const RECALL = [
  "도움을 받기 전, 나는 어떤 상태였나요?",
  "누가, 어떤 도움을 주었나요?",
  "그 도움을 받고 나서 나는 어떻게 되었나요?",
];

/* ---------------------------- 소리 ---------------------------- */

function useChime() {
  const ctxRef = useRef(null);
  return useCallback((soft) => {
    try {
      if (!ctxRef.current) {
        const AC = window.AudioContext || window.webkitAudioContext;
        ctxRef.current = new AC();
      }
      const ctx = ctxRef.current;
      if (ctx.state === "suspended") ctx.resume();
      const now = ctx.currentTime;
      const notes = soft ? [523.25, 659.25] : [659.25, 783.99, 987.77];
      notes.forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.value = f;
        const t = now + i * 0.32;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(soft ? 0.12 : 0.3, t + 0.04);
        g.gain.exponentialRampToValueAtTime(0.0008, t + 1.7);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(t);
        o.stop(t + 1.8);
      });
    } catch (e) {
      /* 소리를 못 내도 앱은 계속 동작 */
    }
  }, []);
}

/* ---------------------------- 공통 UI ---------------------------- */

function Bubble({ n, on, onClick, color, label }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 py-2 text-left"
      style={{ color: C.ink }}
    >
      <span
        className="flex items-center justify-center shrink-0 rounded-full mo"
        style={{
          width: 30,
          height: 30,
          fontSize: 12,
          border: `1.5px solid ${on ? color : "rgba(31,42,40,0.3)"}`,
          background: on ? color : "transparent",
          color: on ? "#F4F6F3" : C.faint,
          transition: "background 140ms ease, border-color 140ms ease",
        }}
      >
        {n}
      </span>
      <span
        className="bd"
        style={{
          fontSize: 15,
          fontWeight: on ? 500 : 300,
          backgroundImage: on
            ? `linear-gradient(transparent 62%, ${C.marker} 62%, ${C.marker} 94%, transparent 94%)`
            : "none",
        }}
      >
        {label}
      </span>
    </button>
  );
}

function Sheet({ eyebrow, title, children, foot }) {
  return (
    <div className="w-full">
      {eyebrow && (
        <p className="mo mb-1" style={{ fontSize: 11, letterSpacing: "0.14em", color: C.faint }}>
          {eyebrow}
        </p>
      )}
      {title && (
        <h2 className="dp mb-4" style={{ fontSize: 23, fontWeight: 600, color: C.ink, lineHeight: 1.35 }}>
          {title}
        </h2>
      )}
      {children}
      {foot}
    </div>
  );
}

function Btn({ children, onClick, tone = "ink", disabled }) {
  const bg = tone === "ghost" ? "transparent" : tone === "ink" ? C.ink : tone;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="bd w-full py-3 px-4"
      style={{
        background: disabled ? "rgba(31,42,40,0.15)" : bg,
        color: tone === "ghost" ? C.faint : "#F2F4F1",
        border: tone === "ghost" ? `1px solid ${C.line}` : "none",
        borderRadius: 2,
        fontSize: 15,
        fontWeight: 500,
        cursor: disabled ? "default" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

function Slider({ value, onChange, min = 0, max = 5, labels }) {
  return (
    <div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{ accentColor: C.graphite }}
      />
      <div className="flex justify-between mo" style={{ fontSize: 10, color: C.faint }}>
        {labels.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------- 홈 ---------------------------- */

function Home({ go, count }) {
  const hour = new Date().getHours();
  const night = hour >= 21 || hour < 5;
  return (
    <div className="px-6 py-10">
      <p className="mo" style={{ fontSize: 11, letterSpacing: "0.2em", color: C.faint }}>
        RESET SHEET · 재수생용
      </p>
      <h1 className="dp mt-3" style={{ fontSize: 34, fontWeight: 800, color: C.ink, lineHeight: 1.25 }}>
        지금 안 되는 게<br />몸인지 마음인지<br />생각인지 고르기
      </h1>
      <p className="bd mt-4" style={{ fontSize: 14, color: C.faint, lineHeight: 1.7 }}>
        원인을 찾으면 대처가 달라집니다. 답안지 마킹하듯 고르기만 하면 돼요.
      </p>

      <div className="mt-8 flex flex-col gap-3">
        <button
          onClick={() => go("checkin")}
          className="w-full text-left p-5"
          style={{ background: C.ink, borderRadius: 2 }}
        >
          <span className="mo block" style={{ fontSize: 10, letterSpacing: "0.16em", color: C.marker }}>
            01
          </span>
          <span className="dp block mt-1" style={{ fontSize: 20, fontWeight: 600, color: "#F2F4F1" }}>
            공부가 안 돼요
          </span>
          <span className="bd block mt-1" style={{ fontSize: 13, color: "rgba(242,244,241,0.6)" }}>
            컨디션 체크 → 1·2·3교시로 타고 들어가기
          </span>
        </button>

        <button
          onClick={() => go("nap")}
          className="w-full text-left p-5"
          style={{ background: "#FFFFFF", border: `1px solid ${C.line}`, borderRadius: 2 }}
        >
          <span className="mo block" style={{ fontSize: 10, letterSpacing: "0.16em", color: C.body }}>
            02
          </span>
          <span className="dp block mt-1" style={{ fontSize: 20, fontWeight: 600, color: C.ink }}>
            10분만 자고 올게요
          </span>
          <span className="bd block mt-1" style={{ fontSize: 13, color: C.faint }}>
            깨워주는 알람 + 깨워달라고 부탁하는 말
          </span>
        </button>

        <button
          onClick={() => go("sleep")}
          className="w-full text-left p-5"
          style={{ background: C.night, borderRadius: 2 }}
        >
          <span className="mo block" style={{ fontSize: 10, letterSpacing: "0.16em", color: C.lampDim }}>
            03
          </span>
          <span className="dp block mt-1" style={{ fontSize: 20, fontWeight: 600, color: C.lamp }}>
            밤에 잠이 안 와요
          </span>
          <span className="bd block mt-1" style={{ fontSize: 13, color: "rgba(233,198,138,0.55)" }}>
            호흡 · 만져주기 · 감사하기 {night ? "· 지금이 딱 좋아요" : ""}
          </span>
        </button>

        <button onClick={() => go("log")} className="bd mt-2 py-3" style={{ fontSize: 13, color: C.faint }}>
          지난 기록 보기 ({count})
        </button>
      </div>
    </div>
  );
}

/* ---------------------------- 체크인 ---------------------------- */

const emptyEntry = () => ({
  sleepy: 2,
  parts: [],
  sensations: [],
  emotions: [],
  thoughts: [],
  route: [],
  reframe: "",
  relief: 50,
  next: "",
});

function CheckIn({ onDone, onExit, goNap }) {
  const [step, setStep] = useState(0);
  const [e, setE] = useState(emptyEntry());
  const [branch, setBranch] = useState(null);

  const toggle = (key, v) =>
    setE((p) => ({
      ...p,
      [key]: p[key].includes(v) ? p[key].filter((x) => x !== v) : [...p[key], v],
    }));

  const suggested =
    e.sleepy >= 3 || e.parts.length > 0 || e.sensations.length > 0 ? "body" : null;

  const enter = (b) => {
    setBranch(b);
    setE((p) => ({ ...p, route: p.route.includes(b) ? p.route : [...p.route, b] }));
    setStep(3);
  };

  const meta = {
    body: { name: "몸", color: C.body, no: e.route.indexOf("body") + 1 },
    feel: { name: "감정", color: C.feel, no: e.route.indexOf("feel") + 1 },
    mind: { name: "생각", color: C.mind, no: e.route.indexOf("mind") + 1 },
  };

  /* 0 · 컨디션 */
  if (step === 0)
    return (
      <Wrap onExit={onExit}>
        <Sheet eyebrow="예비 문항 · 컨디션" title="먼저 몸 상태부터 적어요">
          <p className="bd mb-2" style={{ fontSize: 14, color: C.ink }}>
            지금 졸린 정도
          </p>
          <Slider
            value={e.sleepy}
            onChange={(v) => setE((p) => ({ ...p, sleepy: v }))}
            labels={["멀쩡", "", "", "", "", "눈 감김"]}
          />
          <p className="bd mt-7 mb-1" style={{ fontSize: 14, color: C.ink }}>
            아프거나 불편한 곳 (여러 개)
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {PARTS.map((p) => {
              const on = e.parts.includes(p);
              return (
                <button
                  key={p}
                  onClick={() => toggle("parts", p)}
                  className="bd px-3 py-2"
                  style={{
                    fontSize: 13,
                    borderRadius: 2,
                    border: `1px solid ${on ? C.body : C.line}`,
                    background: on ? C.body : "#FFFFFF",
                    color: on ? "#F2F4F1" : C.faint,
                  }}
                >
                  {p}
                </button>
              );
            })}
          </div>
          <div className="mt-8">
            <Btn onClick={() => setStep(1)}>다음</Btn>
          </div>
        </Sheet>
      </Wrap>
    );

  /* 1 · 감각 */
  if (step === 1)
    return (
      <Wrap onExit={onExit}>
        <Sheet eyebrow="예비 문항 · 감각" title="몸에서 느껴지는 것을 고르세요">
          {SENSATIONS.map((s, i) => (
            <Bubble
              key={s}
              n={i + 1}
              label={s}
              on={e.sensations.includes(s)}
              color={C.body}
              onClick={() => toggle("sensations", s)}
            />
          ))}
          <div className="mt-7">
            <Btn onClick={() => setStep(2)}>다음</Btn>
          </div>
        </Sheet>
      </Wrap>
    );

  /* 2 · 분기 */
  if (step === 2)
    return (
      <Wrap onExit={onExit}>
        <Sheet eyebrow="시간표 짜기" title="지금 가장 큰 문제는 어느 쪽인가요?">
          <p className="bd mb-5" style={{ fontSize: 13, color: C.faint, lineHeight: 1.7 }}>
            하나만 고르면 됩니다. 끝나고 나아지지 않으면 다음 교시로 넘어가요.
            {suggested === "body" && (
              <span style={{ color: C.body }}> 지금은 몸부터 보는 게 나아 보여요.</span>
            )}
          </p>
          {[
            ["body", "몸의 문제", "졸림 · 통증 · 두근거림 · 배고픔"],
            ["feel", "감정의 문제", "불안 · 짜증 · 무기력 · 죄책감"],
            ["mind", "생각의 문제", "머릿속 문장이 계속 돌아감"],
          ].map(([k, t, d]) => (
            <button
              key={k}
              onClick={() => enter(k)}
              className="w-full text-left p-4 mb-2"
              style={{
                background: "#FFFFFF",
                borderLeft: `4px solid ${meta[k].color}`,
                border: `1px solid ${C.line}`,
                borderLeftWidth: 4,
                borderLeftColor: meta[k].color,
                borderRadius: 2,
                opacity: e.route.includes(k) ? 0.45 : 1,
              }}
            >
              <span className="dp block" style={{ fontSize: 18, fontWeight: 600, color: C.ink }}>
                {t}
              </span>
              <span className="bd block mt-1" style={{ fontSize: 12.5, color: C.faint }}>
                {d}
              </span>
            </button>
          ))}
          {e.route.length > 0 && (
            <div className="mt-6">
              <Btn tone="ghost" onClick={() => setStep(6)}>
                여기까지 하고 기록 남기기
              </Btn>
            </div>
          )}
        </Sheet>
      </Wrap>
    );

  /* 3 · 갈래별 선택 */
  if (step === 3) {
    const m = meta[branch];
    if (branch === "feel")
      return (
        <Wrap onExit={onExit}>
          <Sheet eyebrow={`${m.no}교시 · 감정`} title="지금 감정에 이름을 붙이면 세기가 줄어요">
            <div className="flex flex-wrap gap-2">
              {EMOTIONS.map((x) => {
                const on = e.emotions.includes(x);
                return (
                  <button
                    key={x}
                    onClick={() => toggle("emotions", x)}
                    className="bd px-3 py-2"
                    style={{
                      fontSize: 14,
                      borderRadius: 2,
                      border: `1px solid ${on ? C.feel : C.line}`,
                      background: on ? C.feel : "#FFFFFF",
                      color: on ? "#F2F4F1" : C.faint,
                    }}
                  >
                    {x}
                  </button>
                );
              })}
            </div>
            <div className="mt-8">
              <Btn tone={C.feel} onClick={() => setStep(4)}>
                다음
              </Btn>
            </div>
          </Sheet>
        </Wrap>
      );
    if (branch === "mind")
      return (
        <Wrap onExit={onExit}>
          <Sheet eyebrow={`${m.no}교시 · 생각`} title="머릿속에서 도는 문장을 고르세요">
            {THOUGHTS.map((t, i) => (
              <Bubble
                key={t}
                n={i + 1}
                label={t}
                on={e.thoughts.includes(t)}
                color={C.mind}
                onClick={() => toggle("thoughts", t)}
              />
            ))}
            <div className="mt-7">
              <Btn tone={C.mind} onClick={() => setStep(4)}>
                다음
              </Btn>
            </div>
          </Sheet>
        </Wrap>
      );
    return <BodyCare e={e} onNext={() => setStep(4)} onExit={onExit} goNap={goNap} />;
  }

  /* 4 · 처방 */
  if (step === 4) {
    if (branch === "feel")
      return <FeelCare e={e} setE={setE} onNext={() => setStep(5)} onExit={onExit} />;
    if (branch === "mind")
      return <MindCare e={e} setE={setE} onNext={() => setStep(5)} onExit={onExit} />;
    return <BodyCare e={e} onNext={() => setStep(5)} onExit={onExit} goNap={goNap} />;
  }

  /* 5 · 얼마나 나아졌나 */
  if (step === 5)
    return (
      <Wrap onExit={onExit}>
        <Sheet eyebrow={`${meta[branch].no}교시 종료`} title="지금은 좀 어떤가요?">
          <div className="mo text-center my-6" style={{ fontSize: 44, color: C.ink }}>
            {e.relief}%
          </div>
          <Slider
            value={e.relief}
            onChange={(v) => setE((p) => ({ ...p, relief: v }))}
            min={0}
            max={100}
            labels={["그대로", "", "많이 나아짐"]}
          />
          <div className="mt-8 flex flex-col gap-2">
            {e.relief < 45 && e.route.length < 3 ? (
              <>
                <p className="bd" style={{ fontSize: 13, color: C.faint, lineHeight: 1.7 }}>
                  아직이라면 원인이 다른 쪽에 있을 수 있어요. 남은 교시로 넘어가 볼까요?
                </p>
                <Btn onClick={() => setStep(2)}>다음 교시로 넘어가기</Btn>
                <Btn tone="ghost" onClick={() => setStep(6)}>
                  괜찮아요, 마무리할게요
                </Btn>
              </>
            ) : (
              <Btn onClick={() => setStep(6)}>마무리하기</Btn>
            )}
          </div>
        </Sheet>
      </Wrap>
    );

  /* 6 · 다음 한 걸음 */
  return (
    <Wrap onExit={onExit}>
      <Sheet eyebrow="복귀" title="딱 5분, 가장 작은 것 하나만">
        <p className="bd mb-4" style={{ fontSize: 13, color: C.faint, lineHeight: 1.7 }}>
          한 번에 원래 페이스로 돌아가려 하면 다시 튕겨나옵니다. 문턱을 낮춰서 시작해요.
        </p>
        {NEXT_STEP.map((s, i) => (
          <Bubble
            key={s}
            n={i + 1}
            label={s}
            on={e.next === s}
            color={C.graphite}
            onClick={() => setE((p) => ({ ...p, next: s }))}
          />
        ))}
        <div className="mt-7">
          <Btn disabled={!e.next} onClick={() => onDone({ ...e, at: Date.now() })}>
            기록하고 돌아가기
          </Btn>
        </div>
      </Sheet>
    </Wrap>
  );
}

function Wrap({ children, onExit }) {
  return (
    <div className="px-6 py-8">
      <button className="mo mb-6" style={{ fontSize: 11, color: C.faint }} onClick={onExit}>
        ← 나가기
      </button>
      {children}
    </div>
  );
}

/* --------------------- 갈래별 처방 --------------------- */

function BodyCare({ e, onNext, onExit, goNap }) {
  return (
    <Wrap onExit={onExit}>
      <Sheet eyebrow="처방 · 몸" title="몸부터 풀어야 머리가 돌아갑니다">
        {e.sleepy >= 3 && (
          <div className="p-4 mb-3" style={{ background: C.body, borderRadius: 2 }}>
            <p className="bd" style={{ fontSize: 14, color: "#F2F4F1", lineHeight: 1.7 }}>
              졸음 {e.sleepy}/5. 버티면 같은 페이지를 세 번 읽게 돼요. 10분만 자고 오는 게 이깁니다.
            </p>
            <button
              onClick={goNap}
              className="bd mt-3 w-full py-2"
              style={{ background: "#F2F4F1", color: C.body, borderRadius: 2, fontSize: 14, fontWeight: 500 }}
            >
              10분 타이머 켜기
            </button>
          </div>
        )}
        {e.parts.map((p) => (
          <div key={p} className="p-4 mb-2" style={{ background: "#FFFFFF", border: `1px solid ${C.line}`, borderRadius: 2 }}>
            <p className="dp" style={{ fontSize: 16, fontWeight: 600, color: C.ink }}>
              {p}
            </p>
            <p className="bd mt-1" style={{ fontSize: 13.5, color: C.faint, lineHeight: 1.75 }}>
              {STRETCH[p]}
            </p>
          </div>
        ))}
        {e.sensations.length > 0 && (
          <div className="p-4 mb-2" style={{ background: "#FFFFFF", border: `1px solid ${C.line}`, borderRadius: 2 }}>
            <p className="dp" style={{ fontSize: 16, fontWeight: 600, color: C.ink }}>
              두근거림 · 답답함
            </p>
            <p className="bd mt-1" style={{ fontSize: 13.5, color: C.faint, lineHeight: 1.75 }}>
              날숨을 들숨보다 길게 하면 심장이 느려집니다. 4초 들이마시고 8초 내쉬기를 열 번. 아래 호흡 화면을 써도 돼요.
            </p>
          </div>
        )}
        {e.parts.length === 0 && e.sensations.length === 0 && e.sleepy < 3 && (
          <p className="bd" style={{ fontSize: 14, color: C.faint, lineHeight: 1.8 }}>
            몸에 큰 신호는 없네요. 그렇다면 물 한 컵 마시고 3분 걷고 오는 정도로 충분합니다.
            그래도 안 풀리면 감정이나 생각 쪽일 확률이 높아요.
          </p>
        )}
        <div className="mt-7">
          <Btn tone={C.body} onClick={onNext}>
            해봤어요
          </Btn>
        </div>
      </Sheet>
    </Wrap>
  );
}

function Breath({ color, cycles = 6, onDone, inhale = 4, hold = 2, exhale = 6 }) {
  const [phase, setPhase] = useState("들이마시기");
  const [left, setLeft] = useState(inhale);
  const [done, setDone] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setLeft((l) => {
        if (l > 1) return l - 1;
        setPhase((p) => {
          if (p === "들이마시기") {
            setLeft(hold);
            return "잠깐 멈추기";
          }
          if (p === "잠깐 멈추기") {
            setLeft(exhale);
            return "천천히 내쉬기";
          }
          setLeft(inhale);
          setDone((d) => d + 1);
          return "들이마시기";
        });
        return l;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [inhale, hold, exhale]);

  useEffect(() => {
    if (done >= cycles && onDone) onDone();
  }, [done, cycles, onDone]);

  const big = phase === "천천히 내쉬기" ? 0.55 : phase === "들이마시기" ? 1 : 0.95;
  return (
    <div className="flex flex-col items-center py-6">
      <div
        style={{
          width: 170,
          height: 170,
          borderRadius: "50%",
          border: `1.5px solid ${color}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${big})`,
          transition: `transform ${phase === "천천히 내쉬기" ? exhale : inhale}s ease-in-out`,
        }}
      >
        <span className="mo" style={{ fontSize: 34, color }}>
          {left}
        </span>
      </div>
      <p className="dp mt-6" style={{ fontSize: 19, color }}>
        {phase}
      </p>
      <p className="mo mt-1" style={{ fontSize: 11, color: C.faint }}>
        {Math.min(done, cycles)} / {cycles}
      </p>
    </div>
  );
}

function FeelCare({ e, setE, onNext, onExit }) {
  const list = e.emotions.length ? e.emotions.join(", ") : "지금의 감정";
  return (
    <Wrap onExit={onExit}>
      <Sheet eyebrow="처방 · 감정" title={`${list}— 없애지 말고 지나가게 두기`}>
        <p className="bd" style={{ fontSize: 13.5, color: C.faint, lineHeight: 1.8 }}>
          감정은 파도처럼 올라왔다 내려갑니다. 밀어내려 할수록 오래 남아요. 60초만 숨에 맞춰 흘려보내요.
        </p>
        <Breath color={C.feel} cycles={5} />
        <div className="p-4" style={{ background: "#FFFFFF", border: `1px solid ${C.line}`, borderRadius: 2 }}>
          <p className="bd mb-2" style={{ fontSize: 13.5, color: C.ink }}>
            이 감정이 나한테 시키려는 행동은 뭔가요? 한 줄로 적어보세요.
          </p>
          <textarea
            value={e.reframe}
            onChange={(ev) => setE((p) => ({ ...p, reframe: ev.target.value }))}
            rows={3}
            placeholder="예) 불안이 나한테 '지금 다 접고 도망가라'고 시킨다. 대신 30분만 해보겠다."
            className="bd w-full p-3"
            style={{ fontSize: 14, border: `1px solid ${C.line}`, borderRadius: 2, background: C.paper, color: C.ink, resize: "none" }}
          />
        </div>
        <div className="mt-6">
          <Btn tone={C.feel} onClick={onNext}>
            다음
          </Btn>
        </div>
      </Sheet>
    </Wrap>
  );
}

const MIND_Q = [
  "그 생각이 100% 사실이라는 증거는 뭔가요? 반대 증거는요?",
  "같은 말을 친구가 한다면, 뭐라고 대답해 줄 건가요?",
  "지금 이 순간 내가 통제할 수 있는 건 딱 하나, 무엇인가요?",
];

function MindCare({ e, setE, onNext, onExit }) {
  const [q, setQ] = useState(0);
  return (
    <Wrap onExit={onExit}>
      <Sheet eyebrow="처방 · 생각" title="생각은 사실이 아니라 문장입니다">
        {e.thoughts.length > 0 && (
          <div className="p-4 mb-5" style={{ background: "#FFFFFF", borderLeft: `4px solid ${C.mind}`, borderRadius: 2 }}>
            {e.thoughts.map((t) => (
              <p key={t} className="dp" style={{ fontSize: 15.5, color: C.ink, lineHeight: 1.8 }}>
                “{t}”
              </p>
            ))}
            <p className="bd mt-2" style={{ fontSize: 12.5, color: C.faint }}>
              앞에 “나는 지금 …라고 생각하고 있다”를 붙여서 다시 읽어보세요. 거리가 생깁니다.
            </p>
          </div>
        )}
        <div className="flex gap-1 mb-3">
          {MIND_Q.map((_, i) => (
            <span key={i} style={{ height: 2, flex: 1, background: i <= q ? C.mind : C.line }} />
          ))}
        </div>
        <p className="dp" style={{ fontSize: 18, color: C.ink, lineHeight: 1.6 }}>
          {MIND_Q[q]}
        </p>
        <div className="mt-4">
          {q < MIND_Q.length - 1 ? (
            <Btn tone={C.mind} onClick={() => setQ(q + 1)}>
              생각해봤어요, 다음 질문
            </Btn>
          ) : (
            <>
              <textarea
                value={e.reframe}
                onChange={(ev) => setE((p) => ({ ...p, reframe: ev.target.value }))}
                rows={3}
                placeholder="바꿔 쓴 문장 한 줄. 예) 작년과 지금은 다르다. 오늘 할 수 있는 건 이 단원 하나다."
                className="bd w-full p-3"
                style={{ fontSize: 14, border: `1px solid ${C.line}`, borderRadius: 2, background: "#FFFFFF", color: C.ink, resize: "none" }}
              />
              <div className="mt-3">
                <Btn tone={C.mind} onClick={onNext}>
                  다음
                </Btn>
              </div>
            </>
          )}
        </div>
      </Sheet>
    </Wrap>
  );
}

/* ---------------------------- 낮잠 ---------------------------- */

function Nap({ onExit }) {
  const [mins, setMins] = useState(10);
  const [left, setLeft] = useState(null);
  const [ringing, setRinging] = useState(false);
  const [copied, setCopied] = useState(false);
  const chime = useChime();

  useEffect(() => {
    if (left === null) return;
    if (left <= 0) {
      setRinging(true);
      return;
    }
    const id = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);

  useEffect(() => {
    if (!ringing) return;
    chime(false);
    if (navigator.vibrate) navigator.vibrate([400, 200, 400]);
    const id = setInterval(() => {
      chime(false);
      if (navigator.vibrate) navigator.vibrate([400, 200, 400]);
    }, 3500);
    return () => clearInterval(id);
  }, [ringing, chime]);

  const wakeAt = new Date(Date.now() + mins * 60000);
  const hhmm = `${wakeAt.getHours()}시 ${String(wakeAt.getMinutes()).padStart(2, "0")}분`;
  const msg = `${mins}분만 잘게요. ${hhmm}에 깨워주세요. 안 일어나면 한 번 더 불러주세요.`;

  const copy = () => {
    try {
      navigator.clipboard.writeText(msg);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      setCopied(false);
    }
  };

  if (ringing)
    return (
      <div className="px-6 py-20 text-center">
        <p className="dp" style={{ fontSize: 30, fontWeight: 700, color: C.ink }}>
          일어날 시간이에요
        </p>
        <p className="bd mt-3" style={{ fontSize: 14, color: C.faint, lineHeight: 1.8 }}>
          바로 일어나서 물 한 모금, 창문 열고 찬 공기 30초.<br />
          여기서 5분 더 자면 오히려 더 무거워집니다.
        </p>
        <div className="mt-8">
          <Btn
            onClick={() => {
              setRinging(false);
              setLeft(null);
              onExit();
            }}
          >
            일어났어요
          </Btn>
        </div>
      </div>
    );

  if (left !== null)
    return (
      <div className="px-6 py-16 text-center">
        <p className="mo" style={{ fontSize: 11, letterSpacing: "0.18em", color: C.faint }}>
          {hhmm} 기상
        </p>
        <p className="mo my-8" style={{ fontSize: 64, color: C.ink }}>
          {String(Math.floor(left / 60)).padStart(2, "0")}:{String(left % 60).padStart(2, "0")}
        </p>
        <p className="bd" style={{ fontSize: 14, color: C.faint, lineHeight: 1.9 }}>
          엎드리지 말고 기대서. 눈만 감고 있어도 효과가 있어요.<br />
          잠이 안 와도 괜찮습니다. 화면은 그대로 두세요.
        </p>
        <div className="mt-10">
          <Btn tone="ghost" onClick={() => setLeft(null)}>
            타이머 끄기
          </Btn>
        </div>
      </div>
    );

  return (
    <Wrap onExit={onExit}>
      <Sheet eyebrow="02 · 파워냅" title="10분은 도망이 아니라 전략입니다">
        <p className="bd" style={{ fontSize: 13.5, color: C.faint, lineHeight: 1.8 }}>
          20분을 넘기면 깊은 잠에 들어가 깰 때 더 힘듭니다. 10분이 가장 안전해요.
        </p>
        <div className="flex gap-2 mt-5">
          {[5, 10, 20].map((m) => (
            <button
              key={m}
              onClick={() => setMins(m)}
              className="mo flex-1 py-3"
              style={{
                fontSize: 15,
                borderRadius: 2,
                border: `1px solid ${mins === m ? C.ink : C.line}`,
                background: mins === m ? C.ink : "#FFFFFF",
                color: mins === m ? "#F2F4F1" : C.faint,
              }}
            >
              {m}분
            </button>
          ))}
        </div>

        <div className="mt-6 p-4" style={{ background: "#FFFFFF", border: `1px solid ${C.line}`, borderRadius: 2 }}>
          <p className="mo" style={{ fontSize: 10, letterSpacing: "0.14em", color: C.faint }}>
            깨워달라고 말하기
          </p>
          <p className="dp mt-2" style={{ fontSize: 16, color: C.ink, lineHeight: 1.7 }}>
            “{msg}”
          </p>
          <button
            onClick={copy}
            className="bd mt-3 w-full py-2"
            style={{ border: `1px solid ${C.line}`, borderRadius: 2, fontSize: 13, color: C.faint }}
          >
            {copied ? "복사됐어요" : "문장 복사하기"}
          </button>
        </div>

        <div className="mt-6">
          <Btn onClick={() => setLeft(mins * 60)}>{mins}분 타이머 시작</Btn>
        </div>
        <p className="bd mt-3 text-center" style={{ fontSize: 11.5, color: C.faint }}>
          시작하면 화면을 켜 둔 채로 두세요. 소리와 진동으로 깨웁니다.
        </p>
      </Sheet>
    </Wrap>
  );
}

/* ---------------------------- 수면 유도 ---------------------------- */

const SLEEP_STEPS = [
  {
    type: "read",
    label: "설명",
    title: "왜 몸은 피곤한데 잠이 안 올까요",
    lines: [
      "잠은 노력해서 드는 게 아니라, 각성이 내려가면 저절로 오는 겁니다.",
      "지금 몸은 누웠지만 머리는 아직 시험장에 있어요. 각성 스위치가 켜져 있는 상태입니다.",
      "그래서 오늘은 ‘자야 한다’를 목표로 하지 않습니다. ‘몸의 긴장을 내린다’만 합니다.",
      "잠이 안 와도 실패가 아니에요. 누워서 몸을 쉬게 하는 것만으로도 내일의 절반은 회복됩니다.",
      "휴대폰은 이 순서가 끝나면 엎어두고, 화면은 지금 최대한 어둡게 해 주세요.",
    ],
  },
  {
    type: "worry",
    label: "1단계",
    title: "걱정을 머리 밖에 내려놓기",
    lines: [
      "머릿속 걱정은 잊으면 안 될까 봐 계속 떠오릅니다. 밖에 적어두면 뇌가 붙잡고 있을 이유가 사라져요.",
      "지금 신경 쓰이는 것과, 그건 내일 몇 시에 처리할지만 적으세요. 해결책은 쓰지 않습니다.",
    ],
  },
  {
    type: "breath",
    label: "2단계",
    title: "숨을 길게 내쉬기",
    lines: [
      "내쉬는 숨이 길어지면 심장 박동이 느려지고, 몸은 ‘안전하다’고 판단합니다.",
      "코로 4초 마시고, 2초 멈추고, 입으로 8초 내쉽니다. 숫자를 따라가기만 하세요.",
    ],
  },
  {
    type: "pmr",
    label: "3단계",
    title: "근육을 조였다 풀기",
    lines: [
      "긴장은 힘을 빼려 할 때보다, 한 번 세게 조였다 놓을 때 더 잘 빠집니다.",
      "부위마다 5초 힘주고, 12초 동안 풀어진 감각을 그대로 느끼세요.",
    ],
  },
  {
    type: "read",
    label: "4단계",
    title: "무겁고 따뜻하게",
    slow: true,
    lines: [
      "오른팔이 무겁다. 아주 무겁다.",
      "왼팔이 무겁다. 팔이 이불 속으로 가라앉는다.",
      "두 다리가 무겁고 따뜻하다.",
      "숨이 저절로 편안하게 오간다.",
      "이마는 시원하고, 몸은 따뜻하다.",
      "나는 지금 아주 조용하다.",
    ],
  },
  {
    type: "shuffle",
    label: "5단계",
    title: "생각을 흐트러뜨리기",
    lines: [
      "잠들기 직전의 뇌는 서로 상관없는 이미지를 떠올립니다. 그 상태를 일부러 만들어 주는 방법이에요.",
      "단어가 하나씩 나옵니다. 그 모습을 5초쯤 그려보고, 다음 단어로 넘어가세요. 의미는 찾지 마세요.",
    ],
  },
  {
    type: "read",
    label: "마무리",
    title: "여기까지 하고 눈을 감으세요",
    slow: true,
    lines: [
      "이제 화면을 끄고 폰을 엎어두세요.",
      "20분쯤 지나도 말똥말똥하면, 침대에서 나와 어두운 곳에서 지루한 것을 하다가 졸릴 때 다시 누우세요.",
      "침대에서 뒤척이는 시간이 길어지면, 뇌가 침대를 ‘깨어 있는 곳’으로 기억합니다.",
      "몇 시에 잠들었든 내일 아침 기상 시간은 그대로 두세요. 그래야 다음 밤이 쉬워집니다.",
      "잘 자요. 오늘 하루도 어떻게든 버텨냈잖아요.",
    ],
  },
];

function SleepProgram({ onExit, nights, addNight }) {
  const [dim, setDim] = useState(0.25);
  const [mode, setMode] = useState(null);

  if (mode === "fascia")
    return <Fascia dim={dim} setDim={setDim} onExit={onExit} nights={nights} addNight={addNight} />;
  if (mode === "cbti") return <CbtiFlow dim={dim} setDim={setDim} onExit={onExit} />;

  const streak = countStreak(nights);
  return (
    <NightWrap dim={dim} setDim={setDim} onExit={onExit}>
      <p className="mo" style={{ fontSize: 11, letterSpacing: "0.2em", color: C.lampDim }}>
        03 · 밤 {streak > 0 ? `· 연속 ${streak}일` : ""}
      </p>
      <h2 className="dp mt-3" style={{ fontSize: 28, fontWeight: 600, color: C.lamp, lineHeight: 1.4 }}>
        누운 채로<br />따라오기만 하세요
      </h2>
      <p className="bd mt-5" style={{ fontSize: 14, color: "rgba(233,198,138,0.6)", lineHeight: 1.9 }}>
        화면을 계속 볼 필요는 없어요. 읽고 나면 눈을 감고, 다음이 궁금할 때만 한 번 뜨세요. 중간에 잠들면
        그게 성공입니다.
      </p>

      <div className="mt-8 flex flex-col gap-3">
        <button
          onClick={() => setMode("fascia")}
          className="w-full text-left p-5"
          style={{ border: `1px solid rgba(233,198,138,0.4)`, borderRadius: 2 }}
        >
          <span className="dp block" style={{ fontSize: 19, fontWeight: 600, color: C.lamp }}>
            몸 다독이기
          </span>
          <span className="bd block mt-1" style={{ fontSize: 13, color: "rgba(233,198,138,0.55)", lineHeight: 1.7 }}>
            호흡과 알아차림 → 여섯 부위 만져주기 → 감사하기
          </span>
        </button>
        <button
          onClick={() => setMode("cbti")}
          className="w-full text-left p-5"
          style={{ border: `1px solid rgba(233,198,138,0.18)`, borderRadius: 2 }}
        >
          <span className="dp block" style={{ fontSize: 19, fontWeight: 600, color: "rgba(233,198,138,0.75)" }}>
            그래도 잠이 안 올 때
          </span>
          <span className="bd block mt-1" style={{ fontSize: 13, color: "rgba(233,198,138,0.4)", lineHeight: 1.7 }}>
            걱정 내려놓기 · 근육 이완 · 생각 흐트러뜨리기
          </span>
        </button>
      </div>

      <p className="bd mt-7" style={{ fontSize: 11.5, color: "rgba(233,198,138,0.32)", lineHeight: 1.7 }}>
        일반적인 이완 방법으로 진료를 대신하지 않습니다. 불면이 3주 이상 이어지거나 낮 생활이 무너지면
        병원에서 상담받으세요.
      </p>
    </NightWrap>
  );
}

function countStreak(nights) {
  if (!nights || nights.length === 0) return 0;
  const set = new Set(nights);
  const key = (x) => `${x.getFullYear()}-${x.getMonth() + 1}-${x.getDate()}`;
  const d = new Date();
  if (!set.has(key(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (set.has(key(d)) && n < 400) {
    n += 1;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

function CbtiFlow({ dim, setDim, onExit }) {
  const [i, setI] = useState(0);
  const step = SLEEP_STEPS[i];
  const next = () => (i < SLEEP_STEPS.length - 1 ? setI(i + 1) : onExit());

  return (
    <NightWrap dim={dim} setDim={setDim} onExit={onExit}>
      <p className="mo" style={{ fontSize: 11, letterSpacing: "0.18em", color: C.lampDim }}>
        {step.label} · {i + 1}/{SLEEP_STEPS.length}
      </p>
      <h2 className="dp mt-2 mb-6" style={{ fontSize: 24, fontWeight: 600, color: C.lamp, lineHeight: 1.45 }}>
        {step.title}
      </h2>

      {step.type === "read" && <PacedLines lines={step.lines} slow={step.slow} onDone={next} />}
      {step.type === "worry" && <WorryNote lines={step.lines} onDone={next} />}
      {step.type === "breath" && (
        <>
          <Intro lines={step.lines} />
          <Breath color={C.lamp} cycles={8} inhale={4} hold={2} exhale={8} onDone={null} />
          <NightBtn onClick={next}>다음</NightBtn>
        </>
      )}
      {step.type === "pmr" && (
        <>
          <Intro lines={step.lines} />
          <PmrRunner onDone={next} />
        </>
      )}
      {step.type === "shuffle" && (
        <>
          <Intro lines={step.lines} />
          <Shuffle onDone={next} />
        </>
      )}
    </NightWrap>
  );
}

function Intro({ lines }) {
  return (
    <div className="mb-6">
      {lines.map((l) => (
        <p key={l} className="bd mb-2" style={{ fontSize: 14.5, color: "rgba(233,198,138,0.62)", lineHeight: 1.95 }}>
          {l}
        </p>
      ))}
    </div>
  );
}

function PacedLines({ lines, slow, onDone }) {
  const [n, setN] = useState(1);
  useEffect(() => {
    if (n >= lines.length) return;
    const id = setTimeout(() => setN((x) => x + 1), slow ? 11000 : 7000);
    return () => clearTimeout(id);
  }, [n, lines.length, slow]);
  return (
    <div>
      {lines.slice(0, n).map((l, idx) => (
        <p
          key={l}
          className={slow ? "dp mb-5" : "bd mb-4"}
          style={{
            fontSize: slow ? 20 : 16,
            color: idx === n - 1 ? C.lamp : "rgba(233,198,138,0.4)",
            lineHeight: 2,
            transition: "color 1.2s ease",
          }}
        >
          {l}
        </p>
      ))}
      <div className="mt-6">
        {n < lines.length ? (
          <NightBtn ghost onClick={() => setN(n + 1)}>
            다음 줄
          </NightBtn>
        ) : (
          <NightBtn onClick={onDone}>다음</NightBtn>
        )}
      </div>
    </div>
  );
}

function WorryNote({ lines, onDone }) {
  const [text, setText] = useState("");
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await window.storage.get("reset:worry");
        if (alive && r && r.value) setText(r.value);
      } catch (err) {
        /* 첫 사용 */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);
  const save = async () => {
    try {
      await window.storage.set("reset:worry", text);
    } catch (err) {
      /* 저장 실패해도 진행 */
    }
    onDone();
  };
  return (
    <div>
      <Intro lines={lines} />
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder={"신경 쓰이는 것 / 내일 몇 시에 볼지\n예) 수학 진도 밀림 → 내일 9시에 계획표만 다시 짠다"}
        className="bd w-full p-4"
        style={{
          fontSize: 15,
          lineHeight: 1.9,
          background: "rgba(233,198,138,0.06)",
          border: "1px solid rgba(233,198,138,0.18)",
          borderRadius: 2,
          color: C.lamp,
          resize: "none",
        }}
      />
      <div className="mt-5">
        <NightBtn onClick={save}>내려놓고 다음으로</NightBtn>
      </div>
    </div>
  );
}

function PmrRunner({ onDone }) {
  const [idx, setIdx] = useState(0);
  const [tense, setTense] = useState(true);
  const [left, setLeft] = useState(5);

  useEffect(() => {
    if (idx >= PMR.length) return;
    if (left > 0) {
      const id = setTimeout(() => setLeft((l) => l - 1), 1000);
      return () => clearTimeout(id);
    }
    if (tense) {
      setTense(false);
      setLeft(12);
    } else {
      setTense(true);
      setLeft(5);
      setIdx((x) => x + 1);
    }
  }, [left, tense, idx]);

  if (idx >= PMR.length)
    return (
      <div>
        <p className="dp mb-6" style={{ fontSize: 20, color: C.lamp, lineHeight: 1.8 }}>
          온몸이 이불 쪽으로 가라앉는 느낌을 잠깐 그대로 두세요.
        </p>
        <NightBtn onClick={onDone}>다음</NightBtn>
      </div>
    );

  return (
    <div className="text-center py-4">
      <p className="mo" style={{ fontSize: 11, color: C.lampDim }}>
        {idx + 1} / {PMR.length}
      </p>
      <p className="dp mt-3" style={{ fontSize: 26, color: C.lamp }}>
        {PMR[idx]}
      </p>
      <p
        className="dp mt-4"
        style={{ fontSize: 19, color: tense ? "#D98A6A" : "rgba(233,198,138,0.75)" }}
      >
        {tense ? "5초 동안 꽉 힘주기" : "힘 빼고, 풀리는 느낌 그대로"}
      </p>
      <p className="mo mt-6" style={{ fontSize: 46, color: C.lamp }}>
        {left}
      </p>
      <div className="mt-8">
        <NightBtn ghost onClick={onDone}>
          건너뛰기
        </NightBtn>
      </div>
    </div>
  );
}

function Shuffle({ onDone }) {
  const [word, setWord] = useState(SHUFFLE_WORDS[0]);
  const [count, setCount] = useState(1);
  useEffect(() => {
    const id = setInterval(() => {
      setWord(SHUFFLE_WORDS[Math.floor(Math.random() * SHUFFLE_WORDS.length)]);
      setCount((c) => c + 1);
    }, 7000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="text-center py-6">
      <p className="dp" style={{ fontSize: 40, color: C.lamp, letterSpacing: "0.05em" }}>
        {word}
      </p>
      <p className="bd mt-6" style={{ fontSize: 13, color: "rgba(233,198,138,0.45)", lineHeight: 1.8 }}>
        눈을 감고 그 모습만 떠올리세요. 7초마다 바뀝니다. ({count})
      </p>
      <div className="mt-10">
        <NightBtn onClick={onDone}>마지막 단계로</NightBtn>
      </div>
    </div>
  );
}

/* ---------------- 몸 다독이기 · 호흡 / 만져주기 / 감사하기 ---------------- */

function Chip({ on, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bd px-3 py-2"
      style={{
        fontSize: 14,
        borderRadius: 2,
        border: `1px solid rgba(233,198,138,${on ? 0.55 : 0.18})`,
        background: on ? "rgba(233,198,138,0.16)" : "transparent",
        color: on ? C.lamp : "rgba(233,198,138,0.45)",
      }}
    >
      {label}
    </button>
  );
}

function SlowBreath({ minMinutes }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const inhale = t % 11 < 5;
  const m = Math.floor(t / 60);
  const s = t % 60;
  return (
    <div className="flex flex-col items-center py-4">
      <div
        style={{
          width: 190,
          height: 190,
          borderRadius: "50%",
          border: `1px solid rgba(233,198,138,0.45)`,
          background: inhale ? "rgba(233,198,138,0.07)" : "transparent",
          transform: `scale(${inhale ? 1 : 0.6})`,
          transition: `transform ${inhale ? 5 : 6}s ease-in-out, background 3s ease`,
        }}
      />
      <p className="dp mt-7 text-center" style={{ fontSize: 19, color: C.lamp, lineHeight: 1.7 }}>
        {inhale ? "코로 천천히 들이쉬며" : "코로 천천히 내쉬며"}
      </p>
      <p className="bd mt-2 text-center" style={{ fontSize: 14.5, color: "rgba(233,198,138,0.6)", lineHeight: 1.9 }}>
        {inhale
          ? "따뜻한 빛이 정수리에서 손끝, 발끝, 골반 깊은 곳까지 퍼집니다"
          : "그 숨이 다시 몸의 중심으로 모입니다. 어깨가 풀리고, 가슴이 부드러워지고, 배가 편안해집니다"}
      </p>
      <p className="mo mt-6" style={{ fontSize: 13, color: C.lampDim }}>
        {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")} · 최소 {minMinutes}분
      </p>
    </div>
  );
}

function TouchRunner({ long, reactions, setReactions, onDone }) {
  const secs = long ? 180 : 60;
  const [idx, setIdx] = useState(0);
  const [left, setLeft] = useState(secs);
  const [asking, setAsking] = useState(false);
  const chime = useChime();
  const part = TOUCH[idx];

  useEffect(() => {
    if (asking) return;
    if (left <= 0) {
      setAsking(true);
      chime(true);
      return;
    }
    const id = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(id);
  }, [left, asking, chime]);

  const toggle = (r) =>
    setReactions((p) => {
      const cur = p[part.name] || [];
      return { ...p, [part.name]: cur.includes(r) ? cur.filter((x) => x !== r) : [...cur, r] };
    });

  const advance = () => {
    if (idx >= TOUCH.length - 1) return onDone();
    setIdx(idx + 1);
    setLeft(secs);
    setAsking(false);
  };

  if (asking)
    return (
      <div>
        <p className="dp" style={{ fontSize: 21, color: C.lamp }}>
          {part.name} — 무엇이 느껴졌나요?
        </p>
        <p className="bd mt-2 mb-4" style={{ fontSize: 13.5, color: "rgba(233,198,138,0.5)", lineHeight: 1.8 }}>
          밀어내지도, 분석하지도 마세요. 그냥 그 자리에 손을 두고 떠오르는 걸 바라보면 됩니다.
        </p>
        <div className="flex flex-wrap gap-2">
          {REACTIONS.map((r) => (
            <Chip
              key={r}
              label={r}
              on={(reactions[part.name] || []).includes(r)}
              onClick={() => toggle(r)}
            />
          ))}
        </div>
        <p className="bd mt-6 mb-2" style={{ fontSize: 13.5, color: "rgba(233,198,138,0.5)" }}>
          충분히 느꼈다면, 손을 둔 채로 한 문장을 속으로 말해 보세요.
        </p>
        <div className="flex gap-2">
          {PHRASES.map((p) => (
            <span
              key={p}
              className="dp px-3 py-2"
              style={{ fontSize: 15, color: C.lamp, border: "1px solid rgba(233,198,138,0.18)", borderRadius: 2 }}
            >
              {p}
            </span>
          ))}
        </div>
        <div className="mt-7">
          <NightBtn onClick={advance}>
            {idx >= TOUCH.length - 1 ? "여섯 부위 끝 · 다음" : `다음 부위 (${TOUCH[idx + 1].name})`}
          </NightBtn>
        </div>
      </div>
    );

  return (
    <div className="text-center py-2">
      <p className="mo" style={{ fontSize: 11, color: C.lampDim }}>
        {idx + 1} / {TOUCH.length}
      </p>
      <p className="dp mt-3" style={{ fontSize: 30, color: C.lamp }}>
        {part.name}
      </p>
      <p className="bd mt-4" style={{ fontSize: 14.5, color: "rgba(233,198,138,0.6)", lineHeight: 1.9 }}>
        {part.tip}
      </p>
      <p className="mo mt-7" style={{ fontSize: 44, color: C.lamp }}>
        {String(Math.floor(left / 60)).padStart(2, "0")}:{String(left % 60).padStart(2, "0")}
      </p>
      <p className="bd mt-4" style={{ fontSize: 13, color: "rgba(233,198,138,0.42)", lineHeight: 1.8 }}>
        손은 그대로 둔 채 코로 들이쉬고, 내쉬고. 그것만 반복하세요.
      </p>
      <div className="mt-8">
        <NightBtn ghost onClick={() => setLeft(0)}>
          이 부위는 여기까지
        </NightBtn>
      </div>
    </div>
  );
}

function Gratitude({ reactions, onDone }) {
  const felt = Object.keys(reactions).filter(
    (k) => (reactions[k] || []).length > 0 && !reactions[k].includes("별 느낌 없음")
  );
  const list = felt.length > 0 ? felt : TOUCH.map((t) => t.name);
  const [spot, setSpot] = useState(null);
  const [q, setQ] = useState(0);
  const [thanks, setThanks] = useState(0);

  if (!spot)
    return (
      <div>
        <p className="bd mb-4" style={{ fontSize: 14.5, color: "rgba(233,198,138,0.6)", lineHeight: 1.95 }}>
          트라우마가 상처받은 이야기라면, 감사는 안전하게 도움받은 이야기입니다. 몸은 둘 다 기억할 수 있어요.
          안전한 이야기를 자주 들려주어 몸의 기억을 다시 쓰는 단계입니다.
        </p>
        <p className="bd mb-3" style={{ fontSize: 14.5, color: C.lamp }}>
          반응이 있었던 부위에 다시 손을 올려주세요.
        </p>
        <div className="flex flex-wrap gap-2">
          {list.map((n) => (
            <Chip key={n} label={n} on={false} onClick={() => setSpot(n)} />
          ))}
        </div>
      </div>
    );

  if (q < RECALL.length)
    return (
      <div>
        <p className="mo mb-4" style={{ fontSize: 11, color: C.lampDim }}>
          {spot}에 손을 올린 채로 · {q + 1}/3
        </p>
        <p className="bd mb-6" style={{ fontSize: 13.5, color: "rgba(233,198,138,0.5)", lineHeight: 1.8 }}>
          살아오면서 누군가에게 진심으로 도움이나 호의를 받았던 장면을 떠올려 보세요. 아주 작은 도움도 괜찮습니다.
        </p>
        <p className="dp" style={{ fontSize: 22, color: C.lamp, lineHeight: 1.7 }}>
          {RECALL[q]}
        </p>
        <div className="mt-8">
          <NightBtn onClick={() => setQ(q + 1)}>떠올렸어요</NightBtn>
        </div>
      </div>
    );

  return (
    <div className="text-center">
      <p className="bd" style={{ fontSize: 14, color: "rgba(233,198,138,0.55)", lineHeight: 1.9 }}>
        그 순간의 따뜻함을 몸으로 다시 느끼면서, 천천히 다섯 번 말해 보세요. 속으로 해도 되고, 소리 내어 해도 됩니다.
      </p>
      <button
        onClick={() => setThanks((t) => Math.min(5, t + 1))}
        className="dp mt-8 w-full py-10"
        style={{
          fontSize: 30,
          color: C.lamp,
          border: "1px solid rgba(233,198,138,0.35)",
          borderRadius: 2,
          background: "rgba(233,198,138,0.05)",
        }}
      >
        감사합니다
      </button>
      <p className="mo mt-5" style={{ fontSize: 22, color: C.lampDim, letterSpacing: "0.4em" }}>
        <span style={{ color: C.lamp }}>{"●".repeat(thanks)}</span>
        {"○".repeat(5 - thanks)}
      </p>
      <div className="mt-8">
        <NightBtn onClick={onDone} ghost={thanks < 5}>
          {thanks < 5 ? "여기서 마치기" : "마무리하기"}
        </NightBtn>
      </div>
    </div>
  );
}

function Fascia({ dim, setDim, onExit, nights, addNight }) {
  const [stage, setStage] = useState(0);
  const [long, setLong] = useState(true);
  const [tension, setTension] = useState([]);
  const [reactions, setReactions] = useState({});
  const streak = countStreak(nights);

  const head = (label, title) => (
    <>
      <p className="mo" style={{ fontSize: 11, letterSpacing: "0.18em", color: C.lampDim }}>
        {label}
      </p>
      <h2 className="dp mt-2 mb-6" style={{ fontSize: 24, fontWeight: 600, color: C.lamp, lineHeight: 1.45 }}>
        {title}
      </h2>
    </>
  );

  return (
    <NightWrap dim={dim} setDim={setDim} onExit={onExit}>
      {stage === 0 && (
        <>
          {head("준비", "자세부터 편하게 만듭니다")}
          <p className="bd" style={{ fontSize: 14.5, color: "rgba(233,198,138,0.62)", lineHeight: 2 }}>
            침대에 눕거나 바닥에 편하게 앉으세요. 등은 자연스럽게 펴고, 어깨에서는 힘을 빼세요.
            눈은 감아도 되고, 시선을 한 곳에 부드럽게 두어도 됩니다. 마음을 편안하게 두는 게 제일 중요해요.
          </p>
          <p className="bd mt-5" style={{ fontSize: 13.5, color: "rgba(233,198,138,0.45)", lineHeight: 1.9 }}>
            오늘은 얼마나 시간을 쓸 수 있나요?
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setLong(false)}
              className="bd flex-1 py-3"
              style={{
                fontSize: 14,
                borderRadius: 2,
                border: `1px solid rgba(233,198,138,${long ? 0.18 : 0.5})`,
                color: long ? "rgba(233,198,138,0.45)" : C.lamp,
                background: long ? "transparent" : "rgba(233,198,138,0.12)",
              }}
            >
              짧게 · 약 10분
            </button>
            <button
              onClick={() => setLong(true)}
              className="bd flex-1 py-3"
              style={{
                fontSize: 14,
                borderRadius: 2,
                border: `1px solid rgba(233,198,138,${long ? 0.5 : 0.18})`,
                color: long ? C.lamp : "rgba(233,198,138,0.45)",
                background: long ? "rgba(233,198,138,0.12)" : "transparent",
              }}
            >
              그대로 · 약 25분
            </button>
          </div>
          <div className="mt-7">
            <NightBtn onClick={() => setStage(1)}>시작하기</NightBtn>
          </div>
        </>
      )}

      {stage === 1 && (
        <>
          {head("첫 번째 · 호흡과 알아차림", "숨이 몸 끝까지 퍼진다고 생각해 보세요")}
          <SlowBreath minMinutes={long ? 3 : 2} />
          <div className="mt-6">
            <NightBtn onClick={() => setStage(2)}>충분히 했어요</NightBtn>
          </div>
        </>
      )}

      {stage === 2 && (
        <>
          {head("첫 번째 · 알아차림", "지금 어디가 긴장돼 있나요?")}
          <p className="bd mb-5" style={{ fontSize: 14, color: "rgba(233,198,138,0.55)", lineHeight: 1.95 }}>
            고치려 하지 말고 “아, 그렇구나” 하고 알아차리기만 하면 됩니다. 잘 모르겠어도 괜찮아요.
            반복하다 보면 몸 상태를 점점 알아가게 됩니다. 이 알아차림 자체가 변화의 시작입니다.
          </p>
          <div className="flex flex-wrap gap-2">
            {TENSION.map((t) => (
              <Chip
                key={t}
                label={t}
                on={tension.includes(t)}
                onClick={() =>
                  setTension((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]))
                }
              />
            ))}
          </div>
          <div className="mt-8">
            <NightBtn onClick={() => setStage(3)}>다음</NightBtn>
          </div>
        </>
      )}

      {stage === 3 && (
        <>
          {head("두 번째 · 만져주기", "내 손이 내 안에 갇힌 기억과 만나는 시간")}
          <p className="bd" style={{ fontSize: 14.5, color: "rgba(233,198,138,0.62)", lineHeight: 2 }}>
            왜 하필 내 손일까요. 남의 손보다 내 손이 닿는 것이 가장 편안한 출발점이기 때문입니다.
            머리 · 얼굴 · 쇄골 아래 · 가슴 한가운데 · 윗배 · 아랫배, 여섯 부위에 차례로 손바닥을 얹습니다.
          </p>
          <div
            className="mt-6 p-4"
            style={{ border: "1px solid rgba(233,198,138,0.18)", borderRadius: 2 }}
          >
            <p className="mo" style={{ fontSize: 10, letterSpacing: "0.14em", color: C.lampDim }}>
              왜 누르지 않고 얹기만 하나
            </p>
            <p className="bd mt-2" style={{ fontSize: 13.5, color: "rgba(233,198,138,0.55)", lineHeight: 1.9 }}>
              근막에는 루피니 소체라는 감각 센서가 있습니다. 느리고 지속적인 압력에만 반응하고, 빠르게 누르거나
              문지르면 반응하지 않아요. 지긋이 머무는 손길이 자율신경의 이완을 만듭니다.
            </p>
          </div>
          <div className="mt-7">
            <NightBtn onClick={() => setStage(4)}>손을 얹고 시작</NightBtn>
          </div>
        </>
      )}

      {stage === 4 && (
        <>
          {head("두 번째 · 만져주기", "온기만 전한다고 생각하세요")}
          <TouchRunner
            long={long}
            reactions={reactions}
            setReactions={setReactions}
            onDone={() => setStage(5)}
          />
        </>
      )}

      {stage === 5 && (
        <>
          {head("세 번째 · 감사하기", "몸에 안전한 이야기를 들려주기")}
          <Gratitude reactions={reactions} onDone={() => setStage(6)} />
        </>
      )}

      {stage === 6 && (
        <>
          {head("마무리", "자책은 내려놓으세요")}
          <PacedLines
            slow
            lines={[
              "몸에 새겨진 기억은 나를 괴롭히려고 새겨진 것이 아닙니다.",
              "어려운 시간을 살아남기 위해 몸이 만들어낸 생존의 흔적이에요.",
              "마음이 약해서 그런 것이 아닙니다.",
              "처음 며칠은 어색하고 별 차이가 없을 수도 있어요. 그래도 괜찮습니다.",
              "한 달쯤 지나면 문득 오늘은 어깨가 좀 풀렸네, 하는 날이 옵니다.",
              "이제 화면을 끄고 폰을 엎어두세요. 내일 몸이 조금 더 가볍기를.",
            ]}
            onDone={() => {
              const d = new Date();
              addNight(`${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`);
              onExit();
            }}
          />
          {streak > 0 && (
            <p className="mo mt-6" style={{ fontSize: 11, color: C.lampDim }}>
              연속 {streak}일째 · 한 달을 목표로
            </p>
          )}
        </>
      )}
    </NightWrap>
  );
}

function NightBtn({ children, onClick, ghost }) {
  return (
    <button
      onClick={onClick}
      className="bd w-full py-3"
      style={{
        background: ghost ? "transparent" : "rgba(233,198,138,0.12)",
        border: `1px solid rgba(233,198,138,${ghost ? 0.18 : 0.4})`,
        borderRadius: 2,
        color: ghost ? "rgba(233,198,138,0.5)" : C.lamp,
        fontSize: 15,
      }}
    >
      {children}
    </button>
  );
}

function NightWrap({ children, dim, setDim, onExit }) {
  return (
    <div style={{ background: C.night, minHeight: "100%", position: "relative" }}>
      <div className="px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <button className="mo" style={{ fontSize: 11, color: C.lampDim }} onClick={onExit}>
            ← 나가기
          </button>
          <div className="flex items-center gap-2">
            <span className="mo" style={{ fontSize: 10, color: C.lampDim }}>
              밝기
            </span>
            <input
              type="range"
              min={0}
              max={80}
              value={Math.round((1 - dim) * 100) - 20}
              onChange={(e) => setDim(1 - (Number(e.target.value) + 20) / 100)}
              style={{ width: 90, accentColor: C.lampDim }}
            />
          </div>
        </div>
        <div style={{ opacity: Math.max(0.18, 1 - dim) }}>{children}</div>
      </div>
    </div>
  );
}

/* ---------------------------- 기록 ---------------------------- */

const LABEL = { body: "몸", feel: "감정", mind: "생각" };

function Log({ records, onExit, onClear }) {
  const counts = {};
  records.forEach((r) => {
    [...r.emotions, ...r.thoughts, ...r.sensations].forEach((x) => {
      counts[x] = (counts[x] || 0) + 1;
    });
  });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4);

  return (
    <Wrap onExit={onExit}>
      <Sheet eyebrow="채점표" title="반복되는 패턴이 진짜 원인입니다">
        {records.length === 0 ? (
          <p className="bd" style={{ fontSize: 14, color: C.faint, lineHeight: 1.9 }}>
            아직 기록이 없어요. 공부가 안 될 때 한 번만 남겨보면, 다음에 같은 상황에서 훨씬 빨리 빠져나올 수 있습니다.
          </p>
        ) : (
          <>
            {top.length > 0 && (
              <div className="p-4 mb-5" style={{ background: C.ink, borderRadius: 2 }}>
                <p className="mo" style={{ fontSize: 10, letterSpacing: "0.14em", color: C.marker }}>
                  자주 고른 것
                </p>
                {top.map(([k, v]) => (
                  <div key={k} className="flex justify-between mt-2">
                    <span className="bd" style={{ fontSize: 14, color: "#F2F4F1" }}>
                      {k}
                    </span>
                    <span className="mo" style={{ fontSize: 13, color: C.marker }}>
                      {v}회
                    </span>
                  </div>
                ))}
              </div>
            )}
            {records
              .slice()
              .reverse()
              .map((r) => {
                const d = new Date(r.at);
                return (
                  <div
                    key={r.at}
                    className="p-4 mb-2"
                    style={{ background: "#FFFFFF", border: `1px solid ${C.line}`, borderRadius: 2 }}
                  >
                    <div className="flex justify-between items-baseline">
                      <span className="mo" style={{ fontSize: 11, color: C.faint }}>
                        {d.getMonth() + 1}/{d.getDate()} {String(d.getHours()).padStart(2, "0")}:
                        {String(d.getMinutes()).padStart(2, "0")}
                      </span>
                      <span className="mo" style={{ fontSize: 11, color: C.faint }}>
                        졸림 {r.sleepy}/5 · 회복 {r.relief}%
                      </span>
                    </div>
                    <p className="dp mt-2" style={{ fontSize: 15, color: C.ink }}>
                      {r.route.map((x) => LABEL[x]).join(" → ")}
                    </p>
                    <p className="bd mt-1" style={{ fontSize: 12.5, color: C.faint, lineHeight: 1.7 }}>
                      {[...r.parts, ...r.emotions, ...r.thoughts].slice(0, 4).join(" · ")}
                    </p>
                    {r.reframe && (
                      <p
                        className="bd mt-2 pl-3"
                        style={{ fontSize: 13, color: C.ink, borderLeft: `2px solid ${C.marker}`, lineHeight: 1.7 }}
                      >
                        {r.reframe}
                      </p>
                    )}
                    {r.next && (
                      <p className="mo mt-2" style={{ fontSize: 11.5, color: C.body }}>
                        → {r.next}
                      </p>
                    )}
                  </div>
                );
              })}
            <div className="mt-6">
              <Btn tone="ghost" onClick={onClear}>
                전체 지우기
              </Btn>
            </div>
          </>
        )}
      </Sheet>
    </Wrap>
  );
}

/* ---------------------------- 앱 ---------------------------- */

const KEY = "reset:records:v1";
const NIGHT_KEY = "reset:nights:v1";

export default function App() {
  const [screen, setScreen] = useState("home");
  const [records, setRecords] = useState([]);
  const [nights, setNights] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await window.storage.get(KEY);
        if (alive && r && r.value) setRecords(JSON.parse(r.value));
      } catch (err) {
        /* 첫 사용 */
      }
      try {
        const n = await window.storage.get(NIGHT_KEY);
        if (alive && n && n.value) setNights(JSON.parse(n.value));
      } catch (err) {
        /* 첫 사용 */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const addNight = async (day) => {
    setNights((prev) => {
      if (prev.includes(day)) return prev;
      const next = [...prev, day];
      try {
        window.storage.set(NIGHT_KEY, JSON.stringify(next));
      } catch (err) {
        /* 저장 실패해도 진행 */
      }
      return next;
    });
  };

  const persist = async (next) => {
    setRecords(next);
    try {
      await window.storage.set(KEY, JSON.stringify(next));
    } catch (err) {
      /* 저장 실패해도 화면은 유지 */
    }
  };

  return (
    <div className="w-full flex justify-center" style={{ ...GRID, minHeight: "100vh" }}>
      <style dangerouslySetInnerHTML={{ __html: FONTS }} />
      <div
        className="w-full"
        style={{
          maxWidth: 520,
          background: screen === "sleep" ? C.night : "rgba(255,255,255,0.35)",
          minHeight: "100vh",
        }}
      >
        {screen === "home" && <Home go={setScreen} count={records.length} />}
        {screen === "checkin" && (
          <CheckIn
            onExit={() => setScreen("home")}
            goNap={() => setScreen("nap")}
            onDone={(entry) => {
              persist([...records, entry]);
              setScreen("log");
            }}
          />
        )}
        {screen === "nap" && <Nap onExit={() => setScreen("home")} />}
        {screen === "sleep" && (
          <SleepProgram onExit={() => setScreen("home")} nights={nights} addNight={addNight} />
        )}
        {screen === "log" && (
          <Log records={records} onExit={() => setScreen("home")} onClear={() => persist([])} />
        )}
      </div>
    </div>
  );
}
