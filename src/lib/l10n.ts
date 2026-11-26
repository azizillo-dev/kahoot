import type { L10n, L10nList, Lang } from "./types";

export function tr(v: L10n | undefined | null, lang: Lang): string {
  if (!v) return "";
  if (lang === "ru") return v.ru?.trim() || v.uz || "";
  return v.uz?.trim() || v.ru || "";
}

export function trList(v: L10nList | undefined | null, lang: Lang): string[] {
  if (!v) return [];
  const base = v.uz.length >= (v.ru?.length ?? 0) ? v.uz : v.ru;
  return base.map((_, i) => {
    const uz = v.uz[i]?.trim() ?? "";
    const ru = v.ru?.[i]?.trim() ?? "";
    return lang === "ru" ? ru || uz : uz || ru;
  });
}
