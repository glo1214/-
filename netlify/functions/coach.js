/* Netlify Functions v2 어댑터 — 로직은 shared/coach.js 에 있다.
   netlify.toml 의 리다이렉트로 /api/coach 경로에 연결된다. */
import { handleCoach } from "../../shared/coach.js";
import { jsonResponse, readBody } from "../../shared/http.js";

export default async (req) => {
  if (req.method !== "POST") return jsonResponse(405, { error: "POST only" });
  const out = await handleCoach(await readBody(req));
  return jsonResponse(out.status, out.body);
};
