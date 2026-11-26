"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLang } from "./LangProvider";
import { Spinner, TopBar } from "./game-ui";
import { api } from "@/lib/client";
import type { L10n, Lang } from "@/lib/types";

export function Dialog({
  open,
  onClose,
  title,
  children,
  actions,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", h);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid sm:place-items-center bg-[var(--md-scrim)]" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal
        onMouseDown={(e) => e.stopPropagation()}
        className={`anim-pop bg-surface-high w-full ${wide ? "sm:max-w-3xl" : "sm:max-w-lg"} sm:rounded-[28px] h-dvh sm:h-auto sm:max-h-[90dvh] flex flex-col`}
      >
        <div className="flex items-center gap-2 px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
          <button className="icon-btn sm:hidden" onClick={onClose}>
            <span className="icon">close</span>
          </button>
          <h2 className="headline text-2xl flex-1">{title}</h2>
        </div>
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3">{children}</div>
        {actions && <div className="flex justify-end gap-2 px-4 sm:px-6 pb-4 sm:pb-6 pt-2">{actions}</div>}
      </div>
    </div>
  );
}

export async function translateTexts(texts: string[], from: Lang): Promise<string[]> {
  const r = await api<{ texts: string[] }>("/api/admin/translate", { method: "POST", json: { texts, from } });
  return r.texts;
}

/** Ikki tilli maydon: chapda o'zbekcha, o'ngda ruscha, o'rtada tarjima tugmasi. */
export function BiField({
  label,
  value,
  onChange,
  multiline = false,
  placeholder,
}: {
  label: string;
  value: L10n;
  onChange: (v: L10n) => void;
  multiline?: boolean;
  placeholder?: L10n;
}) {
  const { t } = useLang();
  const [busy, setBusy] = useState(false);
  const canTr = (!!value.uz.trim() && !value.ru.trim()) || (!!value.ru.trim() && !value.uz.trim());
  const doTr = async () => {
    const from: Lang = value.uz.trim() ? "uz" : "ru";
    setBusy(true);
    try {
      const [res] = await translateTexts([from === "uz" ? value.uz : value.ru], from);
      onChange(from === "uz" ? { ...value, ru: res } : { ...value, uz: res });
    } finally {
      setBusy(false);
    }
  };
  const Input = multiline ? "textarea" : "input";
  return (
    <div>
      <div className="flex items-center mb-1.5">
        <span className="field-label !mb-0 flex-1">{label}</span>
        <button type="button" className="btn-text btn-sm !h-8" disabled={!canTr || busy} onClick={doTr}>
          <span className={`icon text-[18px] ${busy ? "animate-spin" : ""}`}>{busy ? "progress_activity" : "translate"}</span>
          {busy ? t.translating : t.translate}
        </button>
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        {(["uz", "ru"] as Lang[]).map((l) => (
          <div key={l} className="relative">
            <span className="absolute left-3 top-2 text-[10px] label text-primary uppercase z-10">{l}</span>
            <Input
              className={`field !pt-5 ${multiline ? "min-h-24" : ""}`}
              value={value[l]}
              placeholder={placeholder?.[l]}
              rows={multiline ? 3 : undefined}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange({ ...value, [l]: e.target.value })}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

type Me = { admin: boolean; storageMode: "redis" | "memory"; defaultPassword: boolean };

/** Admin kirish nazorati. */
export function AdminGate({ children }: { children: (me: Me, logout: () => void) => React.ReactNode }) {
  const { t } = useLang();
  const [me, setMe] = useState<Me | null>(null);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => api<Me>("/api/admin/login").then(setMe);
  useEffect(() => {
    load();
  }, []);

  if (!me)
    return (
      <div className="min-h-dvh grid place-items-center">
        <Spinner />
      </div>
    );

  if (!me.admin)
    return (
      <div className="min-h-dvh">
        <TopBar compact />
        <main className="max-w-sm mx-auto px-4 pt-10">
          <form
            className="card-elev p-6 flex flex-col gap-4 anim-rise"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setErr("");
              try {
                await api("/api/admin/login", { method: "POST", json: { password: pw } });
                await load();
              } catch {
                setErr(t.wrongPassword);
              } finally {
                setBusy(false);
              }
            }}
          >
            <span className="grid place-items-center w-16 h-16 rounded-[24px] bg-primary-container text-on-primary-container">
              <span className="icon text-[32px]">admin_panel_settings</span>
            </span>
            <h1 className="headline text-2xl">{t.admin}</h1>
            <div>
              <label className="field-label" htmlFor="pw">
                {t.password}
              </label>
              <input id="pw" type="password" className="field" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
            </div>
            {err && <p className="text-error label">{err}</p>}
            <button className="btn-filled" disabled={busy || !pw}>
              {t.login}
            </button>
            <Link href="/" className="btn-text self-center">
              {t.home}
            </Link>
          </form>
        </main>
      </div>
    );

  const logout = async () => {
    await api("/api/admin/login", { method: "DELETE" });
    await load();
  };
  return (
    <>
      {(me.storageMode === "memory" || me.defaultPassword) && (
        <div className="bg-error-container text-on-error-container px-4 py-2 text-sm flex flex-col gap-0.5">
          {me.storageMode === "memory" && (
            <span className="flex items-center gap-2">
              <span className="icon text-[18px]">database</span>
              {t.storageMemory}
            </span>
          )}
          {me.defaultPassword && (
            <span className="flex items-center gap-2">
              <span className="icon text-[18px]">key</span>
              {t.defaultPass}
            </span>
          )}
        </div>
      )}
      {children(me, logout)}
    </>
  );
}
