# -*- coding: utf-8 -*-
"""사회 VII단원 트리 생성 — 완성본 / 빈 틀"""

def n(label, cls="", kids=None):
    return {"l": label, "c": cls, "k": kids or []}

TREE = n("인간과 사회생활", "rt", [
    n("나는 어떻게 지금의 내가 되었나", "l1", [
        n("사회화", "", [n("의미와 기능", "l3"), n("사회화 기관", "l3"), n("재사회화", "l3")]),
        n("자아 정체성", "", [n("무엇인가", "l3"), n("어떻게 형성되나", "l3")]),
    ]),
    n("나는 사회에서 어디에 서 있나", "l1", [
        n("지위와 역할", "", [n("사회적 지위", "l3"), n("역할", "l3"), n("역할 행동", "l3")]),
        n("역할 갈등", "", [n("왜 생기나", "l3"), n("어떻게 대응하나", "l3")]),
    ]),
    n("다른 사람과 부딪힐 때는", "l1", [
        n("갈등", "", [n("의미와 양상", "l3"), n("대처 방안", "l3")]),
        n("차별", "", [n("차이와 차별", "l3"), n("원인", "l3"), n("대처 방안", "l3")]),
    ]),
])

def render(node, blank=False):
    if blank:
        label = "인간과 사회생활" if node["c"] == "rt" else "&nbsp;"
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
    with io.open("trees_s.html", "w", encoding="utf-8") as f:
        f.write("<!--FULL-->\n" + render(TREE) +
                "\n<!--BLANK-->\n" + render(TREE, blank=True))
    print("ok")
