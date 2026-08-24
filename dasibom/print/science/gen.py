# -*- coding: utf-8 -*-
"""워크북 트리 생성 — 완성본 / 글자 없는 빈 틀"""

def n(label, cls="", kids=None):
    return {"l": label, "c": cls, "k": kids or []}

TREE = n("힘", "rt", [
    n("무엇을 바꾸나", "l1", [
        n("모양"),
        n("운동 상태", "", [n("속력", "l3"), n("운동 방향", "l3")]),
    ]),
    n("어떻게 다루나", "l1", [
        n("힘 하나", "", [n("크기", "l3"), n("방향", "l3"), n("작용점", "l3")]),
        n("힘 여럿", "", [n("합력", "l3"), n("평형", "l3")]),
    ]),
    n("어떤 것이 있나", "l1", [
        n("안 닿아도", "", [n("중력", "l3")]),
        n("닿아야", "", [n("탄성력", "l3"), n("마찰력", "l3"), n("부력", "l3")]),
    ]),
])

def render(node, blank=False):
    if blank:
        # 글자를 지우고 칸 모양만 남김 (뿌리는 남겨 기준점 제공)
        label = "힘" if node["c"] == "rt" else "&nbsp;"
        cls = node["c"] + (" bl" if node["c"] != "rt" else "")
    else:
        label, cls = node["l"], node["c"]
    box = f'<span class="bx {cls}">{label}</span>'

    kids = node["k"]
    if not kids:
        return f'<table class="sub"><tr><td>{box}</td></tr></table>'

    m = len(kids)
    if m == 1:
        conn = '<div class="vl"></div>'
    else:
        cells = "".join(
            f'<td class="{"b" if i>0 else "e"}"></td><td class="{"b" if i<m-1 else "e"}"></td>'
            for i in range(m))
        stems = "".join("<td><div class='vl'></div></td>" for _ in kids)
        conn = ('<div class="vl"></div>'
                f'<table class="cn"><tr>{cells}</tr></table>'
                f'<table class="st"><tr>{stems}</tr></table>')

    kc = "".join(f'<td>{render(k, blank)}</td>' for k in kids)
    return (f'<table class="sub"><tr><td colspan="{m}">{box}</td></tr>'
            f'<tr><td colspan="{m}">{conn}</td></tr><tr>{kc}</tr></table>')

if __name__ == "__main__":
    import io
    with io.open("trees2.html", "w", encoding="utf-8") as f:
        f.write("<!--FULL-->\n" + render(TREE) +
                "\n<!--BLANK-->\n" + render(TREE, blank=True))
    print("ok")
