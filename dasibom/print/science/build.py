# -*- coding: utf-8 -*-
import io
t = io.open("trees2.html", encoding="utf-8").read()
BLANK = t.split("<!--BLANK-->")[1].strip()
BLANK = BLANK.replace('<span class="bx rt">힘</span>',
    '<span class="bx rt">힘</span>'
    '<div class="rootnote">물체의 <span class="ub"></span>이나 '
    '<span class="ub"></span>를 바꾸는 원인</div>', 1)

CSS = """
@page{size:A4;margin:15mm 15mm 15mm 15mm;}
*{box-sizing:border-box;}
body{font-family:'Noto Sans CJK KR',sans-serif;color:#1A1A1A;
  font-size:13pt;line-height:1.65;margin:0;}
.pg{page-break-after:always;}
.pg:last-child{page-break-after:auto;}
b{font-weight:700;}
.hl{background:#FFF0A8;padding:0 1.5mm;}

.hd{border-bottom:2.5px solid #1A1A1A;padding-bottom:4mm;margin-bottom:7mm;}
.hd table{width:100%;border-collapse:collapse;}
.hd .t{font-family:'Noto Serif CJK KR',serif;font-size:20pt;color:#1A1A1A;}
.hd .t .kind{margin-left:5mm;vertical-align:middle;}
.hd .s{font-size:11pt;color:#777;text-align:right;vertical-align:bottom;}
.lead{font-size:12.5pt;color:#444;margin:0 0 8mm;line-height:1.9;}

/* 트리 */
.map{border:2px solid #1A1A1A;border-radius:4mm;padding:12mm 5mm;text-align:center;}
table.sub{border-collapse:collapse;margin:0 auto;}
table.sub > tbody > tr > td{text-align:center;vertical-align:top;padding:0 1mm;}
table.cn{border-collapse:collapse;width:100%;table-layout:fixed;}
table.cn td{height:0;padding:0;}
table.cn td.b{border-bottom:1.8px solid #1A1A1A;}
table.st{border-collapse:collapse;width:100%;table-layout:fixed;}
table.st td{padding:0;text-align:center;}
.vl{width:1.8px;height:11mm;background:#1A1A1A;margin:0 auto;}
.bx{display:inline-block;border:1.8px solid #1A1A1A;border-radius:2.5mm;
  padding:3mm 3mm;font-size:12pt;background:#fff;white-space:nowrap;}
.bx.rt{background:#1A6B4C;color:#fff;border-color:#1A6B4C;font-size:17pt;padding:4mm 11mm;}
.bx.l1{border-width:2.4px;min-width:30mm;}
.bx.bl{color:#fff;min-width:17mm;padding-top:8mm;padding-bottom:8mm;}
.bx.l1.bl{min-width:30mm;}
.bx.l3.bl{min-width:17mm;}
.rootnote{font-size:12.5pt;color:#333;margin:3.5mm 0 0;}
.ub{display:inline-block;border-bottom:1.6px solid #1A1A1A;min-width:24mm;}

/* 카드 */
.one{border:1.8px solid #1A1A1A;border-radius:3mm;padding:6mm 7mm;margin-top:8mm;}
.one .t{font-size:14pt;font-weight:700;margin-bottom:2mm;}
.one .t small{font-weight:400;color:#777;font-size:12pt;}
.one p{font-size:12.5pt;color:#333;margin:0;line-height:2.4;}
.line{border-bottom:1.4px solid #BBB;height:15mm;}

/* 개념 양식 */
.kind{font-size:11.5pt;color:#2A4A3A;background:#DFF0E4;border-radius:6mm;
  padding:1.4mm 5mm;display:inline-block;font-weight:600;
  border:1.2px solid #A9CDB6;}
.cname{font-family:'Noto Serif CJK KR',serif;font-size:21pt;margin:0;color:#14261C;
  padding:3.5mm 6mm;border-radius:2.5mm;border:1.6px solid #1A1A1A;display:block;}
.cname .q{font-family:'IBM Plex Sans KR','Noto Sans CJK KR',sans-serif;
  font-size:12.5pt;color:#3A4A41;font-weight:400;}
.t1{background:#F1F9F3;} .t2{background:#E4F2E8;}
.t3{background:#D6EBDC;} .t4{background:#C8E4D1;}
.tp{background:#FBF3DC;}
.trg{font-size:14pt;color:#444;margin:2mm 0 0;}

.sec{font-size:15pt;font-weight:700;margin:0 0 3mm;color:#1A1A1A;}
.sec .h{background:#CFEBD6;padding:1mm 3mm;border-radius:1.5mm;}
.sec small{font-weight:400;color:#777;font-size:11.5pt;}
.gap{height:6mm;}

table.grid{width:100%;border-collapse:collapse;}
table.grid th,table.grid td{border:1.6px solid #1A1A1A;padding:4mm 5mm;
  font-size:13.5pt;vertical-align:top;text-align:left;}
table.grid th{background:#FBF3DC;font-weight:500;width:44mm;font-size:13pt;}
table.grid td.fill{height:22mm;}
table.grid tr{height:0;}
table.grid th{white-space:nowrap;}

table.ex{width:100%;border-collapse:collapse;table-layout:fixed;}
table.ex th{background:#FBF3DC;border:1.6px solid #1A1A1A;padding:3.5mm;
  font-size:12.5pt;font-weight:500;}
table.ex td{border:1.6px solid #1A1A1A;height:17mm;padding:2.5mm;vertical-align:top;}
table.ex th.ar,table.ex td.ar{border:none;width:4%;text-align:center;
  color:#1A1A1A;font-size:14pt;background:none;height:auto;
  vertical-align:middle;padding:0;}
.exnote{font-size:11.5pt;color:#666;margin:0 0 2.5mm;line-height:1.7;}

.draw{border:1.8px dashed #999;border-radius:3mm;height:74mm;position:relative;}
.draw .cap{position:absolute;top:3.5mm;left:5mm;font-size:12pt;color:#999;}

table.wr{width:100%;border-collapse:collapse;}
table.wr th{background:#FBF3DC;border:1.6px solid #1A1A1A;padding:3mm;
  font-size:12.5pt;font-weight:500;}
table.wr td{border:1.6px solid #1A1A1A;height:14mm;}

/* 오답노트 */
table.w1{width:100%;border-collapse:collapse;}
table.w1 td{border:1.6px solid #1A1A1A;padding:3.5mm 4mm;font-size:13pt;height:14mm;}
table.w1 td.k{background:#FBF3DC;width:26mm;font-size:12.5pt;}
.why{border:2.4px solid #1A1A1A;border-radius:3mm;padding:5mm;background:#FFFDF2;}
.why .t{font-size:14pt;font-weight:700;margin-bottom:3mm;}
.why .t small{font-weight:400;color:#777;font-size:12pt;}
.why .sp{height:17mm;border-bottom:1.4px solid #DDD;}
.two{display:table;width:100%;border-collapse:collapse;}
.two > div{display:table-cell;width:50%;padding-right:4mm;}
.two > div:last-child{padding-right:0;padding-left:4mm;}
.mini{border:1.6px solid #1A1A1A;border-radius:3mm;padding:3.5mm;}
.mini .t{font-size:12.5pt;margin-bottom:2mm;font-weight:500;}
.mini .sp{height:20mm;}
".box{border:1.6px solid #1A1A1A;border-radius:3mm;}
.ruled{border:1.6px solid #1A1A1A;border-radius:3mm;padding:4mm 5mm 0;}
.ruled div{border-bottom:1.2px dotted #9A9A9A;height:11mm;}
.ruled div:last-child{border-bottom:none;}
table.grid th.hj{background:#FBF3DC;font-family:'Noto Serif CJK KR',serif;
  font-size:17pt;text-align:center;}
.foot{font-size:12pt;color:#666;margin-top:7mm;line-height:2.0;}

/* 페이지별 세로 채우기 */
.hjbar{border:1.4px solid #1A1A1A;border-radius:2mm;background:#FBF3DC;
  padding:3mm 4mm;font-size:11pt;line-height:1.7;}
.hjbar .hlab{display:inline-block;background:#CFEBD6;border-radius:1.5mm;
  padding:0.8mm 3mm;font-size:10.5pt;font-weight:700;margin-right:3mm;}
.hjbar .hc{font-family:'Noto Serif CJK KR',serif;font-size:14pt;}
.hjbar .hm{font-size:10.5pt;color:#3A4A41;}
.hjbar .hsep{margin:0 2mm;color:#7B8A81;}
.hjbar .hdesc{font-size:11pt;}
.p-force table.grid td.fill{height:15mm;}
.p-force table.ex td{height:13mm;}
.p-force .draw{height:31mm;}
.p-force table.wr td{height:14mm;}

.p-pair table.grid td.fill{height:13mm;}
.p-pair table.ex td{height:13mm;}
.p-pair table.wr td{height:14mm;}
.p-pair .gap{height:6mm;}

.p-wrong .gap{height:12mm;}
.p-wrong table.w1 td{height:18mm;}
.p-wrong .why .sp{height:27mm;}
.p-wrong .mini .sp{height:31mm;}

.p-one .one{margin-top:6mm;padding:6mm 7mm;}
.p-one .line{height:13mm;}

.p-solo .gap{height:6mm;}
.p-solo table.w1 td{height:20mm;}
.p-solo .why .sp{height:29mm;}
.p-solo .mini .sp{height:38mm;}
.p-solo .box{height:26mm !important;}
.p-solo .lead{margin-bottom:6mm;}
.pg > *:last-child{margin-bottom:0;}
.p-wrong .box:last-child{margin-bottom:0;}
"""


