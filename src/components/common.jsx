import React from "react";

/* 화면 전체 스크롤 컨테이너 (하단 탭바 여백 확보) */
export function Screen({ children, className = "" }) {
  return (
    <div className={`min-h-full px-5 pt-6 pb-28 max-w-xl mx-auto ${className}`}>{children}</div>
  );
}

export function Card({ children, className = "", ...rest }) {
  return (
    <div
      className={`bg-ink-800 border border-line rounded-xl2 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function Button({ children, variant = "primary", className = "", ...rest }) {
  const base =
    "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100";
  const variants = {
    primary: "bg-accent text-accent-ink hover:bg-accent-soft",
    ghost: "bg-ink-700 text-gray-100 hover:bg-ink-600",
    subtle: "bg-transparent text-muted hover:text-gray-200",
    danger: "bg-bad/15 text-bad hover:bg-bad/25",
    good: "bg-good/15 text-good hover:bg-good/25",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function Pill({ children, tone = "neutral", className = "" }) {
  const tones = {
    neutral: "bg-ink-700 text-muted",
    accent: "bg-accent/15 text-accent-deep",
    good: "bg-good/15 text-good",
    bad: "bg-bad/15 text-bad",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function SectionTitle({ children, right }) {
  return (
    <div className="flex items-center justify-between mb-3 mt-7 first:mt-0">
      <h2 className="text-sm font-semibold text-muted tracking-wide">{children}</h2>
      {right}
    </div>
  );
}

/* 화면 상단 헤더 */
export function Header({ title, sub, right }) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-50">{title}</h1>
        {sub && <p className="text-sm text-muted mt-1">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

/* 빈 상태 */
export function Empty({ icon = "📭", title, desc, action }) {
  return (
    <div className="text-center py-14 px-6">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="text-gray-200 font-semibold">{title}</p>
      {desc && <p className="text-sm text-muted mt-1.5 leading-relaxed">{desc}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* 간단한 모달 (하단 시트 스타일) */
export function Sheet({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/60 animate-pop"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-ink-800 border-t sm:border border-line rounded-t-3xl sm:rounded-3xl p-5 pb-8 safe-b animate-slideup max-h-[88vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-50">{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-gray-200 text-xl leading-none px-2">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children, hint }) {
  return (
    <label className="block mb-4">
      <span className="block text-sm font-medium text-gray-300 mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted mt-1">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "w-full bg-ink-900 border border-line rounded-xl px-3.5 py-2.5 text-gray-100 placeholder-muted focus:border-accent/60 focus:outline-none transition";
