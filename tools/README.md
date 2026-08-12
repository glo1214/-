# tools

## split_emoji.py — 이모티콘 시트 분리

4×4 같은 격자 이미지 한 장을 낱개 이모티콘 파일로 잘라냅니다.

### 준비

```bash
python3 -m pip install pillow
```

### 사용

```bash
# 1) 원본 시트를 리포지토리에 넣는다 (예: assets/emoji-sheet.png)
# 2) 실행
python3 tools/split_emoji.py assets/emoji-sheet.png \
  -o assets/emoji \
  --names tools/emoji-names.txt
```

결과: `assets/emoji/emoji-01-flower-smile.png` … `emoji-16-celebrate.png`
(360×360, 배경 투명)

### 옵션

| 옵션 | 기본값 | 설명 |
| --- | --- | --- |
| `-o, --out` | `emoji` | 출력 디렉터리 |
| `--rows`, `--cols` | 자동 감지 | 격자 크기. 자동 감지가 틀리면 `--rows 4 --cols 4` |
| `--size` | `360` | 출력 한 변 픽셀. 카카오톡 이모티콘은 360, 라인은 370 권장 |
| `--pad` | `0.06` | 정사각형으로 맞출 때 주는 여백 비율 |
| `--bg` | `240` | 배경으로 판단할 밝기 임계값 |
| `--bg-mode` | `flood` | `flood`는 바깥 배경만 지워 흰 옷을 보존, `all`은 밝은 픽셀 전부 제거 |
| `--keep-bg` | 꺼짐 | 배경을 흰색 그대로 둔다 |
| `--no-trim` | 꺼짐 | 칸별 여백 잘라내기 생략 |
| `--names` | 없음 | 파일명 라벨 목록 (한 줄에 하나) |
| `--prefix` | `emoji` | 파일명 접두사 |

### 동작 방식

1. 빈 행/열을 투영해 격자 경계를 찾습니다. 못 찾으면 `--rows`/`--cols`로 균등 분할합니다.
2. 각 칸에서 테두리부터 flood fill 로 바깥 배경만 투명하게 만듭니다.
   선으로 둘러싸인 안쪽 흰색(흰 재킷 등)은 남으므로 어두운 배경에서도 형태가 유지됩니다.
3. 남은 여백을 잘라내고 정사각형으로 패딩한 뒤 `--size` 크기로 저장합니다.
