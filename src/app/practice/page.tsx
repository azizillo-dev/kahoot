"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLang } from "@/components/LangProvider";
import { Spinner, TopBar } from "@/components/game-ui";
import { ShapeBackdrop } from "@/components/shapes";
import { SECTION_TONES } from "@/components/tones";
import { api } from "@/lib/client";
import { tr } from "@/lib/l10n";
import type { Section } from "@/lib/types";

export default function PracticeList() {
  const { t, lang } = useLang();
  const [sections, setSections] = useState<(Section & { count: number })[] | null>(null);
  useEffect(() => {
    api<{ sections: (Section & { count: number })[] }>("/api/sections")
      .then((d) => setSections(d.sections))
      .catch(() => setSections([]));
  }, []);
  return (
    <div className="min-h-dvh">
      <ShapeBackdrop />
      <TopBar compact />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pb-12">
        <h1 className="display text-4xl sm:text-5xl mt-4">{t.practiceTitle}</h1>
        <p className="text-on-surface-variant text-lg mt-2">{t.practiceSub}</p>
        <div className="grid sm:grid-cols-2 gap-3 mt-6">
          {sections === null && <Spinner />}
          {sections?.length === 0 && <p className="text-on-surface-variant">{t.noSections}</p>}
          {sections?.map((s, i) => (
            <Link
              key={s.id}
              href={`/practice/${s.id}`}
              className={`state rounded-[28px] hover:rounded-[40px] p-5 flex items-center gap-4 anim-rise transition-[border-radius] duration-300 ${SECTION_TONES[s.color % 6]}`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="grid place-items-center w-14 h-14 rounded-2xl bg-black/10">
                <span className="icon fill text-[30px]">{s.icon}</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="headline text-xl block truncate">{tr(s.title, lang)}</span>
                <span className="text-sm opacity-80">
                  {s.count} {t.questions}
                </span>
              </span>
              <span className="icon">arrow_forward</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