def head(title, no):
    return (f'<div class="hd"><table><tr><td class="t">{title}</td>'
            f'<td class="s">중1 과학 · 힘의 작용 · {no}</td></tr></table></div>')

def ex_table(rows, cols):
    h = (f'<tr><th style="width:30%">{cols[0]}</th><th class="ar"></th>'
         f'<th style="width:30%">{cols[1]}</th><th class="ar"></th>'
         f'<th style="width:30%">{cols[2]}</th></tr>')
    body = "".join('<tr><td></td><td class="ar">→</td><td></td>'
                   '<td class="ar">→</td><td></td></tr>' for _ in range(rows))
    return f'<table class="ex">{h}{body}</table>'

def q_box(n=4):
    return ('<div class="ruled" style="background:#FDF8EA">'
            + "".join("<div></div>" for _ in range(n)) + '</div>')

FORCES = [
 ("중력", "무엇이 · 무엇을 · 어느 쪽으로 당기는가?",
  "예) 손에서 공을 놓았다 → 공이 아래로 떨어졌다 → 지구가 공을 지구 중심 쪽으로 당긴다",
  [("重", "무거운 쪽으로"), ("力", "힘")],
  "重은 <b>무거운 쪽</b>. 다만 <b>중력과 무게는 다릅니다</b> &mdash; 무게는 중력의 크기일 뿐입니다."),
 ("탄성력", "무엇이 · 누구에게 · 어느 쪽으로 작용하는가?",
  "예) 고무줄을 손가락에 걸고 당겼다 → 고무줄이 늘어났다 → 고무줄이 손가락을 당긴다",
  [("彈", "튈 탄"), ("性", "성질")],
  "彈은 <b>튄다</b>는 뜻 &mdash; 눌렀다 놓으면 튀어 오르는 성질이 글자에 있습니다."),
 ("마찰력", "어디에서 생기고 · 어느 쪽으로 작용하는가?",
  "예) 굴러가던 공이 잔디밭을 지났다 → 공이 점점 느려졌다 → 잔디가 공을 뒤쪽으로 붙잡는다",
  [("摩", "문지를 마"), ("擦", "비빌 찰")],
  "둘 다 <b>맞대고 문지른다</b>는 뜻 &mdash; 두 면이 닿아야 생긴다는 조건이 글자에 있습니다."),
 ("부력", "어떤 곳에서 · 어느 쪽으로 미는가?",
  "예) 튜브를 물속으로 눌렀다 → 튜브가 자꾸 떠오르려 했다 → 물이 튜브를 위쪽으로 민다",
  [("浮", "뜰 부"), ("力", "힘")],
  "浮는 <b>뜬다</b>는 뜻이라 방향이 글자에 있습니다. 가라앉는 물체에도 작용합니다."),
]

