"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { BoardEntry } from "@/lib/types";
import { Avatar } from "./avatar";
import { LangSwitch, useLang } from "./LangProvider";
import { Logo } from "./shapes";

export function TopBar({ right, compact = false }: { right?: React.ReactNode; compact?: boolean }) {
  const { t } = useLang();
  return (
    <header className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-6 ${compact ? "h-16" : "h-20"}`}>
      <Link href="/" className="flex items-center gap-2.5 rounded-full pr-3 state">
        <Logo size={compact ? 36 : 42} />
        <span className="headline text-xl sm:text-2xl text-on-surface hidden min-[360px]:inline">{t.appName}</span>
      </Link>
      <div className="flex-1" />
      {right}
      <LangSwitch />
    </header>
  );
}

/** Aylana taymer. */
export function TimerRing({ remainingMs, totalMs, size = 96 }: { remainingMs: number; totalMs: number; size?: number }) {
  const frac = Math.max(0, Math.min(1, remainingMs / totalMs));
  const secs = Math.ceil(Math.max(0, remainingMs) / 1000);
  const r = 44;
  const c = 2 * Math.PI * r;
  const urgent = secs <= 5 && remainingMs > 0;
  return (
    <div className={`relative grid place-items-center ${urgent ? "anim-wiggle" : ""}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
        <circle cx="50" cy="50" r={r} fill="var(--md-surface-container-highest)" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={urgent ? "var(--md-error)" : "var(--md-primary)"}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - frac)}
          style={{ transition: "stroke-dashoffset 120ms linear, stroke 300ms" }}
        />
      </svg>
      <span className={`relative display tabular-nums ${urgent ? "text-error" : "text-on-surface"}`} style={{ fontSize: size * 0.36 }}>
        {secs}
      </span>
    </div>
  );
}

/** Savol ochilishidan oldingi "tayyorlaning" chizig'i. */
export function ReadyBar({ remainingMs, totalMs }: { remainingMs: number; totalMs: number }) {
  const frac = Math.max(0, Math.min(1, remainingMs / totalMs));
  return (
    <div className="h-3 w-full rounded-full bg-surface-highest overflow-hidden">
      <div
        className="h-full rounded-full bg-primary origin-left"
        style={{ transform: `scaleX(${frac})`, transition: "transform 120ms linear" }}
      />
    </div>
  );
}

export function RankDelta({ e }: { e: BoardEntry }) {
  if (!e.prevRank || e.prevRank === e.rank) return null;
  const up = e.rank < e.prevRank;
  return (
    <span className={`inline-flex items-center text-xs label ${up ? "text-success" : "text-error"}`}>
      <span className="icon text-[18px]">{up ? "arrow_upward" : "arrow_downward"}</span>
      {Math.abs(e.prevRank - e.rank)}
    </span>
  );
}

export function Leaderboard({ entries, meId, big = false }: { entries: BoardEntry[]; meId?: string; big?: boolean }) {
  const { t } = useLang();
  return (
    <ol className="flex flex-col gap-2">
      {entries.map((e, i) => (
        <li
          key={e.id}
          className={`anim-rise flex items-center gap-3 rounded-full pl-2 pr-5 ${big ? "h-20" : "h-16"} ${
            e.id === meId ? "bg-primary text-on-primary" : i === 0 ? "bg-tertiary-container text-on-tertiary-container" : "bg-surface-high"
          }`}
          style={{ animationDelay: `${i * 70}ms` }}
        >
          <span className={`grid place-items-center rounded-full bg-black/10 headline tabular-nums ${big ? "w-14 h-14 text-2xl" : "w-11 h-11 text-lg"}`}>
            {e.rank}
          </span>
          <Avatar a={e.avatar} size={big ? 52 : 40} />
          <span className={`title truncate flex-1 ${big ? "text-2xl" : "text-base"}`}>
            {e.name}
            {e.id === meId && <span className="opacity-70 text-sm"> ({t.you})</span>}
          </span>
          {e.streak >= 2 && (
            <span className="inline-flex items-center gap-0.5 label text-sm" title={`${e.streak} ${t.streak}`}>
              <span className="icon fill text-[20px] text-[#ff7a00]">local_fire_department</span>
              {e.streak}
            </span>
          )}
          <RankDelta e={e} />
          <span className={`headline tabular-nums ${big ? "text-2xl" : "text-lg"}`}>{e.score.toLocaleString("ru-RU")}</span>
        </li>
      ))}
    </ol>
  );
}

