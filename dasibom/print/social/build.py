# -*- coding: utf-8 -*-
import io
t = io.open("trees_s.html", encoding="utf-8").read()
BLANK = t.split("<!--BLANK-->")[1].strip()
BLANK = BLANK.replace('<span class="bx rt">인간과 사회생활</span>',
    '<span class="bx rt">인간과 사회생활</span>'
    '<div class="rootnote">사회 속에서 나는 어떻게 만들어지고, 어떻게 어울려 사는가</div>', 1)

CSS = open("/mnt/user-data/outputs/dasibom/print/science/build.py", encoding="utf-8").read()
CSS = CSS[CSS.index('CSS = """')+9 : CSS.index('"""', CSS.index('CSS = """')+10)]
# 개념 농도 → 사회용 6단계로 확장
CSS = CSS.replace(".t1{background:#F1F9F3;} .t2{background:#E4F2E8;}\n.t3{background:#D6EBDC;} .t4{background:#C8E4D1;}",
".t1{background:#F4FAF6;} .t2{background:#EBF5EE;}\n.t3{background:#E1F0E6;} .t4{background:#D7EBDE;}\n.t5{background:#CDE6D6;} .t6{background:#C3E1CE;}")
CSS += """
.subq{font-size:12pt;color:#444;margin:1.5mm 0 0;}
table.grid th.wide{width:62mm;}
.hjbar{border:1.4px solid #1A1A1A;border-radius:2mm;background:#FBF3DC;
  padding:3mm 4mm;font-size:11pt;line-height:1.7;}
.hjbar .hlab{display:inline-block;background:#CFEBD6;border-radius:1.5mm;
  padding:0.8mm 3mm;font-size:10.5pt;font-weight:700;margin-right:3mm;}
.hjbar .hc{font-family:'Noto Serif CJK KR',serif;font-size:14pt;}
.hjbar .hm{font-size:10.5pt;color:#3A4A41;}
.hjbar .hsep{margin:0 2mm;color:#7B8A81;}
.hjbar .hdesc{font-size:11pt;}
.p-solo .gap{height:12mm;}
.p-solo table.w1 td{height:24mm;}
.p-solo .why .sp{height:32mm;}
.p-solo .mini .sp{height:43mm;}
.p-force table.grid td.fill{height:17mm;}
.p-force table.ex td{height:16mm;}
.p-force .ruled div{height:10mm;}
.p-one .line{height:15mm;}
.p-one .one{margin-top:9mm;}
"""

def head(title, no):
    return (f'<div class="hd"><table><tr><td class="t">{title}</td>'
            f'<td class="s">중1 사회 · 인간과 사회생활 · {no}</td></tr></table></div>')

def ex_table(rows, cols):
    h = (f'<tr><th style="width:30%">{cols[0]}</th><th class="ar"></th>'
         f'<th style="width:30%">{cols[1]}</th><th class="ar"></th>'
         f'<th style="width:30%">{cols[2]}</th></tr>')
    body = "".join('<tr><td></td><td class="ar">→</td><td></td>'
                   '<td class="ar">→</td><td></td></tr>' for _ in range(rows))
    return f'<table class="ex">{h}{body}</table>'

def q_box(n=5):
    return ('<div class="ruled" style="background:#FDF8EA">'
            + "".join("<div></div>" for _ in range(n)) + '</div>')

