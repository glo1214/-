/* 위험 신호가 감지되면 글쓰기 대화를 멈추고 도움을 안내한다 (기획서 7.1)
   AI 가 상담가 역할을 하지 않는다. 판단이나 해석을 덧붙이지 않는다. */

import { HELP_LINES, SAFETY_MESSAGE } from "../lib/safety.js";
import { Button, Modal } from "./common.jsx";

export function SafetyNotice({ open, onClose }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="잠깐 멈출게"
      footer={
        <Button variant="outline" onClick={onClose}>
          알겠어
        </Button>
      }
    >
      <p>{SAFETY_MESSAGE}</p>
      <ul className="mt-4 space-y-2">
        {HELP_LINES.map((h) => (
          <li
            key={h.name}
            className="flex items-baseline justify-between gap-3 rounded-xl2 bg-paper-soft px-3.5 py-3"
          >
            <span>
              <span className="font-medium text-ink-900">{h.name}</span>
              <span className="block text-xs text-ink-400">{h.note}</span>
            </span>
            <a
              href={`tel:${h.number.replace("#", "")}`}
              className="shrink-0 text-[15px] font-semibold text-ochre-700"
            >
              {h.number}
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-ink-500">
        이 기록은 저장하지 않았어. 다른 이야기를 적고 싶으면 언제든 돌아와도 좋아.
      </p>
    </Modal>
  );
}
