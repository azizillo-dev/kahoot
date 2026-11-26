"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLang } from "@/components/LangProvider";
import { Spinner, TopBar } from "@/components/game-ui";
import { Switch, ThemePicker } from "@/components/controls";
import { ShapeBackdrop } from "@/components/shapes";
import { SECTION_TONES } from "@/components/tones";
import type { AnswerTheme } from "@/components/answers";
import { api, store } from "@/lib/client";
import { tr } from "@/lib/l10n";
import type { Section } from "@/lib/types";

const LIMITS = [5, 10, 15, 20, 0];

function CreateInner() {
  const { t, lang } = useLang();
  const router = useRouter();
  const params = useSearchParams();
  const [sections, setSections] = useState<(Section & { count: number })[] | null>(null);
  const [picked, setPicked] = useState<string[]>(() => (params.get("s") ? [params.get("s")!] : []));
  const [shuffleQ, setShuffleQ] = useState(false);
  const [shuffleA, setShuffleA] = useState(true);
  const [limit, setLimit] = useState(0);
  const [theme, setTheme] = useState<AnswerTheme>("classic");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    api<{ sections: (Section & { count: number })[]; settings: { answerTheme: AnswerTheme } }>("/api/sections")
      .then((d) => {
        setSections(d.sections);
        setTheme(d.settings.answerTheme);
      })
      .catch(() => setSections([]));
  }, []);

  const total = (sections ?? []).filter((s) => picked.includes(s.id)).reduce((a, s) => a + s.count, 0);

  const create = async () => {
    setBusy(true);
    setErr("");
    try {
      const r = await api<{ code: string; hostToken: string }>("/api/rooms", {
        method: "POST",
        json: { sectionIds: picked, shuffleQuestions: shuffleQ, shuffleAnswers: shuffleA, limit, theme },
      });
      store<string>(`host:${r.code}`).set(r.hostToken);
      router.push(`/host/${r.code}`);
    } catch {
      setErr(t.error);
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh pb-32">
      <ShapeBackdrop />
      <TopBar compact />
      <main className="max-w-5xl mx-auto px-4 sm:px-6">
        <h1 className="display text-4xl sm:text-5xl mt-4">{t.createTitle}</h1>
        <p className="text-on-surface-variant mt-2 text-lg">{t.createSub}</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
          {sections === null && <Spinner />}
          {sections?.length === 0 && <p className="text-on-surface-variant">{t.noSections}</p>}
          {sections?.map((s) => {
            const on = picked.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                disabled={!s.count}
                onClick={() => setPicked((p) => (on ? p.filter((x) => x !== s.id) : [...p, s.id]))}
                className={`state text-left p-5 flex items-center gap-4 transition-all duration-300 ${SECTION_TONES[s.color % 6]} ${
                  on ? "rounded-[40px] ring-4 ring-primary" : "rounded-[24px]"
                } disabled:opacity-40`}
                style={{ transitionTimingFunction: "var(--spring)" }}
                aria-pressed={on}
              >
                <span className={`grid place-items-center w-12 h-12 rounded-2xl transition-colors ${on ? "bg-primary text-on-primary" : "bg-black/10"}`}>
                  <span className="icon fill text-[26px]">{on ? "check" : s.icon}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="headline text-lg block truncate">{tr(s.title, lang)}</span>
                  <span className="text-sm opacity-80">
                    {s.count} {t.questions}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <h2 className="headline text-2xl mt-10 mb-3">{t.options}</h2>
        <div className="card p-5 sm:p-6 flex flex-col gap-2">
          <Switch checked={shuffleQ} onChange={setShuffleQ} label={t.shuffleQ} />
          <Switch checked={shuffleA} onChange={setShuffleA} label={t.shuffleA} />
          <div className="py-2">
            <div className="mb-2">{t.limit}</div>
            <div className="flex flex-wrap gap-2">
              {LIMITS.map((l) => (
                <button key={l} type="button" className="chip" data-on={limit === l} onClick={() => setLimit(l)}>
                  {limit === l && <span className="icon text-[18px]">check</span>}
                  {l || t.all}
                </button>
              ))}
            </div>
          </div>
          <div className="pt-3">
            <div className="mb-3">{t.answerStyle}</div>
            <ThemePicker value={theme} onChange={setTheme} />
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 inset-x-0 p-4 bg-gradient-to-t from-surface via-surface/95 to-transparent">
        <div className="max-w-5xl mx-auto flex items-center gap-4 justify-end">
          {err && <span className="text-error label">{err}</span>}
          <span className="text-on-surface-variant label hidden sm:inline">
            {picked.length} {t.selected} · {limit ? Math.min(limit, total) : total} {t.questions}
          </span>
          <button className="btn-filled btn-lg shadow-lg" disabled={!picked.length || !total || busy} onClick={create}>
            <span className="icon">rocket_launch</span>
            {t.create}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense>
      <CreateInner />
    </Suspense>
  );
}