# 소단원 6개
UNITS = [
 ("사회화란 무엇일까?", "사회화의 의미를 설명할 수 있다",
  ["사회화의 의미와 기능", "사회화 기관", "재사회화"],
  ("어디에서", "무엇을 배웠나", "그것이 왜 필요했나"),
  "예) 초등학교에 들어갔다 → 줄 서는 법을 배웠다 → 여럿이 함께 지내려면 순서가 필요해서",
  [("社會", "사람들이 모인 곳"), ("化", "되어 가다")],
  "化는 <b>되어 간다</b>는 뜻입니다. 사회화가 한 번에 끝나는 일이 아니라 <b>평생 이어지는 과정</b>이라는 것이 글자에 들어 있습니다."),

 ("자아 정체성은 어떻게 형성될까?", "자신의 자아 정체성을 성찰할 수 있다",
  ["자아 정체성의 뜻", "무엇을 통해 형성되나", "청소년기가 중요한 까닭"],
  ("누구를 만나서", "무엇을 느꼈나", "나에게 어떤 영향을 주었나"),
  "예) 담임 선생님이 글쓰기를 칭찬해 주셨다 → 내가 잘하는 게 있구나 싶었다 → 글 쓰는 일을 좋아하게 되었다",
  [("正體", "본디 모습"), ("性", "성질")],
  "正體는 <b>본디 모습</b>입니다. 남이 정해 주는 것이 아니라 <b>내가 찾아내는 것</b>이라는 뜻이 담겨 있습니다."),

 ("나의 사회적 지위와 역할은?", "사회적 지위와 역할의 의미를 설명할 수 있다",
  ["사회적 지위란", "귀속 지위와 성취 지위", "역할과 역할 행동"],
  ("어떤 자리에서", "무엇이 기대되나", "나는 실제로 어떻게 했나"),
  "예) 우리 반 서기 → 회의 내용을 빠짐없이 적기 → 급한 날은 요점만 적고 나중에 채워 넣었다",
  [("歸屬", "딸려 있음"), ("成就", "이루어 냄")],
  "歸屬은 <b>딸려 있다</b>, 成就는 <b>이루어 낸다</b>는 뜻입니다. 태어나면서 딸려 온 것과 내가 이뤄 낸 것 &mdash; 글자만 봐도 갈립니다."),

 ("역할 갈등에 어떻게 대응해야 할까?", "역할 갈등에 대응하는 방법을 찾을 수 있다",
  ["역할 갈등이란", "왜 늘어나고 있나", "대응하는 방법"],
  ("어떤 자리들이", "어떻게 부딪혔나", "나는 무엇을 먼저 했나"),
  "예) 학원 시험날과 동아리 발표날이 겹쳤다 → 둘 다 빠질 수 없었다 → 동아리에 미리 말하고 순서를 바꿨다",
  [("葛", "칡"), ("藤", "등나무")],
  "칡은 왼쪽으로, 등나무는 오른쪽으로 감아 올라갑니다. 서로 <b>다른 방향</b>이라 엉킨다는 것이 갈등이라는 말에 그대로 들어 있습니다."),

 ("우리 사회에는 어떤 갈등과 차별이 있을까?", "갈등과 차별의 의미와 양상을 설명할 수 있다",
  ["갈등의 의미와 양상", "차이와 차별은 어떻게 다른가", "차별의 원인"],
  ("누구와 누구 사이에서", "무엇 때문에 부딪혔나", "차이인가 차별인가"),
  "예) 급식 순서를 두고 학년끼리 → 서로 먼저 먹고 싶어서 → 차이 (부당한 대우는 아님)",
  [("差異", "다름"), ("差別", "가려 나눔")],
  "둘 다 差(다를 차)로 시작하지만 뒤가 다릅니다. 異는 <b>다르다</b>, 別은 <b>갈라놓는다</b> &mdash; 다름을 이유로 갈라놓는 순간 차별이 됩니다."),

 ("갈등과 차별에 어떻게 대처해야 할까?", "갈등과 차별에 대처하는 시민의 자질을 기를 수 있다",
  ["갈등에 대처하는 자세", "개인적 차원의 노력", "사회적 차원의 노력"],
  ("어떤 문제를", "누가 무엇을 했나", "무엇이 달라졌나"),
  "예) 계단이 높아 휠체어가 못 올라감 → 학교에 경사로를 놓아 달라고 건의함 → 누구나 드나들 수 있게 됨",
  None, None),
]

KIND = ["현상과 원리","성질","제도와 짝","현상과 원리","성질","방법"]

def unit_page(i, title, goal, subs, cols, ex, hanja=None, hnote=None):
    rows = "".join(f'<tr><th class="wide">{s}</th><td class="fill"></td></tr>' for s in subs)
    hj = ""
    if hanja:
        chars = " + ".join(f'<b class="hc">{c}</b> <span class="hm">{m}</span>' for c, m in hanja)
        hj = (f'<div class="hjbar"><span class="hlab">한자로 풀어 보기</span>'
              f'<span class="hchars">{chars}</span><span class="hsep">&mdash;</span>'
              f'<span class="hdesc">{hnote}</span></div>')
    return f'''<div class="pg p-force">
  {head(f'교과서 정리 <span class="kind">{KIND[i]}</span>', f"워크북 {2+i}")}
  <div class="cname t{i+1}">{title}</div>
  <div class="subq">이 주제를 배우면 &mdash; {goal}</div>
  <div class="gap"></div>

  <div class="sec"><span class="h">소제목별로 정리하기</span>
    <small>교과서를 읽고, 소제목마다 핵심을 한두 문장으로</small></div>
  <table class="grid">{rows}</table>
  <div class="gap"></div>

  <div class="sec"><span class="h">나의 언어로 설명하기</span>
    <small>위 질문에 답한다고 생각하고 세 문장으로</small></div>
  <div class="ruled">{"".join("<div></div>" for _ in range(3))}</div>
  <div class="gap"></div>

  {hj}
  <div class="gap"></div>

  <div class="sec"><span class="h">사례로 확인하기</span></div>
  <p class="exnote">{ex}</p>
  {ex_table(3, cols)}
  <div class="gap"></div>

  <div class="sec"><span class="h">궁금한 점</span>
    <small>읽다가 막힌 것, 더 알고 싶은 것을 자유롭게</small></div>
  {q_box(3 if hanja else 4)}
</div>'''

