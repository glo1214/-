/* Netlify Functions v2 어댑터 — 로직은 shared/proofread.js 에 있다 */
import { handleProofread } from "../../shared/proofread.js";
import { jsonResponse, readBody } from "../../shared/http.js";

export default async (req) => {
  if (req.method !== "POST") return jsonResponse(405, { error: "POST only" });
  const out = await handleProofread(await readBody(req));
  return jsonResponse(out.status, out.body);
};
