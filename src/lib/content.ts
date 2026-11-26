import "server-only";
import { kv } from "./store";
import { randomId } from "./auth";
import { SEED } from "./seed";
import type { Question, Section } from "./types";

export type AnswerTheme = "classic" | "space";
export interface Settings {
  answerTheme: AnswerTheme;
}

const K_SECTIONS = "sections";
const K_SEEDED = "seeded:v1";
const K_SETTINGS = "settings";
const kQ = (sectionId: string) => `qs:${sectionId}`;

async function ensureSeed() {
  if (await kv.exists(K_SEEDED)) return;
  const now = Date.now();
  for (const [si, s] of SEED.entries()) {
    const section: Section = {
      id: s.id,
      title: s.title,
      description: s.description,
      icon: s.icon,
      color: s.color,
      order: si,
      createdAt: now + si,
    };
    await kv.hset(K_SECTIONS, { [s.id]: section });
    const qs: Record<string, Question> = {};
    s.questions.forEach((q, i) => {
      const id = randomId();
      qs[id] = {
        id,
        sectionId: s.id,
        text: q.text,
        options: { uz: q.uz, ru: q.ru },
        correct: q.correct,
        time: q.time ?? 20,
        points: 1000,
        order: i,
        createdAt: now + i,
      };
    });
    await kv.hset(kQ(s.id), qs);
  }
  await kv.set(K_SEEDED, 1);
}

export async function getSettings(): Promise<Settings> {
  const s = await kv.get<Settings>(K_SETTINGS);
  return { answerTheme: s?.answerTheme === "space" ? "space" : "classic" };
}

export async function saveSettings(s: Settings) {
  await kv.set(K_SETTINGS, s);
}

export async function listSections(): Promise<(Section & { count: number })[]> {
  await ensureSeed();
  const all = Object.values(await kv.hgetall<Section>(K_SECTIONS));
  const withCounts = await Promise.all(all.map(async (s) => ({ ...s, count: await kv.hlen(kQ(s.id)) })));
  return withCounts.sort((a, b) => a.order - b.order || a.createdAt - b.createdAt);
}

export async function getSection(id: string) {
  await ensureSeed();
  return kv.hget<Section>(K_SECTIONS, id);
}

export async function saveSection(s: Section) {
  await kv.hset(K_SECTIONS, { [s.id]: s });
}

export async function deleteSection(id: string) {
  await kv.hdel(K_SECTIONS, id);
  await kv.del(kQ(id));
}

export async function listQuestions(sectionId: string): Promise<Question[]> {
  await ensureSeed();
  const all = Object.values(await kv.hgetall<Question>(kQ(sectionId)));
  return all.sort((a, b) => a.order - b.order || a.createdAt - b.createdAt);
}

export async function saveQuestion(q: Question) {
  await kv.hset(kQ(q.sectionId), { [q.id]: q });
}

export async function deleteQuestion(sectionId: string, id: string) {
  await kv.hdel(kQ(sectionId), id);
}

export async function reorderQuestions(sectionId: string, ids: string[]) {
  const all = await kv.hgetall<Question>(kQ(sectionId));
  const upd: Record<string, Question> = {};
  ids.forEach((id, i) => {
    if (all[id]) upd[id] = { ...all[id], order: i };
  });
  await kv.hset(kQ(sectionId), upd);
}
