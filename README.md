# Think in English · 영어로 생각하기

한국어 사고를 영어 사고로 바꾸는 **AI 영어 일기 학습 웹앱**.
매일 영어로 일기를 쓰면 AI가 **원어민 표현으로 첨삭**하고, 단순히 정답을 주는 것을 넘어
**"왜 영어는 이렇게 말하는지"** 사고방식까지 설명합니다.

> 영어를 **번역하는 사람**이 아니라 **영어로 생각하는 사람**으로.

학생이 바로 쓸 수 있도록 설계했습니다. 회원가입·설치 없이 브라우저에서 즉시 사용하고,
휴대폰에 **PWA로 설치**할 수도 있습니다.

---

## 핵심 기능 (기획서 반영)

| # | 기능 | 설명 |
|---|------|------|
| ① | **AI 영어 일기 첨삭** | 내가 쓴 영어를 원어민 표현으로 자연스럽게 수정 + 문장별 수정 이유(한국어) |
| ② | **영어식 사고 설명** | 이 일기에서 드러나는 한국어식↔영어식 사고 차이를 쉽게 설명 |
| ③ | **Thinking Map** | 생각의 흐름(사건→연결→결과)을 시각화 |
| ④ | **핵심 패턴 자동 추출** | `Now that + 주어 + have/has + p.p.` 같은 패턴과 오늘 배운 표현 |
| ⑤ | **5번 읽기** | 원어민 문장을 1/5~5/5 반복해 읽으며 체화 |
| ⑥ | **음성 학습** | 원어민 음성 듣기(TTS) + 따라 말하기 발음 채점(STT) |
| ⑦ | **자동 복습** | 배운 표현을 Leitner 간격 복습으로 매일 자동 제공 |
| ⑧ | **영어 습관 분석** | 강점·약점·문법 진단 점수 + "이번 주 목표" 추천 |

화면 흐름: **캘린더 → 오늘의 일기 → AI 첨삭 → 영어식 사고 → Thinking Map → 핵심 패턴 → 5번 읽기 → 자동 복습**

---

## 기술 스택

- **Frontend**: React 18 + Vite + Tailwind CSS
- **AI**: Anthropic Claude (Netlify Functions에서 **서버 사이드** 호출)
- **음성**: 브라우저 내장 Web Speech API (TTS/STT) — 별도 키 불필요
- **저장**: 브라우저 localStorage (무설정, 오프라인 동작)
- **PWA**: 매니페스트 + 서비스 워커 (휴대폰 설치 가능)

### 왜 AI를 서버에서 호출하나요?

API 키를 프런트엔드에 두면 학생 누구나 키를 훔쳐 쓸 수 있습니다.
이 앱은 Netlify Function(`netlify/functions/correct.js`)에서만 키를 사용하므로
**학생은 키를 절대 볼 수 없습니다.**

---

## 로컬 실행

```bash
npm install
npm run dev        # http://localhost:5173
```

> 로컬 `npm run dev`/`preview`에는 서버리스 함수가 없어 **오프라인 연습 모드**로 동작합니다.
> (일기·5번 읽기·음성·복습은 모두 정상 작동, AI 첨삭만 규칙 기반 보조로 대체)
> Netlify 함수까지 함께 돌리려면 `npx netlify dev` 를 사용하세요.

빌드:

```bash
npm run build      # dist/ 생성
npm run preview
```

---

## 배포 & AI 켜기 (Netlify)

1. 이 저장소를 Netlify 에 연결하면 `netlify.toml` 설정으로 자동 빌드됩니다.
2. **AI 첨삭을 켜려면** Netlify 사이트의 환경변수에 API 키를 추가하세요:
   - `Site settings → Environment variables`
   - `ANTHROPIC_API_KEY = sk-ant-...`
   - (선택) `THINK_MODEL` 로 모델 변경 가능 (기본: `claude-haiku-4-5`)
3. 재배포하면 앱의 **설정 → AI 첨삭 상태**가 "켜짐"으로 바뀝니다.

키가 없어도 앱은 오프라인 연습 모드로 정상 동작하므로, 먼저 배포해 학생에게
나눠 주고 나중에 키를 추가해도 됩니다.

---

## 프로젝트 구조

```
index.html
public/
  manifest.webmanifest      # PWA 설치 정보
  sw.js                     # 서비스 워커(오프라인 캐시)
  icon-*.png                # 앱 아이콘
src/
  App.jsx                   # 탭 라우팅
  main.jsx                  # 진입점 + SW 등록
  screens/                  # Today / Review / Stats / Settings
  components/               # Calendar, CorrectionView, ThinkingMap, ReadFive ...
  lib/
    ai.js                   # /correct 호출 + 오프라인 폴백
    heuristic.js            # 키 없을 때 규칙 기반 보조 첨삭
    storage.js              # localStorage(일기/복습/설정)
    speech.js               # Web Speech API(TTS/STT) 래퍼
    srs 로직은 storage.js 내 Leitner 박스
netlify/functions/
  correct.js                # AI 첨삭 엔드포인트(서버 사이드 키)
  lib/anthropic.js          # Anthropic Messages API 헬퍼
```

---

## 개인정보

모든 일기·복습 기록은 **학생 기기(브라우저)에만** 저장됩니다. 서버 DB가 없습니다.
설정 화면에서 데이터를 JSON으로 **백업**하거나 **초기화**할 수 있습니다.
