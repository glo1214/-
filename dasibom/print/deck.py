# -*- coding: utf-8 -*-
"""앱 화면 소개 PDF — 화면 크게, 설명은 아래 가로로"""
import io, base64

def b64(p): return base64.b64encode(open(p,"rb").read()).decode()

SLIDES = [
 ("표지", None, None, None),

 ("① 지도 보기", "01_map_closed_x.png", "단원 전체가 한 화면에",
  "오늘 배운 것이 단원 어디쯤인지 먼저 봅니다. 가지는 <b>접혀 있습니다</b> — "
  "누르기 전에 무엇이 들어갈지 짐작하게 하려는 것입니다. 짐작이 곧 기억을 꺼내는 연습이 됩니다."),

 ("① 지도 보기", "03_map_open2_x.png", "한 번에 한 갈래만 열립니다",
  "여러 갈래를 동시에 펼치면 요약본이 되어 버립니다. "
  "네 가지 힘은 <b>닿아야 생기는지</b>로 갈라 두었습니다. 중력만 혼자 떨어져 있는 까닭이 그림으로 보입니다."),

 ("② 개념 읽기", "04_concept_blank_x.png", "빈칸으로 시작합니다",
  "답을 먼저 보여 주지 않습니다. 교과서를 펴서 <b>직접 찾아 채우게</b> 합니다. "
  "쪽수를 알려 주지 않는 것도 일부러입니다 — 찾는 동안 이 개념이 단원 어디쯤인지 한 번 더 보게 됩니다."),

 ("② 개념 읽기", "05_concept_filled_x.png", "채운 뒤에 대조합니다",
  "채점하지 않습니다. 학생이 쓴 것과 정답을 <b>나란히</b> 보여 줄 뿐입니다. "
  "주어와 방향 두 곳에만 형광펜이 켜집니다 — 오개념이 가장 많이 생기는 자리이기 때문입니다."),

 ("② 개념 읽기", "06_concept_elastic_x.png", "네 가지 힘이 모두 같은 칸",
  "누가 · 누구에게 · 어느 쪽으로. 형식이 반복되니 <b>새로운 힘을 만나도 무엇을 물어야 할지</b> 압니다. "
  "탄성력에서 ‘누구에게’가 비어 있습니다. 여기가 가장 많이 틀리는 곳입니다."),

 ("③ 개념 말하기", "07_say_empty_x.png", "자기 말로 써 봅니다",
  "교과서 문장을 옮겨 적는 것으로는 알 수 없습니다. <b>자기 말로 바꿔 말할 수 있어야</b> 이해한 것입니다."),

 ("③ 개념 말하기", "08_say_diagnosed_x.png", "빠진 것만 짚어 줍니다",
  "정답을 바로 알려 주지 않습니다. 무엇이 있고 무엇이 빠졌는지 표시한 뒤 "
  "<b>다시 생각하게 하는 질문</b>을 하나 건넵니다. "
  "여기서는 방향이 빠진 것을 잡아내고 “지구 반대편 사람에게는?”이라고 되묻습니다."),

 ("④ 개념 확인하기", "09_quiz_x.png", "소단원마다 한 문제씩",
  "맞히려고 푸는 문제가 아니라 <b>어디가 흔들리는지 보려고</b> 푸는 문제입니다. "
  "O/X, 사례 판단, 짝 맞추기를 섞습니다."),

 ("④ 개념 확인하기", "10_quiz_wrong_x.png", "오답지가 곧 진단입니다",
  "고른 답이 그대로 어떤 오개념인지를 알려 줍니다. <b>찍기로 뚫리는 문항에는 까닭을 쓰게</b> 합니다. "
  "한 번 틀린 것은 넘어가고, 같은 곳에서 두 번 틀렸을 때만 짚습니다."),

 ("과목이 늘어도", "11_social_map_x.png", "같은 틀, 다른 내용",
  "화면은 한 벌이고 과목별 내용만 갈아 끼웁니다. 사회는 "
  "<b>나는 어떻게 지금의 내가 되었나 → 어디에 서 있나 → 부딪힐 때는</b> "
  "세 갈래가 하나의 이야기로 이어집니다."),

 ("과목이 늘어도", "13_social_concept_x.png", "과목에 맞게 칸이 달라집니다",
  "과학은 누가·누구에게·어느 쪽으로 세 칸이지만, 사회는 <b>교과서 소제목이 그대로 칸</b>이 됩니다. "
  "낱말 뜻이 아니라 소단원 하나를 설명할 수 있는지를 봅니다."),

 ("과목이 늘어도", "15_social_quiz_x.png", "차이와 차별, 어디서 갈리나",
  "사회에서 가장 많이 헷갈리는 지점입니다. 사례를 주고 판단하게 한 뒤 "
  "<b>까닭을 쓰게</b> 합니다. 찍기로는 넘어갈 수 없습니다."),

 ("마지막", None, None, None),
]

