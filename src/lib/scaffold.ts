/* 비계(스캐폴딩) 노출 규칙. 박스 3 이상이면 한글 표기·연상 문구를 숨긴다. */

export function koPronVisible(box: number, useKoPron: boolean): boolean {
  return useKoPron && box < 3;
}

export function mnemonicHiddenAsScaffold(box: number): boolean {
  return box >= 3;
}
