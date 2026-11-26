"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLang } from "@/components/LangProvider";
import { Spinner, TopBar } from "@/components/game-ui";
import { AdminGate, BiField, Dialog, translateTexts } from "@/components/admin-ui";
import { AnswerMark, ANSWER_COLORS, type AnswerTheme } from "@/components/answers";
import { SECTION_TONES } from "@/components/tones";
import { api, ApiError } from "@/lib/client";
import { tr, trList } from "@/lib/l10n";
import type { L10n, L10nList, Question, Section } from "@/lib/types";

const TIMES = [5, 10, 20, 30, 45, 60, 90, 120];

type Draft = {
  id?: string;
  text: L10n;
  options: L10nList;
  correct: number;
  time: number;
  points: number;
  image: string;
};

const newDraft = (): Draft => ({
  text: { uz: "", ru: "" },
  options: { uz: ["", "", "", ""], ru: ["", "", "", ""] },
  correct: 0,
  time: 20,
  points: 1000,
  image: "",
});

export default function SectionAdminPage() {
  return <AdminGate>{() => <Editor />}</AdminGate>;
}

function Editor() {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useLang();
  const [section, setSection] = useState<Section | null>(null);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [theme, setTheme] = useState<AnswerTheme>("classic");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [trBusy, setTrBusy] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(() => {
    api<{ section: Section; questions: Question[]; settings: { answerTheme: AnswerTheme } }>(`/api/sections/${id}/questions`).then(
      (d) => {
        setSection(d.section);
        setQuestions(d.questions);
        setTheme(d.settings.answerTheme);
      },
    );
  }, [id]);
  useEffect(load, [load]);

  const save = async () => {
    if (!draft) return;
    setBusy(true);
    setErr("");
    // Ikkala tilda ham bo'sh variantlarni olib tashlaymiz
    const keep = draft.options.uz.map((u, i) => !!(u.trim() || draft.options.ru[i]?.trim()));
    const correct = keep[draft.correct] ? keep.slice(0, draft.correct).filter(Boolean).length : 0;
    const payload = {
      ...draft,
      options: { uz: draft.options.uz.filter((_, i) => keep[i]), ru: draft.options.ru.filter((_, i) => keep[i]) },
      correct,
      image: draft.image.trim(),
    };
    try {
      if (draft.id) await api(`/api/admin/sections/${id}/questions/${draft.id}`, { method: "PUT", json: payload });
      else await api(`/api/admin/sections/${id}/questions`, { method: "POST", json: payload });
      setDraft(null);
      load();
    } catch (e) {
      setErr(e instanceof ApiError ? e.code : t.error);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (q: Question) => {
    if (!confirm(`${t.confirmDelete}\n${tr(q.text, lang)}`)) return;
    await api(`/api/admin/sections/${id}/questions/${q.id}`, { method: "DELETE" });
    load();
  };

  const move = async (i: number, dir: -1 | 1) => {
    if (!questions) return;
    const arr = [...questions];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setQuestions(arr);
    await api(`/api/admin/sections/${id}/questions`, { method: "PATCH", json: { ids: arr.map((q) => q.id) } });
  };

  /** Barcha bo'sh maydonlarni qarama-qarshi tildan tarjima qilish. */
  const translateAll = async () => {
    if (!draft) return;
    setTrBusy(true);
    try {
      const d = structuredClone(draft);
      const jobs: { from: "uz" | "ru"; text: string; apply: (v: string) => void }[] = [];
      if (d.text.uz && !d.text.ru) jobs.push({ from: "uz", text: d.text.uz, apply: (v) => (d.text.ru = v) });
      if (d.text.ru && !d.text.uz) jobs.push({ from: "ru", text: d.text.ru, apply: (v) => (d.text.uz = v) });
      d.options.uz.forEach((u, i) => {
        const r = d.options.ru[i];
        if (u && !r) jobs.push({ from: "uz", text: u, apply: (v) => (d.options.ru[i] = v) });
        if (r && !u) jobs.push({ from: "ru", text: r, apply: (v) => (d.options.uz[i] = v) });
      });
      for (const from of ["uz", "ru"] as const) {
        const js = jobs.filter((j) => j.from === from);
        if (!js.length) continue;
        const res = await translateTexts(
          js.map((j) => j.text),
          from,
        );
        js.forEach((j, k) => j.apply(res[k]));
      }
      setDraft(d);
    } finally {
      setTrBusy(false);
    }
  };

  const setOpt = (l: "uz" | "ru", i: number, v: string) => {
    if (!draft) return;
    const o = { uz: [...draft.options.uz], ru: [...draft.options.ru] };
    o[l][i] = v;
    setDraft({ ...draft, options: o });
  };
  const addOpt = () => draft && setDraft({ ...draft, options: { uz: [...draft.options.uz, ""], ru: [...draft.options.ru, ""] } });
  const delOpt = (i: number) => {
    if (!draft) return;
    const o = { uz: draft.options.uz.filter((_, k) => k !== i), ru: draft.options.ru.filter((_, k) => k !== i) };
    const correct = draft.correct === i ? 0 : draft.correct > i ? draft.correct - 1 : draft.correct;
    setDraft({ ...draft, options: o, correct });
  };

  if (!section || !questions)
    return (
      <div className="min-h-dvh grid place-items-center">
        <Spinner />
      </div>
    );

  return (
    <div className="min-h-dvh">
      <TopBar compact />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pb-28">
        <div className={`rounded-[32px] p-5 sm:p-6 flex items-center gap-4 ${SECTION_TONES[section.color % 6]}`}>
          <Link href="/admin" className="icon-btn !text-inherit" title={t.back}>
            <span className="icon">arrow_back</span>
          </Link>
          <span className="grid place-items-center w-14 h-14 rounded-2xl bg-black/10">
            <span className="icon fill text-[28px]">{section.icon}</span>
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="headline text-2xl sm:text-3xl truncate">{tr(section.title, lang)}</h1>
            <p className="opacity-80 truncate">
              {tr(section.title, lang === "uz" ? "ru" : "uz")} · {questions.length} {t.questions}
            </p>
          </div>
          <Link href={`/create?s=${section.id}`} className="btn-filled hidden sm:inline-flex">
            <span className="icon">play_arrow</span>
            {t.host}
          </Link>
        </div>

        <div className="flex flex-col gap-3 mt-6">
          {questions.length === 0 && <p className="text-on-surface-variant text-center py-10">{t.noQuestions}</p>}
          {questions.map((q, i) => {
            const opts = trList(q.options, lang);
            return (
              <div key={q.id} className="card p-4 sm:p-5 anim-rise">
                <div className="flex items-start gap-3">
                  <span className="grid place-items-center w-10 h-10 rounded-full bg-primary text-on-primary headline shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="title text-lg leading-snug">{tr(q.text, lang)}</p>
                    <p className="text-sm text-on-surface-variant">{tr(q.text, lang === "uz" ? "ru" : "uz")}</p>
                  </div>
                  <div className="flex shrink-0">
                    <button className="icon-btn" onClick={() => move(i, -1)} disabled={i === 0} title={t.moveUp}>
                      <span className="icon">keyboard_arrow_up</span>
                    </button>
                    <button className="icon-btn" onClick={() => move(i, 1)} disabled={i === questions.length - 1} title={t.moveDown}>
                      <span className="icon">keyboard_arrow_down</span>
                    </button>
                    <button
                      className="icon-btn"
                      title={t.edit}
                      onClick={() =>
                        setDraft({
                          id: q.id,
                          text: { ...q.text },
                          options: { uz: [...q.options.uz], ru: [...q.options.ru] },
                          correct: q.correct,
                          time: q.time,
                          points: q.points,
                          image: q.image ?? "",
                        })
                      }
                    >
                      <span className="icon">edit</span>
                    </button>
                    <button className="icon-btn" onClick={() => remove(q)} title={t.delete}>
                      <span className="icon">delete</span>
                    </button>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-2 mt-3">
                  {opts.map((o, k) => (
                    <div
                      key={k}
                      className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-sm ${
                        k === q.correct ? "bg-success-container text-on-success-container" : "bg-surface-high"
                      }`}
                    >
                      <span className="w-7 h-7 rounded-lg grid place-items-center shrink-0" style={{ background: ANSWER_COLORS[theme][k] }}>
                        <AnswerMark theme={theme} index={k} className="w-4 h-4" />
                      </span>
                      <span className="flex-1">{o}</span>
                      {k === q.correct && <span className="icon fill text-[20px]">check_circle</span>}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <span className="chip">
                    <span className="icon text-[16px]">timer</span>
                    {q.time} {t.sec}
                  </span>
                  <span className="chip">
                    <span className="icon text-[16px]">star</span>
                    {q.points === 0 ? t.noPoints : q.points === 2000 ? t.doublePoints : q.points}
                  </span>
                  {q.image && (
                    <span className="chip">
                      <span className="icon text-[16px]">image</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <button
        className="fixed right-5 bottom-5 h-16 px-6 rounded-[20px] bg-primary-container text-on-primary-container flex items-center gap-3 shadow-lg state title text-base anim-pop"
        onClick={() => {
          setErr("");
          setDraft(newDraft());
        }}
      >
        <span className="icon">add</span>
        {t.addQuestion}
      </button>

      <Dialog
        open={!!draft}
        onClose={() => setDraft(null)}
        wide
        title={draft?.id ? t.editQuestion : t.addQuestion}
        actions={
          <>
            {err && <span className="text-error label self-center mr-auto">{err}</span>}
            <button className="btn-text" onClick={() => setDraft(null)}>
              {t.cancel}
            </button>
            <button className="btn-filled" onClick={save} disabled={busy}>
              {busy && <span className="icon animate-spin text-[18px]">progress_activity</span>}
              {t.save}
            </button>
          </>
        }
      >
        {draft && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2 rounded-2xl bg-secondary-container text-on-secondary-container p-3 text-sm">
              <span className="icon">translate</span>
              <span className="flex-1">{t.autoTranslateHint}</span>
              <button className="btn-filled btn-sm" onClick={translateAll} disabled={trBusy}>
                <span className={`icon text-[18px] ${trBusy ? "animate-spin" : ""}`}>{trBusy ? "progress_activity" : "g_translate"}</span>
                {trBusy ? t.translating : t.translate}
              </button>
            </div>

            <BiField label={t.questionText} multiline value={draft.text} onChange={(v) => setDraft({ ...draft, text: v })} />

            <div>
              <span className="field-label">
                {t.answerOptions} — {t.markCorrect}
              </span>
              <div className="flex flex-col gap-2">
                {draft.options.uz.map((_, i) => {
                  const on = draft.correct === i;
                  return (
                    <div key={i} className={`flex items-center gap-2 rounded-[20px] p-2 ${on ? "bg-success-container" : "bg-surface-container"}`}>
                      <button
                        type="button"
                        onClick={() => setDraft({ ...draft, correct: i })}
                        className="relative w-12 h-12 rounded-2xl grid place-items-center shrink-0 state"
                        style={{ background: ANSWER_COLORS[theme][i] }}
                        title={t.markCorrect}
                        aria-pressed={on}
                      >
                        <AnswerMark theme={theme} index={i} className="w-6 h-6" />
                        {on && (
                          <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-success text-white grid place-items-center anim-pop">
                            <span className="icon text-[16px]">check</span>
                          </span>
                        )}
                      </button>
                      <div className="grid sm:grid-cols-2 gap-2 flex-1">
                        <input className="field !h-12" placeholder="UZ" value={draft.options.uz[i]} onChange={(e) => setOpt("uz", i, e.target.value)} />
                        <input className="field !h-12" placeholder="RU" value={draft.options.ru[i] ?? ""} onChange={(e) => setOpt("ru", i, e.target.value)} />
                      </div>
                      {draft.options.uz.length > 2 && (
                        <button type="button" className="icon-btn" onClick={() => delOpt(i)} title={t.delete}>
                          <span className="icon">remove_circle</span>
                        </button>
                      )}
                    </div>
                  );
                })}
                {draft.options.uz.length < 4 && (
                  <button type="button" className="btn-outlined self-start" onClick={addOpt}>
                    <span className="icon">add</span>
                    {t.addOption}
                  </button>
                )}
              </div>
            </div>

            <div>
              <span className="field-label">{t.time}</span>
              <div className="flex flex-wrap gap-2">
                {TIMES.map((s) => (
                  <button key={s} type="button" className="chip" data-on={draft.time === s} onClick={() => setDraft({ ...draft, time: s })}>
                    {s} {t.sec}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="field-label">{t.pointsLabel}</span>
              <div className="segmented">
                {[
                  { v: 0, l: t.noPoints },
                  { v: 1000, l: "1000" },
                  { v: 2000, l: t.doublePoints },
                ].map((p) => (
                  <button key={p.v} type="button" data-on={draft.points === p.v} onClick={() => setDraft({ ...draft, points: p.v })}>
                    {p.l}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="field-label" htmlFor="img">
                {t.image}
              </label>
              <input
                id="img"
                className="field"
                placeholder="https://…"
                value={draft.image}
                onChange={(e) => setDraft({ ...draft, image: e.target.value })}
              />
              {/^https?:\/\//.test(draft.image) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={draft.image} alt="" className="mt-2 max-h-40 rounded-2xl object-contain" />
              )}
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