def force_page(i, name, trigger, ex, hanja=None, hnote=None):
    hj = ""
    if hanja:
        chars = " + ".join(f'<b class="hc">{c}</b> <span class="hm">{m}</span>' for c, m in hanja)
        hj = (f'<div class="hjbar"><span class="hlab">한자로 풀어 보기</span>'
              f'<span class="hchars">{chars}</span><span class="hsep">&mdash;</span>'
              f'<span class="hdesc">{hnote}</span></div><div class="gap"></div>')
    return f'''<div class="pg p-force">
  {head('개념 정리 <span class="kind">현상과 원리</span>', f"워크북 {2+i}")}
  <div class="cname t{i+1}">{name}<span class="q"> &nbsp;&mdash;&nbsp; {trigger}</span></div>
  <div class="gap"></div>

  <div class="sec"><span class="h">나의 언어로 설명하기</span></div>
  <table class="grid">
    <tr><th>누가</th><td class="fill"></td></tr>
    <tr><th>누구에게</th><td class="fill"></td></tr>
    <tr><th>어느 쪽으로</th><td class="fill"></td></tr>
    <tr><th>크기를 정하는 것</th><td class="fill"></td></tr>
  </table>
  <div class="gap"></div>

  <div class="sec"><span class="h">일상생활의 예시로 설명하기</span></div>
  <p class="exnote">{ex}</p>
  {ex_table(3, ("어떤 상황에서","무엇이 어떻게 되었나","그래서 힘은 어느 쪽으로"))}
  <div class="gap"></div>

  {hj}
  <div class="sec"><span class="h">그림으로 나타내기</span>
    <small>교과서 그림을 보고 따라 그린 뒤, 힘을 화살표로 표시하세요</small></div>
  <div class="draw"><span class="cap">작용점(●)에서 시작 · 방향은 화살표 · 길이는 크기</span></div>
  <div class="gap"></div>

  <div class="sec"><span class="h">궁금한 점</span>
    <small>읽다가 막힌 것, 더 알고 싶은 것을 자유롭게 쓰세요</small></div>
  {q_box()}
</div>'''