CSS = """
@page{margin:0;}
*{box-sizing:border-box;}
html,body{margin:0;padding:0;background:#F5F8F5;}
body{font-family:'Noto Sans CJK KR',sans-serif;color:#1A1A1A;}
.pg{width:100%;height:1030px;page-break-after:always;position:relative;overflow:hidden;}
.pg:last-child{page-break-after:auto;}

/* 표지 */
.cover{display:table;width:100%;height:100%;}
.cover .in{display:table-cell;vertical-align:middle;text-align:center;padding:0 120px;}
.cover h1{font-family:'Noto Serif CJK KR',serif;font-size:76pt;margin:0;letter-spacing:-.02em;}
.cover .sub{font-size:21pt;color:#2E3F36;margin-top:14px;}
.cover .line{width:150px;height:4px;background:#1A6B4C;margin:44px auto;}
.cover .desc{font-size:19pt;line-height:2.05;color:#1A1A1A;}
.cover .desc b{background:#FFF0A8;padding:0 6px;}
.cover .foot{font-size:16pt;color:#3A4A41;margin-top:52px;}

/* 본문 */
.head{padding:44px 70px 0;}
.head .step{display:inline-block;font-size:15pt;color:#14512F;font-weight:700;
  background:#DFF0E4;border:1.5px solid #A9CDB6;border-radius:30px;padding:5px 20px;}
.head h2{font-family:'Noto Serif CJK KR',serif;font-size:33pt;margin:16px 0 0;}

.shot{padding:26px 70px 0;text-align:center;}
.shot > img{border:2px solid #B4C7BB;border-radius:14px;background:#fff;}

.two{display:table;width:100%;border-collapse:separate;border-spacing:20px 0;}
.two .c{display:table-cell;width:50%;vertical-align:top;text-align:center;}
.two .c img{width:100%;border:2px solid #B4C7BB;border-radius:14px;background:#fff;}

.note{margin:34px 70px 0;border-top:2.5px solid #1A1A1A;padding-top:26px;}
.note p{font-size:20pt;line-height:1.8;margin:0;color:#1A1A1A;}

/* 마지막 */
.last{display:table;width:100%;height:100%;}
.last .in{display:table-cell;vertical-align:middle;padding:0 90px;}
.last h2{font-family:'Noto Serif CJK KR',serif;font-size:42pt;margin:0 0 40px;text-align:center;}
table.sum{width:100%;border-collapse:collapse;}
table.sum th{background:#DFF0E4;border:2px solid #1A1A1A;padding:16px;font-size:19pt;font-weight:700;}
table.sum td{border:2px solid #1A1A1A;padding:22px;font-size:17pt;line-height:1.8;
  vertical-align:top;background:#fff;color:#1A1A1A;}
table.sum td .w{font-weight:700;display:block;margin-bottom:8px;}
.last .foot{font-size:18pt;color:#1A1A1A;margin-top:40px;text-align:center;line-height:1.9;}
"""

from PIL import Image
AVAIL_W, AVAIL_H = 1316, 650     # 슬라이드 안에서 쓸 수 있는 폭·높이(px 환산)

def fit(img):
    """세로를 최대한 채우도록 폭(%)을 계산"""
    w, h = Image.open(img).size
    want_w = AVAIL_H * (w / h)           # 높이를 다 쓸 때 필요한 폭
    pct = min(96, round(want_w / AVAIL_W * 100))
    return max(40, pct)

def page(title, img, tag, note):
    if title == "표지":
        return """<div class="pg"><div class="cover"><div class="in">
          <h1>다시봄</h1>
          <div class="sub">글로온 &middot; 글로, 생각을 켜다</div>
          <div class="line"></div>
          <div class="desc">
            교과서를 다시 읽어도 시험에서 막히는 일이 많습니다.<br>
            읽을 때는 아는 것 같지만, <b>눈으로 읽은 것과 아는 것은 다르기</b> 때문입니다.<br>
            다시봄은 배운 내용을 <b>자기 말로 다시 말해 보게</b> 합니다.
          </div>
          <div class="foot">중학교 1학년 &middot; 과학 「힘의 작용」 &middot; 사회 「인간과 사회생활」</div>
        </div></div></div>"""
    if title == "마지막":
        return """<div class="pg"><div class="last"><div class="in">
          <h2>네 단계, 하루 20분</h2>
          <table class="sum">
            <tr><th style="width:25%">지도 보기</th><th style="width:25%">개념 읽기</th>
                <th style="width:25%">개념 말하기</th><th>개념 확인하기</th></tr>
            <tr>
              <td><span class="w">큰 그림</span>오늘 배운 것이 단원 어디쯤인지 확인합니다.</td>
              <td><span class="w">교과서로</span>빈칸을 채우며 직접 찾아 읽습니다.</td>
              <td><span class="w">자기 말로</span>설명하고 빠진 부분을 짚어 받습니다.</td>
              <td><span class="w">확인</span>문제를 풀며 어디가 흔들리는지 봅니다.</td>
            </tr>
          </table>
          <div class="foot">
            이해하고 말하는 일은 화면에서, 풀고 그리는 일은 종이에서 합니다.<br>
            계산과 그림은 손으로 해야 어디서 틀렸는지 남기 때문입니다.
          </div>
        </div></div></div>"""
    pct = fit(img)
    inner = f'<img style="width:{pct}%" src="data:image/png;base64,{b64(img)}">'
    return f"""<div class="pg">
      <div class="head"><span class="step">{title}</span><h2>{tag}</h2></div>
      <div class="shot">{inner}</div>
      <div class="note"><p>{note}</p></div>
    </div>"""

html = ('<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">'
        f'<style>{CSS}</style></head><body>'
        + "".join(page(*s) for s in SLIDES) + '</body></html>')
io.open("deck2.html","w",encoding="utf-8").write(html)
print("built", len(SLIDES), "장")
