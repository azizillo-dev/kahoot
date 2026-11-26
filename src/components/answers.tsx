"use client";

import { useId } from "react";

export type AnswerTheme = "classic" | "space";

export const ANSWER_COLORS: Record<AnswerTheme, string[]> = {
  classic: ["var(--ans-red)", "var(--ans-blue)", "var(--ans-yellow)", "var(--ans-green)"],
  space: ["var(--ans-moon)", "var(--ans-sun)", "var(--ans-saturn)", "var(--ans-earth)"],
};

export const ANSWER_NAMES: Record<AnswerTheme, { uz: string; ru: string }[]> = {
  classic: [
    { uz: "Uchburchak", ru: "Треугольник" },
    { uz: "Romb", ru: "Ромб" },
    { uz: "Doira", ru: "Круг" },
    { uz: "Kvadrat", ru: "Квадрат" },
  ],
  space: [
    { uz: "Oy", ru: "Луна" },
    { uz: "Quyosh", ru: "Солнце" },
    { uz: "Saturn", ru: "Сатурн" },
    { uz: "Yer", ru: "Земля" },
  ],
};

/** Javob belgisi: klassik geometrik shakl yoki sayyora. */
export function AnswerMark({ theme, index, className = "" }: { theme: AnswerTheme; index: number; className?: string }) {
  const id = useId().replace(/:/g, "");
  const color = ANSWER_COLORS[theme][index];
  if (theme === "classic") {
    const shapes = [
      <path key="t" d="M50 10 L92 86 Q94 90 89 90 L11 90 Q6 90 8 86 Z" />,
      <rect key="d" x="20" y="20" width="60" height="60" rx="6" transform="rotate(45 50 50)" />,
      <circle key="c" cx="50" cy="50" r="40" />,
      <rect key="s" x="13" y="13" width="74" height="74" rx="8" />,
    ];
    return (
      <svg viewBox="0 0 100 100" className={className} aria-hidden fill="#fff">
        {shapes[index]}
      </svg>
    );
  }
  // Kosmos
  if (index === 0)
    return (
      <svg viewBox="0 0 100 100" className={className} aria-hidden>
        <defs>
          <mask id={`m${id}`}>
            <rect width="100" height="100" fill="#fff" />
            <circle cx="66" cy="36" r="34" fill="#000" />
          </mask>
        </defs>
        <circle cx="48" cy="52" r="38" fill="#fff" mask={`url(#m${id})`} />
        <circle cx="30" cy="62" r="5" fill={color} opacity=".25" mask={`url(#m${id})`} />
        <circle cx="40" cy="78" r="3.5" fill={color} opacity=".25" />
        <path d="M78 66 l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5Z" fill="#fff" />
      </svg>
    );
  if (index === 1)
    return (
      <svg viewBox="0 0 100 100" className={className} aria-hidden>
        <g fill="#fff">
          {Array.from({ length: 12 }, (_, i) => (
            <path key={i} d="M50 2 L55 18 L45 18 Z" transform={`rotate(${i * 30} 50 50)`} />
          ))}
          <circle cx="50" cy="50" r="26" />
        </g>
        <circle cx="41" cy="46" r="2.8" fill={color} />
        <circle cx="59" cy="46" r="2.8" fill={color} />
        <path d="M41 56 Q50 64 59 56" stroke={color} strokeWidth="3.5" fill="none" strokeLinecap="round" />
      </svg>
    );
  if (index === 2)
    return (
      <svg viewBox="0 0 100 100" className={className} aria-hidden>
        <g transform="rotate(-18 50 52)">
          <ellipse cx="50" cy="52" rx="46" ry="13" fill="none" stroke="#fff" strokeWidth="6" opacity=".9" />
          <circle cx="50" cy="52" r="26" fill="#fff" />
          <path d="M26 45 Q50 41 74 45" stroke={color} strokeWidth="3" fill="none" opacity=".35" />
          <path d="M25 58 Q50 54 75 58" stroke={color} strokeWidth="3" fill="none" opacity=".35" />
          <path d="M4 52 A46 13 0 0 0 96 52" stroke="#fff" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M4 52 A46 13 0 0 0 96 52" stroke={color} strokeWidth="1.5" fill="none" opacity=".4" />
        </g>
      </svg>
    );
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <defs>
        <clipPath id={`e${id}`}>
          <circle cx="50" cy="50" r="40" />
        </clipPath>
      </defs>
      <circle cx="50" cy="50" r="40" fill="#fff" />
      <g clipPath={`url(#e${id})`} fill={color} opacity=".85">
        <path d="M18 30 Q30 18 44 24 Q52 30 44 40 Q36 46 40 56 Q42 66 32 70 Q22 66 20 54 Q12 44 18 30Z" />
        <path d="M58 16 Q72 14 82 26 Q76 34 66 32 Q58 28 58 16Z" />
        <path d="M60 50 Q72 44 84 52 Q88 66 76 78 Q66 84 62 72 Q66 62 60 50Z" />
      </g>
      <circle cx="50" cy="50" r="40" fill="none" stroke="#fff" strokeWidth="3" />
    </svg>
  );
}

export type TileState = "idle" | "picked" | "correct" | "wrong" | "dim";

export function AnswerTile({
  theme,
  index,
  text,
  state = "idle",
  onClick,
  disabled,
  size = "md",
  count,
}: {
  theme: AnswerTheme;
  index: number;
  text?: string;
  state?: TileState;
  onClick?: () => void;
  disabled?: boolean;
  size?: "md" | "lg" | "xl";
  count?: number;
}) {
  const color = ANSWER_COLORS[theme][index];
  const markSize = size === "xl" ? "w-20 h-20" : size === "lg" ? "w-14 h-14" : "w-11 h-11";
  const textSize = size === "xl" ? "text-3xl" : size === "lg" ? "text-2xl" : "text-lg";
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      disabled={onClick ? disabled : undefined}
      className={`state group relative flex items-center gap-4 rounded-[28px] p-4 text-left text-white overflow-hidden w-full
        ${size === "xl" ? "min-h-[40vh] flex-col justify-center text-center" : size === "lg" ? "min-h-28" : "min-h-20"}
        ${state === "dim" || state === "wrong" ? "opacity-35 saturate-50" : ""}
        ${state === "correct" ? "ring-4 ring-offset-4 ring-offset-surface ring-[var(--md-success)] z-10" : ""}
        ${onClick ? "active:scale-[.97] active:rounded-[20px]" : ""}`}
      style={{
        background: color,
        transition: "transform 250ms var(--spring), border-radius 250ms var(--emph), opacity 300ms",
        boxShadow: "inset 0 -6px 0 rgb(0 0 0 / .18)",
      }}
    >
      <AnswerMark
        theme={theme}
        index={index}
        className={`${markSize} shrink-0 drop-shadow-sm transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110`}
      />
      {text != null && (
        <span className={`title ${textSize} leading-tight flex-1 break-words`} style={{ textShadow: "0 1px 2px rgb(0 0 0 / .25)" }}>
          {text}
        </span>
      )}
      {state === "correct" && (
        <span
          className={`icon fill text-[28px] bg-white/25 rounded-full p-1 anim-pop ${count != null ? "" : "absolute top-2 right-2"}`}
        >
          check
        </span>
      )}
      {count != null && <span className="headline text-2xl tabular-nums">{count}</span>}
      {state === "wrong" && <span className="icon absolute top-2 right-2 text-[28px] opacity-90">close</span>}
    </Tag>
  );
}
