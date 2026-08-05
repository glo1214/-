/* ------------------------------------------------------------------
   기본 단어장 시드
   사진으로 받은 단어들을 단어장(deck)으로 넣어둔다.
   각 deck 은 안정적인 id 를 가지며, 앱 시작 시 없으면 자동으로 추가된다.
   (새 사진을 받을 때마다 여기에 deck 하나를 추가하면 됨)
   pos: n(명사) v(동사) a(형용사) ad(부사)
------------------------------------------------------------------ */

export const SEED_DECKS = [
  {
    id: "deck_seed",
    name: "수능 기출 필수 어휘 ③ (0121–0160)",
    words: [
      { word: "rid", meaning: "없애다, 제거하다", pos: "v" },
      { word: "invest", meaning: "투자하다; (시간·노력을) 쏟다", pos: "v" },
      { word: "substance", meaning: "물질; 본질, 핵심", pos: "n" },
      { word: "spectrum", meaning: "스펙트럼; (특질·생각의) 범위", pos: "n" },
      { word: "faith", meaning: "확신, 신뢰; 신념, 신앙", pos: "n" },
      { word: "hence", meaning: "그러므로, 따라서", pos: "ad" },
      { word: "dominate", meaning: "지배하다; 우위를 차지하다", pos: "v" },
      { word: "overwhelm", meaning: "압도하다; 제압하다", pos: "v" },
      { word: "protest", meaning: "항의하다, 시위하다; 항의, 시위", pos: "v" },
      { word: "scatter", meaning: "흩뿌리다; (뿔뿔이) 흩어지다", pos: "v" },
      { word: "dilemma", meaning: "딜레마, 궁지", pos: "n" },
      { word: "vertical", meaning: "수직의, 세로의", pos: "a" },
      { word: "inevitable", meaning: "불가피한, 피할 수 없는", pos: "a" },
      { word: "simultaneously", meaning: "동시에, 일제히", pos: "ad" },
      { word: "tremble", meaning: "(몸을) 떨다, 떨리다; 떨림", pos: "v" },
      { word: "spare", meaning: "남는, 여분의; (시간·돈을) 할애하다", pos: "a" },
      { word: "temporary", meaning: "일시적인, 임시의", pos: "a" },
      { word: "undermine", meaning: "(자신감 등을) 약화시키다", pos: "v" },
      { word: "rub", meaning: "문지르다, 비비다; 문지르기", pos: "v" },
      { word: "cope", meaning: "대처하다, 대응하다", pos: "v" },
      { word: "vague", meaning: "애매모호한; 희미한, 막연한", pos: "a" },
      { word: "dim", meaning: "어둑한; (기억이) 흐릿한, 희미한", pos: "a" },
      { word: "blur", meaning: "흐릿해지다; 모호하게 만들다", pos: "v" },
      { word: "posture", meaning: "자세; 태도", pos: "n" },
      { word: "oval", meaning: "타원형의, 달걀 모양의; 타원형", pos: "a" },
      { word: "steep", meaning: "가파른; (증감이) 급격한; (가격이) 비싼", pos: "a" },
      { word: "magnitude", meaning: "엄청난 규모, 중요성; 크기, (지진) 규모", pos: "n" },
      { word: "worthwhile", meaning: "(~할) 가치가 있는", pos: "a" },
      { word: "minimize", meaning: "최소화하다; 축소하다", pos: "v" },
      { word: "integral", meaning: "필수적인, 없어서는 안 될", pos: "a" },
      { word: "cease", meaning: "중지하다, 그만두다", pos: "v" },
      { word: "bind", meaning: "묶다, 매다; 결속시키다", pos: "v" },
      { word: "grasp", meaning: "꽉 잡다; 완전히 이해하다; 이해", pos: "v" },
      { word: "elevate", meaning: "(들어) 올리다, 증가시키다; 승진시키다", pos: "v" },
      { word: "hold down", meaning: "억제하다, 억누르다", pos: "v" },
      { word: "let down", meaning: "실망시키다; 덜 성공적으로 만들다", pos: "v" },
      { word: "look down on", meaning: "얕보다, 무시하다", pos: "v" },
      { word: "put down", meaning: "(글을) 적다; 진압하다; (비용을) 지불하다", pos: "v" },
      { word: "settle down", meaning: "정착하다; 진정되다, 진정시키다", pos: "v" },
      { word: "turn down", meaning: "(소리·온도를) 낮추다; 거절하다", pos: "v" },
    ],
  },
  {
    id: "deck_note1",
    name: "손글씨 단어 노트 ① (plausible–require)",
    words: [
      { word: "plausible", meaning: "그럴듯한", pos: "a" },
      { word: "prosocial", meaning: "친사회적인", pos: "a" },
      { word: "cite", meaning: "내세우다, 인용하다", pos: "v" },
      { word: "concern", meaning: "우려, 관심", pos: "n" },
      { word: "arrival", meaning: "유입; 도착", pos: "n" },
      { word: "admirable", meaning: "훌륭한, 존경할 만한", pos: "a" },
      { word: "self-deception", meaning: "자기기만", pos: "n" },
      { word: "generous", meaning: "너그러운", pos: "a" },
      { word: "connotation", meaning: "함축, 뉘앙스", pos: "n" },
      { word: "appreciate", meaning: "높이 평가하다", pos: "v" },
      { word: "operate", meaning: "운영되다, 작동되다", pos: "v" },
      { word: "statistics", meaning: "통계", pos: "n" },
      { word: "resemble", meaning: "닮다", pos: "v" },
      { word: "occupation", meaning: "직업", pos: "n" },
      { word: "absorption", meaning: "몰입; 흡수", pos: "n" },
      { word: "merely", meaning: "단지", pos: "ad" },
      { word: "means", meaning: "수단", pos: "n" },
      { word: "severe", meaning: "혹독한", pos: "a" },
      { word: "demanding", meaning: "힘든, 부담이 큰", pos: "a" },
      { word: "compulsion", meaning: "강제, 강박", pos: "n" },
      { word: "arrest", meaning: "사로잡다; 체포하다", pos: "v" },
      { word: "reconstruct", meaning: "복원하다, 재구성하다", pos: "v" },
      { word: "infer", meaning: "추론하다", pos: "v" },
      { word: "revise", meaning: "수정하다", pos: "v" },
      { word: "organize", meaning: "정리하다", pos: "v" },
      { word: "settle", meaning: "해결하다", pos: "v" },
      { word: "excavation", meaning: "발굴", pos: "n" },
      { word: "require", meaning: "필요하게 하다; 요구하다", pos: "v" },
    ],
  },
];

/* 하위호환용 (기존 import 대비) */
export const SEED_DECK_ID = SEED_DECKS[0].id;
export const SEED_DECK_NAME = SEED_DECKS[0].name;
export const SEED_WORDS = SEED_DECKS[0].words;
