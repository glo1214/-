# -*- coding: utf-8 -*-
"""학부모용 안내 한 장 — A4 세로 1장"""
import io

CSS = """
@page{size:A4;margin:15mm 15mm 15mm 15mm;}
*{box-sizing:border-box;}
body{font-family:'Noto Sans CJK KR',sans-serif;color:#1A1A1A;
  font-size:12.5pt;line-height:1.75;margin:0;}
b{font-weight:700;}
.hl{background:#FFF0A8;padding:0 1.5mm;}

.hd{border-bottom:2.5px solid #1A1A1A;padding-bottom:4mm;margin-bottom:6mm;}
.hd table{width:100%;border-collapse:collapse;}
.hd .t{font-family:'Noto Serif CJK KR',serif;font-size:20pt;}
.hd .t small{font-size:12pt;color:#3A4A41;font-weight:400;display:block;margin-top:1.5mm;}
.hd .s{font-size:11pt;color:#3A4A41;text-align:right;vertical-align:bottom;}

.lead{font-size:12.5pt;line-height:1.8;margin:0 0 6mm;}

.sec{font-size:13.5pt;font-weight:700;margin:0 0 3mm;}
.sec .h{background:#CFEBD6;padding:1.2mm 3.5mm;border-radius:1.8mm;}
.gap{height:4mm;}

table.flow{width:100%;border-collapse:collapse;table-layout:fixed;}
table.flow th{background:#F2F2F2;border:1.6px solid #1A1A1A;padding:2.4mm;
  font-size:12pt;font-weight:600;}
table.flow td{border:1.6px solid #1A1A1A;padding:2.6mm 4mm;font-size:11pt;
  vertical-align:top;line-height:1.8;}
table.flow td .when{font-weight:700;display:block;margin-bottom:1.5mm;}

.steps{width:100%;border-collapse:collapse;table-layout:fixed;}
.steps td{width:25%;text-align:center;padding:0 1.5mm;vertical-align:top;}
.steps .bx{border:1.8px solid #1A1A1A;border-radius:3mm;padding:3.2mm 2mm;
  background:#fff;font-size:11.5pt;font-weight:600;}
.steps .ds{font-size:10pt;color:#1A1A1A;margin-top:1.8mm;line-height:1.55;}
.steps .ar{width:4%;font-size:13pt;color:#1A1A1A;vertical-align:middle;}

.box{border:1.8px solid #1A1A1A;border-radius:3mm;padding:3.4mm 5mm;}
.box.soft{background:#FBF3DC;}
.box.green{background:#F4FAF6;border-color:#1A6B4C;}
.box .t{margin-bottom:2mm;}
.box p{margin:0;font-size:11pt;line-height:1.8;}
.box .t{font-size:13pt;font-weight:700;margin-bottom:2.5mm;}
ul{margin:0;padding-left:6mm;}
li{margin-bottom:1.2mm;line-height:1.75;}
.foot{font-size:10.5pt;color:#3A4A41;margin:3mm 0 0;line-height:1.7;
  border-top:1.4px solid #CCC;padding-top:3mm;}
"""

