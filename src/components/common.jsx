import React from "react";

export function Card({ children, className = "", ...rest }) {
  return (
    <div
      className={`rounded-xl2 bg-ink-800 border border-line ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ index, title, subtitle, right }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      {index != null && (
        <span className="grid place-items-center w-7 h-7 rounded-full bg-brand/15 text-brand text-sm font-bold shrink-0">
          {index}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <h2 className="text-[15px] font-bold text-gray-100 leading-tight">{title}</h2>
        {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...rest
}) {
  const base =
    "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none select-none";
  const sizes = {
    sm: "text-sm px-3 py-1.5",
    md: "text-[15px] px-4 py-2.5",
    lg: "text-base px-5 py-3.5 w-full",
  };
  const variants = {
    primary: "bg-brand text-ink-900 hover:bg-brand-soft",
    warm: "bg-warm text-ink-900 hover:bg-warm-soft",
    ghost: "bg-ink-700 text-gray-100 hover:bg-ink-600 border border-line",
    subtle: "bg-transparent text-muted hover:text-gray-100 hover:bg-ink-700",
    danger: "bg-bad/15 text-bad hover:bg-bad/25",
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function Pill({ children, tone = "brand", className = "" }) {
  const tones = {
    brand: "bg-brand/15 text-brand-soft",
    warm: "bg-warm/15 text-warm-soft",
    good: "bg-good/15 text-good",
    bad: "bg-bad/15 text-bad",
    muted: "bg-ink-700 text-muted",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Empty({ icon, title, children }) {
  return (
    <div className="text-center py-10 px-6">
      {icon && <div className="text-4xl mb-3 opacity-80">{icon}</div>}
      <p className="text-gray-200 font-semibold">{title}</p>
      {children && <p className="text-sm text-muted mt-1.5 leading-relaxed">{children}</p>}
    </div>
  );
}

export function Spinner({ className = "" }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* 간단 인라인 아이콘 세트 */
export function Icon({ name, size = 20, className = "" }) {
  const p = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
  };
  switch (name) {
    case "pen":
      return (
        <svg {...p}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      );
    case "sparkles":
      return (
        <svg {...p}>
          <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
          <path d="M5.5 5.5 8 8M16 16l2.5 2.5M18.5 5.5 16 8M8 16l-2.5 2.5" />
        </svg>
      );
    case "map":
      return (
        <svg {...p}>
          <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" />
          <path d="M9 4v14M15 6v14" />
        </svg>
      );
    case "speaker":
      return (
        <svg {...p}>
          <path d="M11 5 6 9H3v6h3l5 4V5Z" />
          <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
        </svg>
      );
    case "mic":
      return (
        <svg {...p}>
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
        </svg>
      );
    case "book":
      return (
        <svg {...p}>
          <path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2V5Z" />
          <path d="M4 19a2 2 0 0 0 2 2h12" />
        </svg>
      );
    case "chart":
      return (
        <svg {...p}>
          <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
        </svg>
      );
    case "gear":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M22 12h-3M5 12H2M19 5l-2 2M7 17l-2 2M19 19l-2-2M7 7 5 5" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...p}>
          <rect x="3" y="4" width="18" height="17" rx="2" />
          <path d="M3 9h18M8 2v4M16 2v4" />
        </svg>
      );
    case "check":
      return (
        <svg {...p}>
          <path d="M20 6 9 17l-5-5" />
        </svg>
      );
    case "x":
      return (
        <svg {...p}>
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      );
    case "arrow-down":
      return (
        <svg {...p}>
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      );
    case "trash":
      return (
        <svg {...p}>
          <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
        </svg>
      );
    case "flame":
      return (
        <svg {...p}>
          <path d="M12 3s5 4 5 9a5 5 0 0 1-10 0c0-2 1-3 1-3s2 1 2 3c0-3 2-5 2-9Z" />
        </svg>
      );
    default:
      return null;
  }
}
