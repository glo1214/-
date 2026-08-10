import { describe, it, expect } from "vitest";
import { parseCandidates } from "./ocr";

describe("parseCandidates — 사진 인식 파싱", () => {
  it("번호가 앞에 붙은 줄에서 영단어 전체를 뽑는다 (앞 2글자 잘림 방지)", () => {
    const rows = parseCandidates("0444 impersonal 형 특정 개인과 상관없는");
    expect(rows).toHaveLength(1);
    expect(rows[0].word).toBe("impersonal");
    expect(rows[0].meaning).toContain("특정 개인과");
  });

  it("구동사(공백 포함)를 하나로 잡는다", () => {
    const rows = parseCandidates("0478 give over to 넘기다, 양도하다");
    expect(rows[0].word).toBe("give over to");
    expect(rows[0].meaning).toContain("넘기다");
  });

  it("여러 줄을 각각 처리하고 한 글자 잡음은 버린다", () => {
    const rows = parseCandidates("misdeed 나쁜 짓\nx\ncounteract 대응하다");
    expect(rows.map((r) => r.word)).toEqual(["misdeed", "counteract"]);
  });

  it("같은 단어 중복은 한 번만", () => {
    const rows = parseCandidates("deform 변형시키다\ndeform 변형시키다");
    expect(rows).toHaveLength(1);
  });
});