pages = []

for i,u in enumerate(FORCES):
    pages.append(force_page(i, *u))

# 6. 헷갈리는 개념
pages.append(f'''<div class="pg p-pair">
  {head('헷갈리는 개념 <span class="kind">성질</span>', "워크북 6")}
  <div class="cname tp">질량과 무게<span class="q"> &nbsp;&mdash;&nbsp; 달에 가면 변하는 것은 무엇이고, 변하지 않는 것은 무엇인가?</span></div>
  <div class="gap"></div>

  <div class="sec"><span class="h">나란히 놓고 다른 점 채우기</span></div>
  <table class="grid">
    <tr><th>구분</th><th style="width:auto;text-align:center">질량</th>
        <th style="width:auto;text-align:center">무게</th></tr>
    <tr><th>무엇인가</th><td class="fill"></td><td class="fill"></td></tr>
    <tr><th>단위</th><td class="fill"></td><td class="fill"></td></tr>
    <tr><th>장소가 바뀌면</th><td class="fill"></td><td class="fill"></td></tr>
    <tr><th>재는 도구</th><td class="fill"></td><td class="fill"></td></tr>
  </table>
  <div class="gap"></div>

  <div class="sec"><span class="h">한자로 갈라 보기</span></div>
  <table class="grid">
    <tr><th class="hj">質量</th><td>質은 <b>바탕</b> &mdash; 바탕이 되는 것이 얼마나 있는가</td></tr>
    <tr><th class="hj">重力</th><td>重은 <b>무거움</b> &mdash; 얼마나 무겁게 눌리는가</td></tr>
  </table>
  <p class="exnote">글자부터 <b>다른 것을 재고</b> 있습니다. 그래서 단위도 다릅니다.</p>
  <div class="gap"></div>

  <div class="sec"><span class="h">일상생활의 예시로 설명하기</span></div>
  {ex_table(3, ("어떤 상황에서","무엇이 어떻게 되었나","그래서 무엇을 알 수 있나"))}
  <div class="gap"></div>

  <div class="sec"><span class="h">궁금한 점</span>
    <small>읽다가 막힌 것, 더 알고 싶은 것을 자유롭게 쓰세요</small></div>
  {q_box()}
</div>''')