const PODIUM_STYLE = [
  { h: "h-56", bg: "bg-[#f2c230] text-[#3d2e00]", medal: "🥇", order: "order-2" },
  { h: "h-40", bg: "bg-[#c9ced6] text-[#262b33]", medal: "🥈", order: "order-1" },
  { h: "h-28", bg: "bg-[#d99a6c] text-[#3a1f0c]", medal: "🥉", order: "order-3" },
];

export function Podium({ entries }: { entries: BoardEntry[] }) {
  const top = entries.slice(0, 3);
  return (
    <div className="flex items-end justify-center gap-3 sm:gap-5 w-full max-w-3xl mx-auto">
      {top.map((e, i) => {
        const s = PODIUM_STYLE[i];
        return (
          <div key={e.id} className={`flex flex-col items-center flex-1 max-w-56 ${s.order}`}>
            <div className="anim-pop flex flex-col items-center mb-2" style={{ animationDelay: `${(3 - i) * 500 + 300}ms` }}>
              <Avatar a={e.avatar} size={i === 0 ? 96 : 72} className="ring-4 ring-surface shadow-lg" />
              <span className="title text-lg mt-2 text-center line-clamp-1">{e.name}</span>
              <span className="label text-on-surface-variant tabular-nums">{e.score.toLocaleString("ru-RU")}</span>
            </div>
            <div
              className={`w-full ${s.h} ${s.bg} rounded-t-[28px] grid place-items-start justify-center pt-3 origin-bottom`}
              style={{ animation: `podium 700ms var(--spring) both`, animationDelay: `${(3 - i) * 500}ms` }}
            >
              <span className="text-5xl">{s.medal}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Confetti({ count = 80 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 2.5,
        dur: 3 + Math.random() * 3,
        dx: `${(Math.random() - 0.5) * 30}vw`,
        rot: `${Math.random() * 1080 - 540}deg`,
        color: ["#e0263f", "#1868db", "#c98a00", "#1f8f3a", "#8a3fb5", "#e2650f"][i % 6],
        w: 6 + Math.random() * 8,
        round: Math.random() > 0.6,
      })),
    [count],
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute top-0"
          style={
            {
              left: `${p.left}%`,
              width: p.w,
              height: p.round ? p.w : p.w * 1.8,
              borderRadius: p.round ? "50%" : 2,
              background: p.color,
              animation: `confetti-fall ${p.dur}s ${p.delay}s cubic-bezier(.2,.6,.4,1) both`,
              "--dx": p.dx,
              "--rot": p.rot,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 50 50" className={`w-10 h-10 animate-spin ${className}`} aria-hidden>
      <circle cx="25" cy="25" r="20" fill="none" stroke="var(--md-primary)" strokeWidth="5" strokeLinecap="round" strokeDasharray="90 150" />
    </svg>
  );
}

export function CenterMsg({ icon, title, sub, children }: { icon?: string; title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="min-h-[60vh] grid place-items-center p-6 text-center">
      <div className="anim-rise flex flex-col items-center gap-3 max-w-md">
        {icon && (
          <span className="grid place-items-center w-20 h-20 rounded-[28px] bg-secondary-container text-on-secondary-container">
            <span className="icon text-[40px]">{icon}</span>
          </span>
        )}
        <h1 className="headline text-2xl">{title}</h1>
        {sub && <p className="text-on-surface-variant">{sub}</p>}
        {children}
      </div>
    </div>
  );
}
