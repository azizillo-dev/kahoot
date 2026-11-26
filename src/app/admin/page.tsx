"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useLang } from "@/components/LangProvider";
import { Spinner, TopBar } from "@/components/game-ui";
import { AdminGate, BiField, Dialog } from "@/components/admin-ui";
import { ThemePicker } from "@/components/controls";
import { SECTION_ICONS, SECTION_TONES } from "@/components/tones";
import type { AnswerTheme } from "@/components/answers";
import { api } from "@/lib/client";
import { tr } from "@/lib/l10n";
import type { L10n, Section } from "@/lib/types";

type SectionRow = Section & { count: number };
const empty = (): L10n => ({ uz: "", ru: "" });

export default function AdminPage() {
  return <AdminGate>{(_me, logout) => <Dashboard logout={logout} />}</AdminGate>;
}

function Dashboard({ logout }: { logout: () => void }) {
  const { t, lang } = useLang();
  const [tab, setTab] = useState<"sections" | "settings">("sections");
  const [sections, setSections] = useState<SectionRow[] | null>(null);
  const [theme, setTheme] = useState<AnswerTheme>("classic");
  const [savedTheme, setSavedTheme] = useState(false);
  const [editing, setEditing] = useState<Partial<Section> | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api<{ sections: SectionRow[]; settings: { answerTheme: AnswerTheme } }>("/api/sections").then((d) => {
      setSections(d.sections);
      setTheme(d.settings.answerTheme);
    });
  }, []);
  useEffect(load, [load]);

  const saveSection = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      const payload = {
        title: editing.title,
        description: editing.description,
        icon: editing.icon,
        color: editing.color,
      };
      if (editing.id) await api(`/api/admin/sections/${editing.id}`, { method: "PUT", json: payload });
      else await api(`/api/admin/sections`, { method: "POST", json: payload });
      setEditing(null);
      load();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (s: SectionRow) => {
    if (!confirm(`${t.confirmDelete}\n${tr(s.title, lang)} (${s.count} ${t.questions})`)) return;
    await api(`/api/admin/sections/${s.id}`, { method: "DELETE" });
    load();
  };

  const move = async (i: number, dir: -1 | 1) => {
    if (!sections) return;
    const arr = [...sections];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setSections(arr);
    await Promise.all(
      arr.map((s, k) =>
        s.order !== k ? api(`/api/admin/sections/${s.id}`, { method: "PUT", json: { ...s, order: k } }) : null,
      ),
    );
    load();
  };

  return (
    <div className="min-h-dvh">
      <TopBar
        compact
        right={
          <button className="icon-btn" onClick={logout} title={t.logout}>
            <span className="icon">logout</span>
          </button>
        }
      />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pb-24">
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <h1 className="display text-4xl flex-1">{t.admin}</h1>
          <div className="segmented">
            <button data-on={tab === "sections"} onClick={() => setTab("sections")}>
              <span className="icon text-[18px]">library_books</span>
              {t.sections}
            </button>
            <button data-on={tab === "settings"} onClick={() => setTab("settings")}>
              <span className="icon text-[18px]">tune</span>
              {t.settings}
            </button>
          </div>
        </div>

        {tab === "sections" && (
          <section className="mt-6">
            {sections === null ? (
              <Spinner />
            ) : (
              <div className="flex flex-col gap-3">
                {sections.map((s, i) => (
                  <div key={s.id} className={`rounded-[28px] p-4 flex items-center gap-4 anim-rise ${SECTION_TONES[s.color % 6]}`}>
                    <span className="grid place-items-center w-14 h-14 rounded-2xl bg-black/10 shrink-0">
                      <span className="icon fill text-[28px]">{s.icon}</span>
                    </span>
                    <Link href={`/admin/s/${s.id}`} className="min-w-0 flex-1">
                      <span className="headline text-xl block truncate">{tr(s.title, lang)}</span>
                      <span className="text-sm opacity-80 block truncate">
                        {tr(s.title, lang === "uz" ? "ru" : "uz")} · {s.count} {t.questions}
                      </span>
                    </Link>
                    <div className="hidden sm:flex flex-col">
                      <button className="icon-btn !w-8 !h-8 !text-inherit" onClick={() => move(i, -1)} title={t.moveUp} disabled={i === 0}>
                        <span className="icon text-[20px]">keyboard_arrow_up</span>
                      </button>
                      <button
                        className="icon-btn !w-8 !h-8 !text-inherit"
                        onClick={() => move(i, 1)}
                        title={t.moveDown}
                        disabled={i === sections.length - 1}
                      >
                        <span className="icon text-[20px]">keyboard_arrow_down</span>
                      </button>
                    </div>
                    <button className="icon-btn !text-inherit" onClick={() => setEditing(s)} title={t.edit}>
                      <span className="icon">edit</span>
                    </button>
                    <button className="icon-btn !text-inherit" onClick={() => remove(s)} title={t.delete}>
                      <span className="icon">delete</span>
                    </button>
                    <Link href={`/admin/s/${s.id}`} className="btn-filled btn-sm">
                      <span className="icon text-[20px]">quiz</span>
                      <span className="hidden sm:inline">{t.open}</span>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === "settings" && (
          <section className="mt-6 card p-6">
            <h2 className="headline text-xl">{t.defaultTheme}</h2>
            <p className="text-on-surface-variant mb-4">{t.defaultThemeD}</p>
            <ThemePicker
              value={theme}
              onChange={async (v) => {
                setTheme(v);
                await api("/api/admin/settings", { method: "PUT", json: { answerTheme: v } });
                setSavedTheme(true);
                setTimeout(() => setSavedTheme(false), 1500);
              }}
            />
            {savedTheme && (
              <p className="mt-3 text-success label flex items-center gap-1 anim-pop">
                <span className="icon text-[18px]">check</span>
                {t.saved}
              </p>
            )}
          </section>
        )}
      </main>

      {tab === "sections" && (
        <button
          className="fixed right-5 bottom-5 h-16 px-6 rounded-[20px] bg-primary-container text-on-primary-container flex items-center gap-3 shadow-lg state title text-base anim-pop"
          onClick={() => setEditing({ title: empty(), description: empty(), icon: "menu_book", color: (sections?.length ?? 0) % 6 })}
        >
          <span className="icon">add</span>
          {t.addSection}
        </button>
      )}

      <Dialog
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? t.editSection : t.addSection}
        actions={
          <>
            <button className="btn-text" onClick={() => setEditing(null)}>
              {t.cancel}
            </button>
            <button className="btn-filled" disabled={busy || !(editing?.title?.uz || editing?.title?.ru)} onClick={saveSection}>
              {busy && <span className="icon animate-spin text-[18px]">progress_activity</span>}
              {t.save}
            </button>
          </>
        }
      >
        {editing && (
          <div className="flex flex-col gap-5">
            <BiField label={t.title} value={editing.title ?? empty()} onChange={(v) => setEditing({ ...editing, title: v })} />
            <BiField
              label={t.description}
              value={editing.description ?? empty()}
              onChange={(v) => setEditing({ ...editing, description: v })}
            />
            <p className="text-xs text-on-surface-variant -mt-3">{t.autoTranslateHint}</p>
            <div>
              <span className="field-label">{t.icon}</span>
              <div className="flex flex-wrap gap-2">
                {SECTION_ICONS.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setEditing({ ...editing, icon: ic })}
                    className={`state w-11 h-11 rounded-xl grid place-items-center transition-all ${
                      editing.icon === ic ? "bg-primary text-on-primary rounded-[18px]" : "bg-surface-highest"
                    }`}
                  >
                    <span className="icon fill">{ic}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="field-label">{t.color}</span>
              <div className="flex flex-wrap gap-2">
                {SECTION_TONES.map((tone, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setEditing({ ...editing, color: i })}
                    className={`w-11 h-11 rounded-full grid place-items-center ${tone} ${editing.color === i ? "ring-4 ring-primary" : ""}`}
                  >
                    {editing.color === i && <span className="icon">check</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
