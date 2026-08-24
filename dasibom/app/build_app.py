# -*- coding: utf-8 -*-
"""app/index.html 만들기 — 템플릿 + data/*.js 를 하나로 합칩니다.

  실행:  cd app && python3 build_app.py

데이터를 고쳤으면 이 스크립트를 다시 돌려야 index.html 에 반영됩니다.
브라우저와 아티팩트 미리보기는 외부 js 파일을 못 읽어서, 한 파일로 합쳐 둡니다.
"""
import io, os, glob

HERE = os.path.dirname(os.path.abspath(__file__))
tpl = io.open(os.path.join(HERE, "_template.html"), encoding="utf-8").read()

files = sorted(glob.glob(os.path.join(HERE, "data", "*.js")))
if not files:
    raise SystemExit("data/ 안에 데이터 파일이 없습니다.")

blocks = []
for f in files:
    body = io.open(f, encoding="utf-8").read()
    blocks.append(f"<!-- {os.path.basename(f)} -->\n<script>\n{body}\n</script>")

out = tpl.replace("<!--DATA-->", "\n".join(blocks))
io.open(os.path.join(HERE, "index.html"), "w", encoding="utf-8").write(out)

print(f"index.html 생성 완료 — 단원 {len(files)}개")
for f in files:
    print("  ·", os.path.basename(f))
