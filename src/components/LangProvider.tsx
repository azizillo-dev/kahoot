"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { DICTS, type Dict } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: Dict }>({
  lang: "uz",
  setLang: () => {},
  t: DICTS.uz,
});

export function LangProvider({ initial, children }: { initial: Lang; children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initial);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    document.cookie = `lang=${l}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = l;
  }, []);
  return <Ctx.Provider value={{ lang, setLang, t: DICTS[lang] }}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx);

export function LangSwitch({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <div className={`segmented ${className}`} role="group" aria-label="Til / Язык">
      {(["uz", "ru"] as Lang[]).map((l) => (
        <button key={l} type="button" data-on={lang === l} onClick={() => setLang(l)}>
          {lang === l && <span className="icon text-[18px] hidden sm:inline">check</span>}
          <span className="hidden sm:inline">{l === "uz" ? "O'zbek" : "Русский"}</span>
          <span className="sm:hidden">{l.toUpperCase()}</span>
        </button>
      ))}
    </div>
  );
}
