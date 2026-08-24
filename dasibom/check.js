/* 데이터 검수 스크립트 — 새 과목을 추가한 뒤 반드시 실행할 것
   실행:  node check.js                                        */
global.window = {};
require('./app/data/science-force.js');
require('./app/data/social-life.js');
const U = global.window.UNITS;

const TERMS = {
  'science-force': ['중력','탄성력','마찰력','부력','합력','평형','뉴턴','용수철'],
  'social-life'  : ['사회화','정체성','지위','역할','차별','갈등','편견','고정 관념']
};

/* 여섯 단계 카드 검사 — 학생용 6단계는 PROJECT_MASTER 18장에서 확정된 순서다.
   순서가 바뀌면 학습할 때 쓴 단서와 인출할 때 쓸 단서가 어긋나므로 이름까지 고정해서 본다. */
const SIX_ORDER = ['장면','이름','구조','비교','적용','설명'];
const SIX_NEED = {
  scene    : ['mission','watch','ask','ph'],
  name     : ['items','note'],
  structure: ['rows','fig','figcap','rule','caution'],
  compare  : ['lead','ox'],
  apply    : ['lead','cases'],
  express  : ['say','cues','next']
};
function checkSix(c){
  if (c.slots || c.subs) bad(`여섯 단계 카드에 slots/subs가 같이 있음: ${c.n}`);
  if (!c.spec) bad(`AI 진단 기준(spec) 없음: ${c.n}`);
  const S = c.steps || [];
  if (S.length !== SIX_ORDER.length) bad(`단계가 여섯 개가 아님 (${S.length}개): ${c.n}`);
  S.forEach((s,i)=>{
    if (SIX_ORDER[i] && s.k !== SIX_ORDER[i])
      bad(`${i+1}번 단계 이름이 확정 순서와 다름: ${c.n} — ${s.k} (${SIX_ORDER[i]} 이어야 함)`);
    if (!s.t) bad(`단계 제목 없음: ${c.n} ${i+1}번`);
    const need = SIX_NEED[s.type];
    if (!need) { bad(`모르는 단계 유형: ${c.n} ${i+1}번 — ${s.type}`); return; }
    need.forEach(k=>{ if (s[k] === undefined) bad(`${s.k} 단계에 ${k} 없음: ${c.n}`); });
    if (s.type === 'name')    (s.items||[]).forEach(x=>{ if(!x.name||!x.d) bad(`이름 단계 항목이 비었음: ${c.n}`); });
    if (s.type === 'compare') (s.ox||[]).forEach(x=>{
      if (typeof x.a !== 'boolean') bad(`비교 단계 판단값이 없음: ${c.n} — ${x.q}`);
      if (!x.w) bad(`비교 단계 해설 없음: ${c.n} — ${x.q}`);
    });
    if (s.type === 'apply')   (s.cases||[]).forEach(x=>{ if(!x.q||!x.a) bad(`적용 단계 사례가 비었음: ${c.n}`); });
  });
}

let fail = 0;
const bad = m => { console.log('  ✗ ' + m); fail++; };

for (const key of Object.keys(U)) {
  const u = U[key];
  console.log(`\n[${key}] ${u.subject} · ${u.unit}  (mode: ${u.mode})`);

  // 1) 필수 필드
  ['subject','unit','mode','tree','concepts','quiz'].forEach(k=>{
    if (u[k] === undefined) bad(`필수 항목 없음: ${k}`);
  });
  if (!['slots','subs'].includes(u.mode)) bad(`mode 값이 이상함: ${u.mode}`);

  // 2) 개념 카드
  u.concepts.forEach(c=>{
    if (!c.trigger) bad(`트리거 질문 없음: ${c.n}`);
    if (!c.loop)    bad(`되돌아오는 고리 없음: ${c.n}`);
    if (c.hanja && !c.hnote) bad(`한자만 있고 설명 없음: ${c.n}`);

    if (c.card === 'six') checkSix(c);
    else {
      const f = u.mode === 'slots' ? c.slots : c.subs;
      if (!f || !f.length) bad(`필드 없음: ${c.n}`);
      if (u.mode === 'slots' && c.slots && !c.slots.some(s=>s.hl))
        bad(`형광펜 표시가 하나도 없음: ${c.n}`);
    }
  });

  // 3) 문항
  u.quiz.forEach((q,i)=>{
    if (!q.o.some(o=>o.ok)) bad(`정답 없음: 문제 ${i+1}`);
    if (q.o.filter(o=>o.ok).length > 1) bad(`정답이 둘 이상: 문제 ${i+1}`);
    if (!q.unit) bad(`소단원 라벨 없음: 문제 ${i+1}`);
    q.o.forEach(o=>{ if(!o.w) bad(`해설 없음: 문제 ${i+1} — ${o.s}`); });
  });
  const whyN = u.quiz.filter(q=>q.why).length;
  if (whyN === 0) bad('까닭 쓰기 문항이 하나도 없음');
  if (whyN > 2)   bad(`까닭 쓰기가 너무 많음 (${whyN}개) — 지쳐서 대충 씁니다`);

  // 4) 교차 오염 — 다른 과목 용어가 섞였는지
  const s = JSON.stringify(u);
  Object.entries(TERMS).forEach(([k,words])=>{
    if (k === key) return;
    const hit = words.filter(w=>s.includes(w));
    if (hit.length) bad(`다른 과목 용어가 섞임: ${hit.join(', ')}`);
  });

  // 5) 교과서 쪽수가 들어갔는지
  if (/\d+\s*쪽/.test(s)) bad('교과서 쪽수가 들어 있음 — 출판사 중립 원칙 위반');

  if (!fail) console.log('  ✓ 이상 없음');
}

console.log(fail ? `\n${fail}건 확인 필요` : '\n전부 통과');
process.exit(fail ? 1 : 0);
