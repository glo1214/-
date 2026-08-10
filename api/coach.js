/* Vercel 서버리스 함수 — 로직은 shared/coach.js 에 있다 */
import { handleCoach } from "../shared/coach.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const body = typeof req.body === "string" ? safeParse(req.body) : req.body || {};
  const out = await handleCoach(body);
  res.status(out.status).json(out.body);
}

function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
