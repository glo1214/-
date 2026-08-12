#!/usr/bin/env python3
"""이모티콘 시트(격자 이미지)를 낱개 파일로 분리한다.

사용 예:
    python3 tools/split_emoji.py assets/emoji-sheet.png -o assets/emoji
    python3 tools/split_emoji.py sheet.png -o out --rows 4 --cols 4 --size 360

기본 동작:
  - 여백(빈 행/열)을 투영해서 격자를 자동으로 찾는다. 실패하면 --rows/--cols로 균등 분할.
  - 흰 배경을 투명으로 바꾸고(--keep-bg로 끄기), 각 칸의 남는 여백을 잘라낸 뒤
    정사각형으로 패딩해서 --size 크기로 저장한다.
"""

import argparse
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow가 필요합니다: python3 -m pip install pillow")


def load_mask(img, bg_threshold):
    """배경이 아닌 픽셀을 True로 갖는 2차원 리스트 대신, 행/열 합계를 반환."""
    rgba = img.convert("RGBA")
    w, h = rgba.size
    px = rgba.load()
    row_ink = [0] * h
    col_ink = [0] * w
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 8 and (r < bg_threshold or g < bg_threshold or b < bg_threshold):
                row_ink[y] += 1
                col_ink[x] += 1
    return row_ink, col_ink


def find_bands(ink, min_gap):
    """잉크가 있는 구간(시작, 끝)들을 찾는다. min_gap보다 짧은 빈 구간은 무시."""
    bands = []
    start = None
    gap = 0
    for i, v in enumerate(ink):
        if v > 0:
            if start is None:
                start = i
            gap = 0
        else:
            if start is not None:
                gap += 1
                if gap >= min_gap:
                    bands.append((start, i - gap + 1))
                    start = None
                    gap = 0
    if start is not None:
        bands.append((start, len(ink)))
    return bands


def even_bands(length, count):
    step = length / count
    return [(int(round(i * step)), int(round((i + 1) * step))) for i in range(count)]


def is_light(px, x, y, t):
    r, g, b, _ = px[x, y]
    return r >= t and g >= t and b >= t


def drop_background(img, bg_threshold, mode):
    """배경을 투명하게. mode='flood'는 바깥 배경만(흰 옷 보존), 'all'은 밝은 픽셀 전부."""
    rgba = img.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size

    if mode == "all":
        for y in range(h):
            for x in range(w):
                if is_light(px, x, y, bg_threshold):
                    r, g, b, _ = px[x, y]
                    px[x, y] = (r, g, b, 0)
        return rgba

    # 테두리에서 시작하는 flood fill — 선으로 둘러싸인 안쪽 흰색(옷 등)은 남는다.
    seen = bytearray(w * h)
    stack = []
    for x in range(w):
        for y in (0, h - 1):
            if is_light(px, x, y, bg_threshold):
                stack.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if is_light(px, x, y, bg_threshold):
                stack.append((x, y))

    while stack:
        x, y = stack.pop()
        idx = y * w + x
        if seen[idx]:
            continue
        seen[idx] = 1
        r, g, b, _ = px[x, y]
        px[x, y] = (r, g, b, 0)
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx]:
                if is_light(px, nx, ny, bg_threshold):
                    stack.append((nx, ny))
    return rgba


def trim(img):
    box = img.getbbox()
    return img.crop(box) if box else img


def square_pad(img, pad_ratio):
    w, h = img.size
    side = int(max(w, h) * (1 + pad_ratio))
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(img, ((side - w) // 2, (side - h) // 2), img)
    return canvas


def read_names(path, count):
    if not path:
        return [None] * count
    names = [
        line.strip()
        for line in Path(path).read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.startswith("#")
    ]
    if len(names) < count:
        names += [None] * (count - len(names))
    return names[:count]


def main():
    ap = argparse.ArgumentParser(description="이모티콘 시트를 낱개 파일로 분리")
    ap.add_argument("sheet", help="원본 격자 이미지 경로")
    ap.add_argument("-o", "--out", default="emoji", help="출력 디렉터리 (기본: emoji)")
    ap.add_argument("--rows", type=int, default=0, help="행 수 (0이면 자동 감지)")
    ap.add_argument("--cols", type=int, default=0, help="열 수 (0이면 자동 감지)")
    ap.add_argument("--size", type=int, default=360, help="출력 한 변 픽셀 (기본: 360)")
    ap.add_argument("--pad", type=float, default=0.06, help="정사각 패딩 비율 (기본: 0.06)")
    ap.add_argument("--bg", type=int, default=240, help="배경으로 볼 밝기 임계값 (기본: 240)")
    ap.add_argument("--keep-bg", action="store_true", help="배경을 투명으로 바꾸지 않음")
    ap.add_argument(
        "--bg-mode",
        choices=("flood", "all"),
        default="flood",
        help="flood=바깥 배경만 제거(흰 옷 보존, 기본), all=밝은 픽셀 전부 제거",
    )
    ap.add_argument("--no-trim", action="store_true", help="칸별 여백 잘라내기 생략")
    ap.add_argument("--names", help="칸 이름 목록 파일 (한 줄에 하나)")
    ap.add_argument("--prefix", default="emoji", help="파일 이름 접두사 (기본: emoji)")
    args = ap.parse_args()

    src = Path(args.sheet)
    if not src.exists():
        sys.exit(f"파일을 찾을 수 없습니다: {src}")

    img = Image.open(src)
    w, h = img.size
    row_ink, col_ink = load_mask(img, args.bg)

    min_gap = max(4, min(w, h) // 60)
    row_bands = find_bands(row_ink, min_gap)
    col_bands = find_bands(col_ink, min_gap)

    if args.rows:
        if len(row_bands) != args.rows:
            row_bands = even_bands(h, args.rows)
    elif len(row_bands) < 2:
        sys.exit("행을 자동으로 찾지 못했습니다. --rows 로 지정하세요.")

    if args.cols:
        if len(col_bands) != args.cols:
            col_bands = even_bands(w, args.cols)
    elif len(col_bands) < 2:
        sys.exit("열을 자동으로 찾지 못했습니다. --cols 로 지정하세요.")

    total = len(row_bands) * len(col_bands)
    names = read_names(args.names, total)

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"격자 {len(row_bands)}행 x {len(col_bands)}열 = {total}칸")

    n = 0
    written = []
    for r, (top, bottom) in enumerate(row_bands):
        for c, (left, right) in enumerate(col_bands):
            tile = img.crop((left, top, right, bottom))
            if args.keep_bg:
                tile = tile.convert("RGBA")
            else:
                tile = drop_background(tile, args.bg, args.bg_mode)
            if not args.no_trim:
                tile = trim(tile)
            tile = square_pad(tile, args.pad)
            if args.size:
                tile = tile.resize((args.size, args.size), Image.LANCZOS)

            label = names[n]
            stem = f"{args.prefix}-{n + 1:02d}" + (f"-{label}" if label else "")
            path = out_dir / f"{stem}.png"
            tile.save(path)
            written.append(path)
            print(f"  [{r + 1},{c + 1}] -> {path}")
            n += 1

    print(f"\n완료: {len(written)}개 파일 -> {out_dir}/")


if __name__ == "__main__":
    main()
