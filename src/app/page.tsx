"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LangProvider";
import { TopBar } from "@/components/game-ui";
import { Shape, ShapeBackdrop, type ShapeName } from "@/components/shapes";
import { AnswerMark, ANSWER_COLORS } from "@/components/answers";
import { SECTION_TONES } from "@/components/tones";
import { api } from "@/lib/client";
import { tr } from "@/lib/l10n";
import type { Section } from "@/lib/types";


function Orbit() {
  const marks: { theme: "classic" | "space"; i: number; pos: string; delay: string }[] = [
    { theme: "classic", i: 0, pos: "top-[4%] left-[16%]", delay: "0s" },
    { theme: "space", i: 1, pos: "top-[10%] right-[6%]", delay: "-2s" },
    { theme: "classic", i: 3, pos: "bottom-[14%] right-[12%]", delay: "-4s" },
    { theme: "space", i: 2, pos: "bottom-[4%] left-[10%]", delay: "-6s" },
    { theme: "space", i: 3, pos: "top-[44%] -left-[2%]", delay: "-1s" },
    { theme: "classic", i: 1, pos: "top-[40%] -right-[2%]", delay: "-3s" },
  ];
  return (
    <div className="relative aspect-square w-full max-w-[460px] mx-auto">
      <Shape name="cookie12" className="absolute inset-[12%] text-primary-container anim-spin-slow" />
      <Shape name="clover4" className="absolute inset-[26%] text-primary" style={{ animation: "spin-slow 26s linear infinite reverse" }} />
      <div className="absolute inset-0 grid place-items-center">
        <span className="icon fill text-on-primary" style={{ fontSize: 96 }}>
          auto_stories
        </span>
      </div>
      {marks.map((m, k) => (
        <div
          key={k}
          className={`absolute ${m.pos} w-[22%] aspect-square rounded-[30%] grid place-items-center anim-float shadow-lg`}
          style={{ background: ANSWER_COLORS[m.theme][m.i], animationDelay: m.delay }}
        >
          <AnswerMark theme={m.theme} index={m.i} className="w-[62%] h-[62%]" />
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const { t, lang } = useLang();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [sections, setSections] = useState<(Section & { count: number })[] | null>(null);

  useEffect(() => {
    api<{ sections: (Section & { count: number })[] }>("/api/sections")
      .then((d) => setSections(d.sections))
      .catch(() => setSections([]));
  }, []);

  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.replace(/\D/g, "");
    if (c.length !== 6) return setErr(t.codeInvalid);
    setBusy(true);
    try {
      await api(`/api/rooms/${c}`);
      router.push(`/play/${c}`);
    } catch {
      setErr(t.roomNotFound);
      setBusy(false);
    }
  };

  const steps: { icon: string; shape: ShapeName; tone: string; title: string; d: string }[] = [
    { icon: "add_circle", shape: "cookie9", tone: "text-primary-container", title: t.step1, d: t.step1d },
    { icon: "qr_code_2", shape: "clover4", tone: "text-secondary-container", title: t.step2, d: t.step2d },
    { icon: "bolt", shape: "burst", tone: "text-tertiary-container", title: t.step3, d: t.step3d },
  ];

  return (
    <div className="min-h-dvh">
      <ShapeBackdrop />
      <TopBar
        right={
          <Link href="/admin" className="icon-btn hidden sm:inline-flex" title={t.admin}>
            <span className="icon">admin_panel_settings</span>
          </Link>
        }
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 overflow-x-clip">
        <section className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-8 items-center pt-4 lg:pt-10">
          <div className="anim-rise min-w-0">
            <span className="chip" data-on="true">
              <span className="icon fill text-[18px]">menu_book</span>
              {t.tagline}
            </span>
            <h1 className="display text-[44px] sm:text-6xl lg:text-7xl mt-5 text-balance">{t.heroTitle}</h1>
            <p className="text-lg text-on-surface-variant mt-4 max-w-xl">{t.heroSub}</p>

            <form onSubmit={join} className="mt-8 card-elev p-2 flex items-center gap-2 max-w-lg rounded-full">
              <span className="icon text-on-surface-variant ml-3 sm:ml-4">pin</span>
              <input
                inputMode="numeric"
                autoComplete="off"
                maxLength={7}
                placeholder={t.enterCode}
                value={code}
                onChange={(e) => {
                  setErr("");
                  const d = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setCode(d.length > 3 ? `${d.slice(0, 3)} ${d.slice(3)}` : d);
                }}
                className="flex-1 w-0 min-w-0 bg-transparent outline-none headline text-2xl tracking-[0.2em] placeholder:tracking-normal placeholder:text-lg placeholder:font-medium placeholder:text-on-surface-variant h-14"
                aria-label={t.enterCode}
              />
              <button className="btn-filled !h-14 sm:!px-8 sm:!text-lg" disabled={busy}>
                {t.join}
                <span className="icon">arrow_forward</span>
              </button>
            </form>
            {err && (
              <p className="mt-2 ml-6 text-error text-sm label flex items-center gap-1">
                <span className="icon text-[18px]">error</span>
                {err}
              </p>
            )}

            <div className="flex flex-wrap gap-3 mt-6">
              <Link href="/create" className="btn-tonal sm:btn-lg">
                <span className="icon">add</span>
                {t.createRoom}
              </Link>
              <Link href="/practice" className="btn-outlined sm:btn-lg">
                <span className="icon">self_improvement</span>
                {t.practice}
              </Link>
            </div>
          </div>
          <div className="anim-pop min-w-0 px-4 sm:px-0" style={{ animationDelay: "150ms" }}>
            <Orbit />
          </div>
        </section>

        <section className="mt-20">
          <h2 className="headline text-3xl mb-6">{t.howItWorks}</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {steps.map((s, i) => (
              <div key={i} className="card p-6 anim-rise" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="relative w-16 h-16 grid place-items-center mb-4">
                  <Shape name={s.shape} className={`absolute inset-0 ${s.tone}`} />
                  <span className="icon relative text-[30px]">{s.icon}</span>
                </div>
                <div className="label text-primary text-sm">0{i + 1}</div>
                <h3 className="headline text-xl mt-1">{s.title}</h3>
                <p className="text-on-surface-variant mt-2">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <div className="flex items-end justify-between mb-6">
            <h2 className="headline text-3xl">{t.books}</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sections === null &&
              [0, 1, 2].map((i) => <div key={i} className="card h-36 animate-pulse" />)}
            {sections?.map((s, i) => (
              <div
                key={s.id}
                className={`rounded-[28px] p-5 flex flex-col gap-3 anim-rise ${SECTION_TONES[s.color % 6]}`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-center gap-3">
                  <span className="grid place-items-center w-12 h-12 rounded-2xl bg-black/10">
                    <span className="icon fill text-[26px]">{s.icon}</span>
                  </span>
                  <div className="min-w-0">
                    <h3 className="headline text-xl truncate">{tr(s.title, lang)}</h3>
                    <p className="text-sm opacity-80 truncate">{tr(s.description, lang)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-auto">
                  <span className="label text-sm opacity-80">
                    {s.count} {t.questions}
                  </span>
                  <div className="flex-1" />
                  <Link href={`/practice/${s.id}`} className="icon-btn !text-inherit" title={t.practice}>
                    <span className="icon">self_improvement</span>
                  </Link>
                  <Link href={`/create?s=${s.id}`} className="btn-filled btn-sm">
                    <span className="icon text-[20px]">play_arrow</span>
                    {t.host}
                  </Link>
                </div>
              </div>
            ))}
            {sections?.length === 0 && <p className="text-on-surface-variant">{t.noSections}</p>}
          </div>
        </section>
      </main>
    </div>
  );
}
