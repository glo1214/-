/* 공통 UI — 종이 노트와 카드의 중간 감성, 포인트 색은 황토 하나 */

import { forwardRef } from "react";

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-xl2 font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2.5 text-[15px]",
    lg: "px-5 py-3.5 text-base",
  };
  const variants = {
    primary: "bg-ochre-500 text-white hover:bg-ochre-600 active:bg-ochre-700",
    soft: "bg-ochre-50 text-ochre-700 hover:bg-ochre-100 border border-ochre-100",
    ghost: "text-ink-700 hover:bg-paper-soft",
    outline: "border border-line-strong text-ink-700 bg-paper-card hover:bg-paper-soft",
    quiet: "text-ink-500 hover:text-ink-900 hover:bg-paper-soft",
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Card({ children, className = "", as: Tag = "div", ...props }) {
  return (
    <Tag
      className={`rounded-xl2 border border-line bg-paper-card shadow-card ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}

export function Chip({ children, active = false, className = "", ...props }) {
  const Tag = props.onClick ? "button" : "span";
  return (
    <Tag
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm transition-colors ${
        active
          ? "border-ochre-300 bg-ochre-50 text-ochre-700"
          : "border-line bg-paper-card text-ink-700 hover:border-line-strong"
      } ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}

export function Label({ children, hint }) {
  return (
    <div className="mb-1.5">
      <span className="text-sm font-medium text-ink-700">{children}</span>
      {hint ? <span className="ml-2 text-xs text-ink-400">{hint}</span> : null}
    </div>
  );
}

export function Input(props) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl2 border border-line bg-paper-card px-3.5 py-2.5 text-[15px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-ochre-300 ${
        props.className || ""
      }`}
    />
  );
}

/* 글쓰기 화면에서 커서 위치에 문장 시작점을 넣어야 해서 ref 를 넘긴다 */
export const Textarea = forwardRef(function Textarea(props, ref) {
  return (
    <textarea
      {...props}
      ref={ref}
      className={`w-full resize-none rounded-xl2 border border-line bg-paper-card px-3.5 py-3 text-[15px] leading-7 text-ink-900 outline-none placeholder:text-ink-400 focus:border-ochre-300 ${
        props.className || ""
      }`}
    />
  );
});

export function SectionTitle({ children, action }) {
  return (
    <div className="mb-3 flex items-baseline justify-between">
      <h2 className="text-[15px] font-semibold text-ink-900">{children}</h2>
      {action}
    </div>
  );
}

export function Empty({ title, description, action }) {
  return (
    <div className="rounded-xl2 border border-dashed border-line-strong bg-paper-soft/60 px-5 py-10 text-center">
      <p className="text-[15px] font-medium text-ink-700">{title}</p>
      {description ? <p className="mt-1.5 text-sm text-ink-500">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function Dots() {
  return (
    <span className="inline-flex gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-ink-400 animate-blink"
          style={{ animationDelay: `${i * 0.16}s` }}
        />
      ))}
    </span>
  );
}

export function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/25 p-0 sm:items-center sm:p-6">
      <div
        className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-line bg-paper-card p-5 shadow-lift animate-rise sm:rounded-xl2 thin-scroll"
        role="dialog"
        aria-modal="true"
      >
        {title ? <h3 className="mb-3 text-base font-semibold text-ink-900">{title}</h3> : null}
        <div className="text-[15px] leading-7 text-ink-700">{children}</div>
        <div className="mt-5 flex justify-end gap-2">
          {footer || (
            <Button variant="outline" onClick={onClose}>
              닫기
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function Notice({ children, tone = "info" }) {
  const tones = {
    info: "border-line bg-paper-soft text-ink-700",
    warn: "border-ochre-200 bg-ochre-50 text-ochre-700",
  };
  return (
    <div className={`rounded-xl2 border px-3.5 py-3 text-sm leading-6 ${tones[tone]}`}>{children}</div>
  );
}
