/* Vercel 서버리스 함수 — 로직은 shared/proofread.js 에 있다 */
import { handleProofread } from "../shared/proofread.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const body = typeof req.body === "string" ? safeParse(req.body) : req.body || {};
  const out = await handleProofread(body);
  res.status(out.status).json(out.body);
}

function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
