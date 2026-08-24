# -*- coding: utf-8 -*-
"""앱 화면 캡처 — 미팅 자료용"""
from playwright.sync_api import sync_playwright
import os, time

APP = "file:///mnt/user-data/outputs/dasibom/app/index.html"
W, H = 820, 700

shots = []

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": W, "height": H}, device_scale_factor=2)
    pg.goto(APP)
    pg.wait_for_timeout(1500)

    def snap(name):
        # 현재 단계 pane 의 실제 높이만큼만 잘라서 캡처
        h = pg.evaluate("""() => {
            const i = [...document.querySelectorAll('.step')]
                        .findIndex(b => b.getAttribute('aria-current')==='true');
            const pane = document.querySelectorAll('.pane')[i];
            const wrap = document.querySelector('.wrap');
            const top  = wrap.getBoundingClientRect().top + window.scrollY;
            return Math.ceil(top + (pane.getBoundingClientRect().top + window.scrollY - top)
                   + pane.scrollHeight + 30);
        }""")
        h = max(400, min(int(h), 6000))
        pg.set_viewport_size({"width": W, "height": h})
        pg.wait_for_timeout(200)
        path = f"/home/claude/shots/{name}.png"
        pg.screenshot(path=path, full_page=False)
        pg.set_viewport_size({"width": W, "height": 700})
        shots.append((name, path))
        print("  ·", name, h)

    # ── 과학 ──────────────────────────────
    print("과학")
    snap("01_map_closed")                      # 지도 접힘

    pg.evaluate("t1(2)")                       # 어떤 것이 있나
    pg.wait_for_timeout(300); snap("02_map_open1")

    pg.evaluate("t2(1)")                       # 닿아야
    pg.wait_for_timeout(300); snap("03_map_open2")

    pg.evaluate("go(1)")                       # 개념 — 빈칸
    pg.wait_for_timeout(500); snap("04_concept_blank")

    # 일부러 방향을 빼고 채움
    pg.evaluate("""
      document.getElementById('s0').value='지구';
      document.getElementById('s1').value='물체';
      document.getElementById('s2').value='아래';
      fillC();
    """)
    pg.wait_for_timeout(400); snap("05_concept_filled")

    pg.evaluate("ci=1; drawConc()")            # 탄성력 카드
    pg.evaluate("""
      document.getElementById('s0').value='용수철';
      document.getElementById('s1').value='';
      document.getElementById('s2').value='원래대로';
      fillC();
    """)
    pg.wait_for_timeout(400); snap("06_concept_elastic")

    pg.evaluate("ci=0; drawConc()")            # 중력으로 되돌리기
    pg.evaluate("go(2)")                       # 내 말로
    pg.wait_for_timeout(500); snap("07_say_empty")

    # 진단 결과를 실제처럼 채워 넣기 (API 호출 없이 화면만)
    pg.evaluate("""
      diagState = {
        level:"partial",
        have:["누가","누구에게"],
        missing:["어느 쪽으로"],
        v:"주어와 대상은 잘 잡았어요.",
        comment:"지구가 물체를 당긴다는 것까지는 정확합니다. 그런데 어느 쪽으로 당기는지가 빠져 있어요. 방향이 빠지면 지구 반대편에 있는 사람에게 작용하는 중력을 설명하기 어려워집니다.",
        followup:"지구 반대편에 서 있는 사람에게 중력은 어느 쪽으로 작용할까요?"
      };
      drawSelf();
    """)
    pg.wait_for_timeout(400); snap("08_say_diagnosed")

    pg.evaluate("go(3)")                       # 확인
    pg.wait_for_timeout(500); snap("09_quiz")

    pg.evaluate("pk(0,0)")                     # 일부러 틀리기 (O 선택)
    pg.wait_for_timeout(400); snap("10_quiz_wrong")

    # ── 사회 ──────────────────────────────
    print("사회")
    pg.evaluate("switchSubj('social-life')")
    pg.wait_for_timeout(600); snap("11_social_map")

    pg.evaluate("t1(0); t2(0)")
    pg.wait_for_timeout(300); snap("12_social_map_open")

    pg.evaluate("go(1)")
    pg.wait_for_timeout(500); snap("13_social_concept")

    pg.evaluate("""
      document.getElementById('s0').value='사회에서 살아가는 데 필요한 것을 배우는 과정';
      document.getElementById('s1').value='가족, 학교';
      document.getElementById('s2').value='';
      fillC();
    """)
    pg.wait_for_timeout(400); snap("14_social_filled")

    pg.evaluate("go(3)")
    pg.wait_for_timeout(500)
    pg.evaluate("pk(4,0)")                     # 차이/차별 문항 틀리기
    pg.wait_for_timeout(400); snap("15_social_quiz")

    b.close()

print(f"\n{len(shots)}장 캡처 완료")
