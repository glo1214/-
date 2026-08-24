# -*- coding: utf-8 -*-
"""가로 지도를 세로 A4에 90도 눕혀 워크북 맨 앞에 붙이기

  실행:  python3 merge.py
종이는 시계 방향으로 돌려서 씁니다. 인쇄는 전부 세로 한 번으로 끝납니다.
"""
from pypdf import PdfWriter, PdfReader, PageObject, Transformation

MM = 72 / 25.4
A4W, A4H = 210 * MM, 297 * MM

def rotated_page(src_pdf):
    src = PdfReader(src_pdf).pages[0]
    sw, sh = float(src.mediabox.width), float(src.mediabox.height)
    rw, rh = sh, sw                       # 90도 돌린 뒤 크기
    scale = min(A4W / rw, A4H / rh)
    dx, dy = (A4W - rw * scale) / 2, (A4H - rh * scale) / 2
    page = PageObject.create_blank_page(width=A4W, height=A4H)
    page.merge_transformed_page(src, (Transformation()
        .rotate(90).translate(sh, 0).scale(scale, scale).translate(dx, dy)))
    return page

def build(map_pdf, book_pdf, out_pdf):
    w = PdfWriter()
    w.add_page(rotated_page(map_pdf))
    for p in PdfReader(book_pdf).pages:
        w.add_page(p)
    with open(out_pdf, "wb") as f:
        w.write(f)
    print(out_pdf, "—", len(PdfReader(out_pdf).pages), "장")

BASE = "/mnt/user-data/outputs/dasibom/print"
build(f"{BASE}/science/단원지도_채우기.pdf",
      f"{BASE}/science/힘의작용_워크북.pdf",
      f"{BASE}/science/힘의작용_워크북_전체.pdf")
build(f"{BASE}/social/단원지도_채우기.pdf",
      f"{BASE}/social/인간과사회생활_워크북.pdf",
      f"{BASE}/social/인간과사회생활_워크북_전체.pdf")
