# 단어 리셋 · 재수생 영단어 암기 앱

수능 D-day가 고정이라는 재수생의 장점을 살린 영단어 암기 웹앱입니다.
복습을 *시작하는* 마찰을 없애는 데 초점을 맞췄습니다 — 홈은 `오늘 복습 27개 → [시작]`
버튼 하나. 틀린 단어는 학생이 따로 체크할 필요 없이 알아서 다시 나옵니다.

## 핵심 기능

- **단계 승급 문제 형식** — 같은 단어라도 맞힐수록 다음 단계로:
  ① 영어→뜻 4지선다 → ② 뜻→영어 4지선다 → ③ 예문 빈칸 객관식 → ④ 빈칸 첫 글자 힌트 타이핑.
  진입은 재인(recognition), 최종은 인출(recall)까지 훈련합니다.
- **Leitner 5박스 SRS** — 맞으면 승급(1→3→7→16→35일), 틀리면 박스 1로 강등 + 같은 세션 안 4~6문제 뒤 즉시 재삽입.
- **D-day 역산 상한** — D-30부터 복습 간격에 상한을 걸고 D-14 / D-7 등에 강제 노출해, 모든 단어가 시험 전 최소 1회 더 나오게 합니다.
- **똑똑한 오답 선택지** — 과거에 헷갈렸던 단어 → 같은 품사 → 철자 유사 → 랜덤 순으로 골라 "아는 것 같은 착각"을 방지합니다.
- **사진으로 단어장 추가** — 단어장/시험지 사진 → AI(OCR)가 단어를 추출 → 확인·편집 화면에서 수정 후 저장. 뜻이 없으면 자동 생성.
- **AI 예문 + 재활용** — 오늘 틀린 단어로 예문을 만들고, 그 예문을 다음 세션의 빈칸 문제로 재사용합니다.
- **밀린 복습 0** — 하루 빠지면 끊기는 스트릭 대신, 만회 가능한 "밀린 개수"로 복귀를 유도합니다.
- **통계** — 자주 틀리는 단어 TOP 10, 박스별 분포.

기본 단어장으로 수능 필수 60단어가 들어있어 바로 시작할 수 있습니다.
모든 데이터(단어·진행도·예문·설정)는 브라우저 `localStorage`에만 저장됩니다.

## 기술 스택

- React 18 + Vite
- Tailwind CSS
- Netlify Functions (서버리스) — AI 기능(OCR·예문·뜻 생성)은 Claude API 프록시로 처리

## 실행

```bash
npm install
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드 (dist/)
npm run preview  # 빌드 결과 미리보기
```

## 배포 (Netlify)

`netlify.toml`에 빌드/함수 설정이 들어 있어 그대로 배포됩니다.

- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`

### AI 기능 켜기

OCR·예문 생성은 서버리스 함수가 Claude API를 호출합니다. AI 기능을 쓰려면
Netlify 프로젝트의 환경변수에 API 키를 넣어주세요.

```
ANTHROPIC_API_KEY = sk-ant-...
```

키가 없어도 앱은 정상 동작합니다 — 사진 대신 직접 입력/붙여넣기로 단어를 추가하고,
예문은 품사별 기본 문장으로 대체됩니다(우아한 열화).

## 구조

| 경로 | 설명 |
| --- | --- |
| `src/App.jsx` | 앱 셸 — 상태·라우팅·저장·설정 |
| `src/screens/` | 홈 / 학습 / 오늘의 문장 / 단어장 / 통계 |
| `src/components/` | 공통 UI, 하단 탭바 |
| `src/lib/srs.js` | Leitner 5박스 + D-day 역산 상한 |
| `src/lib/distractors.js` | 오답 선택지 생성 |
| `src/lib/session.js` | 오늘의 큐 구성 + 단계별 문제 생성 |
| `src/lib/storage.js` | localStorage 배치 저장 계층 |
| `src/lib/seed.js` | 기본 단어장(수능 필수 60) |
| `netlify/functions/` | `ocr` · `sentences` · `meanings` 서버리스 함수 |

## 개발 순서 (기획서 기준)

v1 수동 입력 + 4지선다 + Leitner → v2 사진 OCR → v3 AI 예문/재활용 → v4 D-day 역산·통계 —
네 단계를 모두 구현했습니다.
