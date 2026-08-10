/* 서버리스 어댑터 공통 유틸 (Netlify Functions v2 · Web 표준 Response) */

export function jsonResponse(status, obj) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export async function readBody(req) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}
