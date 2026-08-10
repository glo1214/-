/* Netlify Functions v2 어댑터 — 로직은 shared/card.js 에 있다 */
import { handleCard } from "../../shared/card.js";
import { jsonResponse, readBody } from "../../shared/http.js";

export default async (req) => {
  if (req.method !== "POST") return jsonResponse(405, { error: "POST only" });
  const out = await handleCard(await readBody(req));
  return jsonResponse(out.status, out.body);
};
