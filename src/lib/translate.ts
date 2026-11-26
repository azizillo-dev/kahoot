import "server-only";
import type { Lang } from "./types";

/** Bepul Google Translate endpoint, ishlamasa MyMemory API. */
async function google(text: string, from: Lang, to: Lang) {
  const u = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
  const r = await fetch(u, { cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error("google " + r.status);
  const j = (await r.json()) as [[string, string][]];
  return j[0].map((x) => x[0]).join("");
}

async function myMemory(text: string, from: Lang, to: Lang) {
  const u = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;
  const r = await fetch(u, { cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error("mymemory " + r.status);
  const j = (await r.json()) as { responseData?: { translatedText?: string } };
  const t = j.responseData?.translatedText;
  if (!t) throw new Error("mymemory empty");
  return t;
}

function decodeEntities(s: string) {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&#x27;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();
}

export async function translateOne(text: string, from: Lang, to: Lang): Promise<string> {
  const t = text.trim();
  if (!t || from === to) return t;
  // Faqat raqam/belgilar bo'lsa tarjima shart emas
  if (!/\p{L}/u.test(t)) return t;
  try {
    return decodeEntities(await google(t, from, to));
  } catch {
    try {
      return decodeEntities(await myMemory(t, from, to));
    } catch {
      return "";
    }
  }
}

export async function translateMany(texts: string[], from: Lang, to: Lang) {
  return Promise.all(texts.map((t) => translateOne(t, from, to)));
}