BODY = """
<div class="hd"><table><tr>
  <td class="t">다시봄<small>글로온 · 글로, 생각을 켜다</small></td>
  <td class="s">학부모님께 드리는 안내</td>
</tr></table></div>

<p class="lead">
교과서를 다시 읽어도 시험에서 막히는 일이 많습니다.
읽을 때는 아는 것 같지만, <b class="hl">눈으로 읽은 것과 아는 것은 다르기</b> 때문입니다.
다시봄은 배운 내용을 <b>자기 말로 다시 말해 보게</b> 합니다.
말해 보면 어디가 비어 있는지 아이 스스로 알게 됩니다.
</p>

<div class="sec"><span class="h">다시봄 &mdash; 하루 20분, 네 단계</span></div>
<table class="steps"><tr>
  <td><div class="bx">지도 보기</div>
      <div class="ds">오늘 배운 것이<br>단원 어디쯤인지<br>큰 그림으로 확인</div></td>
  <td class="ar">→</td>
  <td><div class="bx">개념 읽기</div>
      <div class="ds">교과서를 펴고<br>빈칸을 채우며<br>직접 찾아 읽기</div></td>
  <td class="ar">→</td>
  <td><div class="bx">개념 말하기</div>
      <div class="ds">자기 말로 설명하고<br>빠진 부분을<br>짚어 받기</div></td>
  <td class="ar">→</td>
  <td><div class="bx">개념 확인하기</div>
      <div class="ds">문제를 풀며<br>어디가 흔들리는지<br>확인</div></td>
</tr></table>

<div class="gap"></div>

<div class="sec"><span class="h">사흘에 걸쳐 나누어 봅니다</span></div>
<table class="flow">
  <tr><th style="width:26%">언제</th><th>무엇을</th></tr>
  <tr><td><span class="when">수업 당일</span>약 20분</td>
      <td>화면으로 네 단계를 진행합니다. 교과서를 옆에 펴 두고 함께 봅니다.</td></tr>
  <tr><td><span class="when">이틀 뒤</span>약 20분</td>
      <td>종이에 단원 지도를 <b>보지 않고</b> 채워 봅니다. 그다음 워크북 문제를 손으로 풉니다.</td></tr>
  <tr><td><span class="when">일주일 뒤</span>약 10분</td>
      <td>틀렸던 것만 다시 봅니다. 마지막 장 <b>‘한 장 정리’</b>가 시험 전날 볼 종이가 됩니다.</td></tr>
</table>

<div class="gap"></div>

<div class="sec"><span class="h">함께 쓰는 앱 &mdash; 개념어, 하루 10분</span></div>
<div class="box">
  <p>
  다시봄이 <b>단원 하나를 이해하는</b> 앱이라면, 개념어는 <b>낱말 하나를 익히는</b> 앱입니다.
  이해는 몰아서 해도 되지만 어휘는 <b class="hl">자주 만나야</b> 익어서, 단원 진도와 상관없이
  하루 10분씩 따로 봅니다. <b>매일 둘 다 하지 않아도 됩니다.</b>
  </p>
</div>

<div class="sec" style="margin-top:5mm"><span class="h">왜 화면과 종이를 나누었나</span></div>
<div class="box soft">
  <p>
  화면에서 객관식을 누르는 것은 <b>풀이가 아니라 찍기</b>입니다.
  계산하고 그래프를 읽고 화살표를 그리는 일은 손으로 해야 어디서 틀렸는지 남습니다.
  그래서 <b>이해하고 말하는 일은 화면</b>에서, <b>풀고 그리는 일은 종이</b>에서 합니다.
  </p>
</div>

<div class="sec" style="margin-top:5mm"><span class="h">부모님이 하실 일은 없습니다</span></div>
<div class="box green">
  <p class="t">채점도, 설명도 하지 않으셔도 됩니다.</p>
  <ul>
    <li>아이가 쓴 설명은 화면이 읽고 <b>빠진 부분만 짚어</b> 줍니다. 정답을 바로 알려 주지 않고 다시 생각할 질문을 건넵니다.</li>
    <li>틀린 문제는 <b>두 번 이상 같은 곳에서 틀렸을 때만</b> 짚습니다. 준비물은 교과서와 인쇄물 몇 장뿐입니다.</li>
  </ul>
</div>

<p class="foot">
다시봄은 <b>과학 「힘의 작용」</b>과 <b>사회 「인간과 사회생활」</b> 두 단원이 준비되어 있습니다.
사용해 보시고 불편한 점이나 아이가 막힌 곳을 알려 주시면 다음 단원에 반영하겠습니다.
</p>
"""

html = ('<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">'
        f'<style>{CSS}</style></head><body>{BODY}</body></html>')
io.open("parent.html","w",encoding="utf-8").write(html)
print("built")
