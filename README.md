# 영단어 암기 앱 · v1

재수생용 영단어 암기 웹앱의 **v1**. 진입 마찰을 없애고(홈은 `오늘 복습 N개 → [시작]`
버튼 하나), Leitner 5박스 + **응답 시간 판정**으로 "아는 것 같은 착각"을 걸러낸다.
틀린 단어는 같은 세션 안에서 알아서 다시 나온다.

- **서버 없음 / 외부 API 없음.** 모든 데이터는 브라우저 `localStorage`에만 저장.
- 발음은 브라우저 내장 `speechSynthesis`(TTS).
- 시드 단어장: **어휘끝 Unit04 체크단어 12개**.

## v1 범위

**만든 것**

- 카드 1 — 영단어 → 뜻 4지선다
- 카드 2 — 한글 문장 빈칸 4지선다 (`koSentence`의 `____` 자리)
- 카드 3 — 문맥 속 뜻 고르기 (`splitBox` 단어의 뜻 구분)
- Leitner 5박스(1/3/7/16/35일) + 응답 시간 판정 + "모르겠어요"
- 선지 뒤집기(정답·오답 전부 해설), 오답·모름 시 어원/연상 카드
- 홈 / 학습 / 단어장 / 설정 4개 화면
- 단어 수동 입력·수정·삭제, 시드 JSON 임포트
- 한글 발음 표기(`ko`·`koStress`) + TTS, 박스 3부터 비계(한글표기·연상) 자동 숨김

**아직 안 만든 것 (v2 이후):** 카드 4~7, 어근 기반 오답 선지, OCR, AI 예문,
통계 화면, D-day 역산·일일 상한.

## 판정 로직 (핵심)

문제 표시~응답까지의 시간을 `ms`로 재서 판정한다. 임계값은 설정에서 바꾸면 즉시 반영.

| 응답 | 처리 |
| --- | --- |
| 정답 & `ms < fast`(기본 2000) | 박스 +1 |
| 정답 & `fast ≤ ms ≤ slow`(기본 6000) | 박스 +1, `weak = true` |
| 정답 & `ms > slow` | 박스 유지, `nextDue = 3일 후` |
| 오답 | 박스 1로, 4~6문제 뒤 재삽입, `confusedWith[고른 단어]++` |
| 모르겠어요 | 박스 1로, 4~6문제 뒤 재삽입, `confusedWith`는 그대로 |

- 세션 내 **재삽입분은 승급시키지 않는다**(`QueueItem.isReinsert`로 명시). 승급 판정은
  `lastSeen`이 오늘이 아닌 문제에서만.
- `splitBox: true`면 뜻마다 progress를 분리(`단어#뜻인덱스`). `false`면 항상 `#0` 하나.

## 데이터 모델 (localStorage 키 3개)

- `wr.profile` — `{ examDate, dailyNew, dailyReviewCap, cardsEnabled, useEtymology, useKoPron, timeThreshold: { fast, slow } }`
- `wr.decks` — 시드 JSON 구조 + 사용자가 추가한 단어
- `wr.progress` — `{ "magnitude#0": { box, nextDue, wrongCount, avgMs, weak, lastSeen, confusedWith }, ... }`

저장은 세션 종료 시 한 번, 이탈 대비로 5문제마다 중간 저장한다.

## 기술 스택

React 18 + Vite + TypeScript. UI 라이브러리·CSS 프레임워크 없음(전역 CSS + 인라인).

```bash
npm install
npm run dev       # 개발 서버
npm run build     # 타입체크 + 프로덕션 빌드 (dist/)
npm run preview   # 빌드 미리보기
npm test          # 판정 로직 단위 + 통합 테스트 (vitest)
```

## 구조

| 경로 | 설명 |
| --- | --- |
| `src/App.tsx` | 앱 셸 — 상태·라우팅·저장 |
| `src/types.ts` | 데이터 모델 |
| `src/lib/scheduler.ts` | Leitner 5박스 + 응답시간 판정 (순수 함수) |
| `src/lib/session.ts` | 세션 큐 구성 + 문제 생성 + 재삽입 |
| `src/lib/distractors.ts` | 오답 선지 생성(v1 규칙) |
| `src/lib/storage.ts` | localStorage 계층 + 시드/임포트 |
| `src/lib/scaffold.ts` | 비계(박스 3+ 숨김) 규칙 |
| `src/lib/date.ts` · `tts.ts` | 날짜 유틸 · 발음 |
| `src/screens/` | 홈 / 학습 / 단어장 / 설정 |
| `src/components/` | 발음·어원 카드, 하단 탭 |
| `src/data/unit04.json` | 시드 단어장(어휘끝 Unit04 12개) |
| `src/lib/*.test.ts` | 판정 로직 단위·통합 테스트 |

## 시드 데이터에 대한 메모

원본 파일(`영단어-암기앱-기획서-v3.md`, `학생-설정-시트-템플릿.md`,
`어휘끝-Unit04-체크단어.json`)이 저장소에 없어, 프롬프트에 기술된 스키마대로 Unit04 12단어
(`magnitude`/`spare`/`vague`는 `splitBox`)를 재구성했다. 실제 단어장이 생기면 **단어장 화면의
JSON 임포트**로 같은 구조를 그대로 대체할 수 있다(루트의 `어휘끝-Unit04-체크단어.json` 참고).
```
