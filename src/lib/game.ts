import "server-only";
import crypto from "node:crypto";
import { kv } from "./store";
import { randomId } from "./auth";
import { getSection, getSettings, listQuestions } from "./content";
import type {
  AnswerRec,
  HostAction,
  BoardEntry,
  HostView,
  L10n,
  Player,
  PlayerView,
  Room,
  RoomQuestion,
} from "./types";

const TTL = 60 * 60 * 8; // 8 soat
const READY_MS = 4000; // savol matni ko'rsatilib, variantlar ochilguncha
const GRACE_MS = 800; // tarmoq kechikishi uchun
export const MAX_PLAYERS = 300;

const kRoom = (c: string) => `room:${c}`;
const kPlayers = (c: string) => `room:${c}:p`;
const kAnswers = (c: string, i: number) => `room:${c}:a:${i}`;

function shuffle<T>(a: T[]) {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

export async function getRoom(code: string) {
  return kv.get<Room>(kRoom(code));
}

async function saveRoom(r: Room) {
  await kv.set(kRoom(r.code), r, TTL);
}

export interface CreateOpts {
  sectionIds: string[];
  shuffleQuestions?: boolean;
  shuffleAnswers?: boolean;
  limit?: number;
  theme?: "classic" | "space";
}

export async function createRoom(o: CreateOpts) {
  const titles: L10n[] = [];
  let questions: RoomQuestion[] = [];
  for (const id of o.sectionIds) {
    const s = await getSection(id);
    if (!s) continue;
    titles.push(s.title);
    const qs = await listQuestions(id);
    questions.push(
      ...qs.map((q) => ({
        text: q.text,
        options: q.options,
        correct: q.correct,
        time: q.time,
        points: q.points,
        image: q.image,
      })),
    );
  }
  if (!questions.length) throw new Error("no_questions");
  if (o.shuffleQuestions) questions = shuffle(questions);
  if (o.limit && o.limit > 0) questions = questions.slice(0, o.limit);
  if (o.shuffleAnswers) {
    questions = questions.map((q) => {
      const idx = shuffle(q.options.uz.map((_, i) => i));
      return {
        ...q,
        options: { uz: idx.map((i) => q.options.uz[i]), ru: idx.map((i) => q.options.ru?.[i] ?? "") },
        correct: idx.indexOf(q.correct),
      };
    });
  }

  let code = "";
  for (let i = 0; i < 20; i++) {
    code = String(crypto.randomInt(100000, 1000000));
    if (!(await kv.exists(kRoom(code)))) break;
  }
  const settings = await getSettings();
  const room: Room = {
    code,
    hostToken: randomId(24),
    title: {
      uz: titles.map((t) => t.uz).join(" · "),
      ru: titles.map((t) => t.ru || t.uz).join(" · "),
    },
    createdAt: Date.now(),
    phase: "lobby",
    qIndex: -1,
    qStartAt: 0,
    qEndsAt: 0,
    questions,
    board: [],
    stats: [],
    revealedIndex: -1,
    theme: o.theme ?? settings.answerTheme,
    fastest: null,
    answeredInfo: null,
  };
  await saveRoom(room);
  return room;
}

export async function joinRoom(code: string, name: string, avatar: string) {
  const room = await getRoom(code);
  if (!room) throw new Error("not_found");
  if (room.phase === "finished") throw new Error("finished");
  const players = await kv.hgetall<Player>(kPlayers(code));
  const list = Object.values(players);
  if (list.length >= MAX_PLAYERS) throw new Error("full");
  if (list.some((p) => p.name.toLowerCase() === name.toLowerCase())) throw new Error("name_taken");
  const p: Player = {
    id: randomId(),
    name,
    avatar,
    token: randomId(24),
    score: 0,
    streak: 0,
    correctCount: 0,
    joinedAt: Date.now(),
  };
  await kv.hset(kPlayers(code), { [p.id]: p });
  await kv.expire(kPlayers(code), TTL);
  return p;
}

/** Ball: tezroq javob — ko'proq ball (to'liq ballning 50–100%), ketma-ket to'g'ri javoblar uchun bonus. */
export function calcPoints(q: RoomQuestion, ms: number, streak: number) {
  if (!q.points) return 0;
  const t = Math.min(Math.max(ms / (q.time * 1000), 0), 1);
  const base = Math.round(q.points * (1 - t / 2));
  const bonus = Math.min(Math.max(streak - 1, 0), 5) * 100 * (q.points / 1000);
  return base + bonus;
}

async function doReveal(room: Room) {
  if (room.phase !== "question" || room.revealedIndex === room.qIndex) return room;
  const q = room.questions[room.qIndex];
  const [players, answers] = await Promise.all([
    kv.hgetall<Player>(kPlayers(room.code)),
    kv.hgetall<AnswerRec>(kAnswers(room.code, room.qIndex)),
  ]);
  const stats = q.options.uz.map(() => 0);
  const prevRanks = new Map(room.board.map((b) => [b.id, b.rank]));
  const updated: Record<string, Player> = {};
  const entries: BoardEntry[] = [];
  let fastest: Room["fastest"] = null;

  for (const p of Object.values(players)) {
    const a = answers[p.id];
    let lastPoints = 0;
    let lastCorrect: boolean | null = null;
    if (a) {
      if (a.choice >= 0 && a.choice < stats.length) stats[a.choice]++;
      lastCorrect = a.choice === q.correct;
      if (lastCorrect) {
        p.streak += 1;
        p.correctCount += 1;
        lastPoints = calcPoints(q, a.ms, p.streak);
        p.score += lastPoints;
        if (!fastest || a.ms < fastest.ms) fastest = { id: p.id, name: p.name, avatar: p.avatar, ms: a.ms };
      } else p.streak = 0;
    } else p.streak = 0;
    updated[p.id] = p;
    entries.push({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      score: p.score,
      rank: 0,
      prevRank: prevRanks.get(p.id) ?? 0,
      lastPoints,
      lastCorrect,
      lastChoice: a ? a.choice : null,
      streak: p.streak,
      correctCount: p.correctCount,
    });
  }
  entries.sort((x, y) => y.score - x.score || x.name.localeCompare(y.name));
  entries.forEach((e, i) => {
    e.rank = i > 0 && entries[i - 1].score === e.score ? entries[i - 1].rank : i + 1;
  });

  await kv.hset(kPlayers(room.code), updated);
  room.phase = "reveal";
  room.revealedIndex = room.qIndex;
  room.board = entries;
  room.stats = stats;
  room.fastest = fastest;
  room.answeredInfo = { answered: Object.keys(answers).length, total: entries.length };
  room.qEndsAt = Math.min(room.qEndsAt, Date.now());
  await saveRoom(room);
  return room;
}

function startQuestion(room: Room, index: number) {
  const now = Date.now();
  room.phase = "question";
  room.qIndex = index;
  room.qStartAt = now + READY_MS;
  room.qEndsAt = room.qStartAt + room.questions[index].time * 1000;
  room.stats = [];
  room.fastest = null;
  room.answeredInfo = null;
}


export type { HostAction };

export async function hostAction(code: string, token: string, action: HostAction, arg?: string) {
  const room = await getRoom(code);
  if (!room) throw new Error("not_found");
  if (room.hostToken !== token) throw new Error("forbidden");

  switch (action) {
    case "start":
      if (room.phase !== "lobby") break;
      startQuestion(room, 0);
      await saveRoom(room);
      break;
    case "reveal":
      await doReveal(room);
      break;
    case "board":
      if (room.phase === "reveal") {
        room.phase = "leaderboard";
        await saveRoom(room);
      }
      break;
    case "next":
      if (room.phase === "question") await doReveal(room);
      if (room.qIndex + 1 >= room.questions.length) room.phase = "finished";
      else startQuestion(room, room.qIndex + 1);
      await saveRoom(room);
      break;
    case "finish":
      if (room.phase === "question") await doReveal(room);
      room.phase = "finished";
      await saveRoom(room);
      break;
    case "kick":
      if (arg) {
        await kv.hdel(kPlayers(code), arg);
        room.board = room.board.filter((b) => b.id !== arg);
        await saveRoom(room);
      }
      break;
  }
  return room;
}

export async function submitAnswer(code: string, pid: string, token: string, qIndex: number, choice: number) {
  const room = await getRoom(code);
  if (!room) throw new Error("not_found");
  const p = await kv.hget<Player>(kPlayers(code), pid);
  if (!p || p.token !== token) throw new Error("forbidden");
  if (room.phase !== "question" || room.qIndex !== qIndex) throw new Error("closed");
  const now = Date.now();
  if (now < room.qStartAt - 300) throw new Error("too_early");
  if (now > room.qEndsAt + GRACE_MS) throw new Error("too_late");
  const q = room.questions[qIndex];
  if (!Number.isInteger(choice) || choice < 0 || choice >= q.options.uz.length) throw new Error("bad_choice");
  const ms = Math.max(0, Math.min(now - room.qStartAt, q.time * 1000));
  const ok = await kv.hsetnx(kAnswers(code, qIndex), pid, { choice, ms } satisfies AnswerRec);
  if (ok) await kv.expire(kAnswers(code, qIndex), TTL);
  return { accepted: ok, ms };
}

function publicRoom(room: Room): Omit<Room, "hostToken"> {
  const { hostToken: _ignored, ...rest } = room;
  void _ignored;
  return rest;
}

export async function hostView(code: string, token: string): Promise<HostView> {
  let room = await getRoom(code);
  if (!room) throw new Error("not_found");
  if (room.hostToken !== token) throw new Error("forbidden");

  const playersMap = await kv.hgetall<Player>(kPlayers(code));
  const players = Object.values(playersMap)
    .sort((a, b) => a.joinedAt - b.joinedAt)
    .map((p) => ({ id: p.id, name: p.name, avatar: p.avatar, score: p.score }));

  let answered = 0;
  if (room.phase === "question") {
    answered = await kv.hlen(kAnswers(code, room.qIndex));
    const now = Date.now();
    // Vaqt tugasa yoki hamma javob bersa — avtomatik natija
    if (now > room.qEndsAt + GRACE_MS || (players.length > 0 && answered >= players.length)) {
      room = await doReveal(room);
    }
  }
  return { now: Date.now(), room: publicRoom(room), players, answered };
}

export async function playerView(code: string, pid: string | null): Promise<PlayerView | null> {
  const room = await getRoom(code);
  if (!room) return null;
  const now = Date.now();
  const q = room.qIndex >= 0 ? room.questions[room.qIndex] : null;
  const hideCorrect = room.phase === "question";

  let me: PlayerView["me"] = null;
  let kicked = false;
  if (pid) {
    const p = await kv.hget<Player>(kPlayers(code), pid);
    if (!p) kicked = true;
    else {
      const answered =
        room.phase === "question" ? (await kv.hget<AnswerRec>(kAnswers(code, room.qIndex), pid)) != null : false;
      const { token: _t, ...rest } = p;
      void _t;
      me = { ...rest, answered, entry: room.board.find((b) => b.id === pid) ?? null };
    }
  }

  let lobby: PlayerView["lobby"] = null;
  let playerCount = room.board.length;
  if (room.phase === "lobby") {
    const players = Object.values(await kv.hgetall<Player>(kPlayers(code))).sort((a, b) => a.joinedAt - b.joinedAt);
    lobby = players.map((p) => ({ id: p.id, name: p.name, avatar: p.avatar }));
    playerCount = lobby.length;
  }

  return {
    now,
    phase: room.phase,
    title: room.title,
    qIndex: room.qIndex,
    total: room.questions.length,
    qStartAt: room.qStartAt,
    qEndsAt: room.qEndsAt,
    theme: room.theme,
    question: q
      ? {
          text: q.text,
          options: q.options,
          time: q.time,
          points: q.points,
          image: q.image,
          correct: hideCorrect ? undefined : q.correct,
        }
      : null,
    stats: hideCorrect ? null : room.stats,
    fastest: hideCorrect ? null : room.fastest,
    me,
    top: room.board.slice(0, room.phase === "finished" ? 10 : 5),
    ahead: (() => {
      if (!pid) return null;
      const i = room.board.findIndex((b) => b.id === pid);
      if (i <= 0) return null;
      const a = room.board.slice(0, i).reverse().find((b) => b.score > room.board[i].score);
      return a ? { name: a.name, score: a.score } : null;
    })(),
    lobby,
    playerCount,
    kicked: kicked || undefined,
  };
}
