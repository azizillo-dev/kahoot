import "server-only";
import { translateMany, translateOne } from "./translate";
import type { L10n, L10nList } from "./types";

const str = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export function cleanL10n(v: unknown, max = 500): L10n {
  const o = (v ?? {}) as Record<string, unknown>;
  return { uz: str(o.uz, max), ru: str(o.ru, max) };
}

/** Bo'sh tomonni avtomatik tarjima qiladi (uz ⇄ ru). */
export async function fillL10n(v: L10n): Promise<L10n> {
  if (v.uz && !v.ru) return { uz: v.uz, ru: await translateOne(v.uz, "uz", "ru") };
  if (v.ru && !v.uz) return { uz: await translateOne(v.ru, "ru", "uz"), ru: v.ru };
  return v;
}

export async function fillList(v: L10nList): Promise<L10nList> {
  const n = Math.max(v.uz.length, v.ru.length);
  const uz = Array.from({ length: n }, (_, i) => v.uz[i] ?? "");
  const ru = Array.from({ length: n }, (_, i) => v.ru[i] ?? "");
  const needRu = uz.map((u, i) => (u && !ru[i] ? i : -1)).filter((i) => i >= 0);
  const needUz = ru.map((r, i) => (r && !uz[i] ? i : -1)).filter((i) => i >= 0);
  const [tRu, tUz] = await Promise.all([
    translateMany(needRu.map((i) => uz[i]), "uz", "ru"),
    translateMany(needUz.map((i) => ru[i]), "ru", "uz"),
  ]);
  needRu.forEach((i, k) => (ru[i] = tRu[k]));
  needUz.forEach((i, k) => (uz[i] = tUz[k]));
  return { uz, ru };
}

export interface QuestionInput {
  text: L10n;
  options: L10nList;
  correct: number;
  time: number;
  points: number;
  image?: string;
}

export function parseQuestion(b: unknown): QuestionInput | string {
  const o = (b ?? {}) as Record<string, unknown>;
  const text = cleanL10n(o.text, 400);
  if (!text.uz && !text.ru) return "text_required";
  const opts = (o.options ?? {}) as Record<string, unknown>;
  const uzArr = Array.isArray(opts.uz) ? opts.uz.map((x) => str(x, 200)) : [];
  const ruArr = Array.isArray(opts.ru) ? opts.ru.map((x) => str(x, 200)) : [];
  const n = Math.min(Math.max(uzArr.length, ruArr.length), 4);
  const options: L10nList = { uz: [], ru: [] };
  for (let i = 0; i < n; i++) {
    options.uz.push(uzArr[i] ?? "");
    options.ru.push(ruArr[i] ?? "");
  }
  if (n < 2 || options.uz.some((u, i) => !u && !options.ru[i])) return "options_required";
  const correct = Number(o.correct);
  if (!Number.isInteger(correct) || correct < 0 || correct >= n) return "correct_required";
  const time = Math.min(Math.max(Math.round(Number(o.time) || 20), 5), 240);
  const p = Number(o.points);
  const points = p === 0 || p === 2000 ? p : 1000;
  const image = str(o.image, 1000);
  if (image && !/^https?:\/\//i.test(image)) return "bad_image";
  return { text, options, correct, time, points, image: image || undefined };
}