pages = [unit_page(i, *u) for i, u in enumerate(UNITS)]


# 오답 노트 (워크북 안 한 장)
WRONG_CARD = f'''<table class="w1"><tr>
    <td class="k">날짜</td><td style="width:20%"></td>
    <td class="k">문항 번호</td><td style="width:20%"></td>
    <td class="k">개념</td><td></td>
  </tr></table>
  <div class="gap"></div>

  <div class="sec"><span class="h">문제는 무엇을 묻고 있었나</span> <small>한 줄로</small></div>
  <div class="box" style="height:26mm"></div>
  <div class="gap"></div>

  <div class="why">
    <div class="t">내가 그렇게 생각한 이유
      <small>&mdash; 답을 고를 때 머릿속에 무엇이 떠올랐나요?</small></div>
    <div class="sp"></div><div class="sp"></div>
  </div>
  <div class="gap"></div>

  <div class="two">
    <div><div class="mini"><div class="t">내가 고른 답</div><div class="sp"></div></div></div>
    <div><div class="mini"><div class="t">맞는 답</div><div class="sp"></div></div></div>
  </div>
  <div class="gap"></div>

  <div class="sec"><span class="h">어느 부분이 헷갈렸나요?</span>
    <small>무엇과 무엇을 헷갈렸는지 그대로 쓰세요</small></div>
  <div class="box" style="height:30mm"></div>'''

pages.append(f'''<div class="pg p-solo">
  {head("오답 노트", "워크북 8")}
  <p class="lead">정답을 옮겨 적는 칸은 작습니다.
  <b>내가 왜 그렇게 생각했는지</b>를 쓰는 칸이 가장 큽니다. 거기에만 답이 있습니다.<br>
  한 문제에 한 장입니다. 틀린 개수만큼 더 인쇄해서 쓰세요.</p>
  {WRONG_CARD}
</div>''')

# 한 장 정리
pages.append(f'''<div class="pg p-one">
  {head("한 장 정리", "워크북 9")}
  <p class="lead">새로 쓰는 장이 아닙니다. 앞에서 <b>걸렸던 것만</b> 옮겨 적습니다.
  다 채우려 하지 마세요. 세 줄이어도 됩니다.</p>

  <div class="one" style="margin-top:0">
    <div class="t">지도에서 못 채운 칸 <small>&mdash; 단원 지도</small></div>
    <div class="line"></div><div class="line"></div><div class="line"></div>
  </div>
  <div class="one">
    <div class="t">소제목 칸에서 비어 있던 곳 <small>&mdash; 워크북 2~7</small></div>
    <div class="line"></div><div class="line"></div><div class="line"></div><div class="line"></div>
  </div>
  <div class="one">
    <div class="t">두 번 이상 틀린 것 <small>&mdash; 오답 노트</small></div>
    <div class="line"></div><div class="line"></div><div class="line"></div><div class="line"></div>
  </div>
  <div class="one" style="border-color:#1A1A1A;border-width:2px">
    <div class="t">시험 직전에 딱 하나만 본다면</div>
    <div class="line"></div>
  </div>
</div>''')

def wrap(body, css=None):
    return ('<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">'
            f'<style>{css or CSS}</style></head><body>{body}</body></html>')

io.open("wb_s.html","w",encoding="utf-8").write(wrap("\n".join(pages)))

MAP_CSS = CSS.replace("@page{size:A4;margin:15mm 15mm 15mm 15mm;}",
                      "@page{size:A4 landscape;margin:14mm;}") + """
.map{padding:9mm 4mm;}
.vl{height:11mm;}
.bx{padding:3mm 2.5mm;font-size:11pt;}
.bx.bl{min-width:17mm;padding-top:7mm;padding-bottom:7mm;}
.bx.l1.bl{min-width:30mm;}
table.sub > tbody > tr > td{padding:0 0.8mm;}
"""
io.open("map_s.html","w",encoding="utf-8").write(
  '<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">'
  f'<style>{MAP_CSS}</style></head><body>'
  f'''<div class="pg p-map">
  {head("단원 지도 채우기", "워크북 1")}
  <p class="lead">칸과 선은 그대로 있고 <b class="hl">글자만 비어</b> 있습니다.
  기억나는 곳부터 채우세요. 막히면 그 칸은 비워 두었다가 나중에 다른 색으로 채우면,
  무엇이 약한지 한눈에 보입니다.</p>
  <div class="map">{BLANK}</div>
</div>''' + "</body></html>")
print("built")
