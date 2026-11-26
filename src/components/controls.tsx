"use client";

import { AnswerMark, ANSWER_COLORS, type AnswerTheme } from "./answers";
import { useLang } from "./LangProvider";

/** Material 3 Switch */
export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-4 cursor-pointer py-2 select-none">
      <span className="flex-1 text-base">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-[52px] h-8 rounded-full border-2 transition-colors duration-200 ${
          checked ? "bg-primary border-primary" : "bg-surface-highest border-outline"
        }`}
      >
        <span
          className={`absolute top-1/2 -translate-y-1/2 rounded-full grid place-items-center transition-all duration-300 ${
            checked ? "left-[22px] w-6 h-6 bg-on-primary text-primary" : "left-[6px] w-4 h-4 bg-outline"
          }`}
          style={{ transitionTimingFunction: "var(--spring)" }}
        >
          {checked && <span className="icon text-[16px]">check</span>}
        </span>
      </button>
    </label>
  );
}

export function ThemePicker({ value, onChange }: { value: AnswerTheme; onChange: (v: AnswerTheme) => void }) {
  const { t } = useLang();
  const opts: { id: AnswerTheme; title: string; d: string }[] = [
    { id: "classic", title: t.themeClassic, d: t.themeClassicD },
    { id: "space", title: t.themeSpace, d: t.themeSpaceD },
  ];
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {opts.map((o) => {
        const on = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={`state text-left rounded-[24px] p-4 border-2 transition-all duration-300 ${
              on ? "border-primary bg-primary-container text-on-primary-container rounded-[32px]" : "border-outline-variant"
            }`}
            aria-pressed={on}
          >
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="aspect-square rounded-2xl grid place-items-center" style={{ background: ANSWER_COLORS[o.id][i] }}>
                  <AnswerMark theme={o.id} index={i} className="w-3/5 h-3/5" />
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="title text-lg flex-1">{o.title}</span>
              {on && <span className="icon fill text-primary">check_circle</span>}
            </div>
            <p className="text-sm opacity-80">{o.d}</p>
          </button>
        );
      })}
    </div>
  );
}