WRONG_CARD = f'''<table class="w1"><tr>
    <td class="k">날짜</td><td style="width:20%"></td>
    <td class="k">문항 번호</td><td style="width:20%"></td>
    <td class="k">개념</td><td></td>
  </tr></table>
  <div class="gap"></div>

  <div class="sec"><span class="h">문제는 무엇을 묻고 있었나</span>
    <small>한 줄로</small></div>
  <div class="box" style="height:20mm"></div>
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
  <div class="box" style="height:24mm"></div>
  <div class="gap"></div>

  <div class="sec"><span class="h">다음에 이런 문제를 만나면</span>
    <small>무엇을 먼저 확인할까요? 나에게 하는 말로 한 줄 쓰세요</small></div>
  <div class="box" style="height:20mm"></div>'''

pages.append(f'''<div class="pg p-solo">
  {head("오답 노트", "워크북 7")}
  <p class="lead">정답을 옮겨 적는 칸은 작습니다.
  <b>내가 왜 그렇게 생각했는지</b>를 쓰는 칸이 가장 큽니다. 거기에만 답이 있습니다.<br>
  한 문제에 한 장입니다. 틀린 개수만큼 더 인쇄해서 쓰세요.</p>
  {WRONG_CARD}
</div>''')

pages.append(f'''<div class="pg p-one">
  {head("한 장 정리", "워크북 8")}
  <p class="lead">새로 쓰는 장이 아닙니다. 앞에서 <b>걸렸던 것만</b> 옮겨 적습니다.
  다 채우려 하지 마세요. 세 줄이어도 됩니다. 시험 전날 보는 종이는 이 한 장뿐입니다.</p>

  <div class="one" style="margin-top:0">
    <div class="t">지도에서 못 채운 칸 <small>&mdash; 워크북 1</small></div>
    <div class="line"></div><div class="line"></div><div class="line"></div>
  </div>
  <div class="one">
    <div class="t">개념 정리에서 비어 있던 곳 <small>&mdash; 워크북 2~6</small></div>
    <div class="line"></div><div class="line"></div><div class="line"></div><div class="line"></div>
  </div>
  <div class="one">
    <div class="t">두 번 이상 틀린 것 <small>&mdash; 오답 노트</small></div>
    <div class="line"></div><div class="line"></div><div class="line"></div><div class="line"></div>
  </div>
  <div class="one" style="border-color:#1C6746;border-width:2px">
    <div class="t">시험 직전에 딱 하나만 본다면</div>
    <div class="line"></div>
  </div>
  <p class="foot">● 다 적은 뒤 소리 내어 한 번 읽어 보세요. 읽다가 막히는 곳이 아직 안 잡힌 곳입니다.<br>
  ● 이 장이 길어지면 공부가 덜 된 것입니다. 짧을수록 잘 된 것입니다.</p>
</div>''')

def wrap(body):
    return ('<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">'
            f'<style>{CSS}</style></head><body>{body}</body></html>')

io.open("wb3.html","w",encoding="utf-8").write(wrap("\n".join(pages)))

MAP_CSS = CSS.replace("@page{size:A4;margin:15mm 15mm 15mm 15mm;}",
                      "@page{size:A4 landscape;margin:14mm;}") + """
.map{padding:9mm 4mm;}
.vl{height:11mm;}
.bx{padding:3mm 2.5mm;font-size:12pt;}
.bx.bl{min-width:19mm;padding-top:7mm;padding-bottom:7mm;}
.bx.l1.bl{min-width:34mm;}
table.sub > tbody > tr > td{padding:0 0.8mm;}
"""
io.open("map.html","w",encoding="utf-8").write(
  '<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">'
  f'<style>{MAP_CSS}</style></head><body>'
  f'''<div class="pg p-map">
  {head("단원 지도 채우기", "워크북 1")}
  <p class="lead">칸과 선은 그대로 있고 <b class="hl">글자만 비어</b> 있습니다.
  기억나는 곳부터 채우세요. 막히면 그 칸은 비워 두었다가 나중에 다른 색으로 채우면,
  무엇이 약한지 한눈에 보입니다.</p>
  <div class="map">{BLANK}</div>
</div>''' + "</body></html>")
io.open("wrong2.html","w",encoding="utf-8").write(wrap(
    f'''<div class="pg p-solo">{head("오답 노트","필요한 만큼 인쇄")}
    <p class="lead">한 문제에 한 장입니다. 틀린 개수만큼 인쇄해서 쓰세요.<br>
    <b>내가 왜 그렇게 생각했는지</b>를 쓰는 칸이 가장 큽니다. 거기에만 답이 있습니다.</p>
    {WRONG_CARD}</div>'''))
print("built")
