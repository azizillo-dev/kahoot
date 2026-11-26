"use client";

import { useState } from "react";
import { useLang } from "./LangProvider";

/** DiceBear — bepul ochiq avatar servisi (https://www.dicebear.com). Format: "uslub:seed". */
export const AVATAR_STYLES = [
  { id: "adventurer", label: "🧭" },
  { id: "fun-emoji", label: "😄" },
  { id: "bottts", label: "🤖" },
  { id: "lorelei", label: "🌸" },
  { id: "big-smile", label: "😁" },
  { id: "pixel-art", label: "👾" },
  { id: "thumbs", label: "👍" },
  { id: "micah", label: "🎨" },
] as const;

const BG = "b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf,c7f0d8";

export function avatarUrl(a: string) {
  const [style, seed] = a.includes(":") ? a.split(":") : ["adventurer", a];
  return `https://api.dicebear.com/9.x/${encodeURIComponent(style)}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${BG}&radius=50`;
}

export function randomSeed() {
  return Math.random().toString(36).slice(2, 9);
}

export function randomAvatar() {
  const s = AVATAR_STYLES[Math.floor(Math.random() * AVATAR_STYLES.length)].id;
  return `${s}:${randomSeed()}`;
}

export function Avatar({ a, size = 48, className = "" }: { a: string; size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatarUrl(a)}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      className={`rounded-full bg-surface-highest shrink-0 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export function AvatarPicker({ value, onChange }: { value: string; onChange: (a: string) => void }) {
  const { t } = useLang();
  const [style, setStyle] = useState(value.split(":")[0] || "adventurer");
  const [seeds, setSeeds] = useState<string[]>(() => [
    value.split(":")[1] || randomSeed(),
    ...Array.from({ length: 10 }, randomSeed),
  ]);

  const reshuffle = () => {
    const next = Array.from({ length: 11 }, randomSeed);
    setSeeds(next);
    onChange(`${style}:${next[0]}`);
  };

  return (
    <div>
      <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 [scrollbar-width:none]">
        {AVATAR_STYLES.map((s) => (
          <button
            key={s.id}
            type="button"
            className="chip shrink-0 text-lg"
            data-on={style === s.id}
            onClick={() => {
              setStyle(s.id);
              onChange(`${s.id}:${value.split(":")[1] ?? seeds[0]}`);
            }}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-2">
        {seeds.map((seed) => {
          const a = `${style}:${seed}`;
          const on = a === value;
          return (
            <button
              key={seed}
              type="button"
              onClick={() => onChange(a)}
              className={`state rounded-full p-1 transition-transform duration-300 ${on ? "bg-primary scale-110" : "hover:scale-105"}`}
              style={{ transitionTimingFunction: "var(--spring)" }}
              aria-pressed={on}
            >
              <Avatar a={a} size={56} className="w-full h-auto aspect-square" />
            </button>
          );
        })}
        <button
          type="button"
          onClick={reshuffle}
          className="state rounded-full aspect-square bg-tertiary-container text-on-tertiary-container grid place-items-center"
          title={t.shuffleAvatar}
        >
          <span className="icon text-[28px]">casino</span>
        </button>
      </div>
    </div>
  );
}
