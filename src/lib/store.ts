import "server-only";
import { Redis } from "@upstash/redis";
import fs from "node:fs";
import path from "node:path";

/**
 * Kalit-qiymat ombori. Vercel'da Upstash Redis (Vercel Marketplace orqali ulanadi),
 * lokal ishlab chiqishda esa xotira + .data/db.json fayli ishlatiladi.
 * Barcha qiymatlar JSON qatorlar sifatida saqlanadi.
 */
interface RawKV {
  get(k: string): Promise<string | null>;
  set(k: string, v: string, ttl?: number): Promise<void>;
  del(...k: string[]): Promise<void>;
  hget(k: string, f: string): Promise<string | null>;
  hgetall(k: string): Promise<Record<string, string>>;
  hset(k: string, o: Record<string, string>): Promise<void>;
  hsetnx(k: string, f: string, v: string): Promise<boolean>;
  hdel(k: string, ...f: string[]): Promise<void>;
  hlen(k: string): Promise<number>;
  expire(k: string, sec: number): Promise<void>;
  exists(k: string): Promise<boolean>;
}

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

export const storageMode: "redis" | "memory" = url && token ? "redis" : "memory";

function redisKV(): RawKV {
  const r = new Redis({ url: url!, token: token!, automaticDeserialization: false });
  return {
    async get(k) {
      return ((await r.get<string>(k)) as string | null) ?? null;
    },
    async set(k, v, ttl) {
      if (ttl) await r.set(k, v, { ex: ttl });
      else await r.set(k, v);
    },
    async del(...k) {
      if (k.length) await r.del(...k);
    },
    async hget(k, f) {
      return ((await r.hget<string>(k, f)) as string | null) ?? null;
    },
    async hgetall(k) {
      // automaticDeserialization:false bo'lganda Upstash [maydon, qiymat, ...] massiv qaytaradi
      const res = (await r.hgetall(k)) as unknown;
      if (!res) return {};
      if (Array.isArray(res)) {
        const o: Record<string, string> = {};
        for (let i = 0; i + 1 < res.length; i += 2) o[String(res[i])] = res[i + 1] as string;
        return o;
      }
      return res as Record<string, string>;
    },
    async hset(k, o) {
      if (Object.keys(o).length) await r.hset(k, o);
    },
    async hsetnx(k, f, v) {
      return (await r.hsetnx(k, f, v)) === 1;
    },
    async hdel(k, ...f) {
      if (f.length) await r.hdel(k, ...f);
    },
    async hlen(k) {
      return await r.hlen(k);
    },
    async expire(k, sec) {
      await r.expire(k, sec);
    },
    async exists(k) {
      return (await r.exists(k)) > 0;
    },
  };
}

type Entry =
  | { t: "s"; v: string; exp?: number }
  | { t: "h"; v: Record<string, string>; exp?: number };

const g = globalThis as unknown as { __bilimdonKV?: Map<string, Entry>; __bilimdonSave?: NodeJS.Timeout };
const persist = !process.env.VERCEL;
const DB_FILE = path.join(process.cwd(), ".data", "db.json");

function memoryKV(): RawKV {
  if (!g.__bilimdonKV) {
    g.__bilimdonKV = new Map();
    if (persist) {
      try {
        const raw = JSON.parse(fs.readFileSync(DB_FILE, "utf8")) as Record<string, Entry>;
        for (const [k, e] of Object.entries(raw)) g.__bilimdonKV.set(k, e);
      } catch {
        /* fayl yo'q — yangi baza */
      }
    }
  }
  const m = g.__bilimdonKV;

  const save = () => {
    if (!persist) return;
    if (g.__bilimdonSave) clearTimeout(g.__bilimdonSave);
    g.__bilimdonSave = setTimeout(() => {
      try {
        fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
        fs.writeFileSync(DB_FILE, JSON.stringify(Object.fromEntries(m)));
      } catch {
        /* e'tiborsiz */
      }
    }, 400);
  };

  const live = (k: string): Entry | undefined => {
    const e = m.get(k);
    if (e?.exp && e.exp < Date.now()) {
      m.delete(k);
      return undefined;
    }
    return e;
  };
  const hash = (k: string): Record<string, string> => {
    const e = live(k);
    if (e?.t === "h") return e.v;
    const n: Entry = { t: "h", v: {} };
    m.set(k, n);
    return n.v;
  };

  return {
    async get(k) {
      const e = live(k);
      return e?.t === "s" ? e.v : null;
    },
    async set(k, v, ttl) {
      m.set(k, { t: "s", v, exp: ttl ? Date.now() + ttl * 1000 : undefined });
      save();
    },
    async del(...k) {
      k.forEach((x) => m.delete(x));
      save();
    },
    async hget(k, f) {
      const e = live(k);
      return e?.t === "h" ? e.v[f] ?? null : null;
    },
    async hgetall(k) {
      const e = live(k);
      return e?.t === "h" ? { ...e.v } : {};
    },
    async hset(k, o) {
      Object.assign(hash(k), o);
      save();
    },
    async hsetnx(k, f, v) {
      const h = hash(k);
      if (f in h) return false;
      h[f] = v;
      save();
      return true;
    },
    async hdel(k, ...f) {
      const e = live(k);
      if (e?.t === "h") f.forEach((x) => delete e.v[x]);
      save();
    },
    async hlen(k) {
      const e = live(k);
      return e?.t === "h" ? Object.keys(e.v).length : 0;
    },
    async expire(k, sec) {
      const e = live(k);
      if (e) e.exp = Date.now() + sec * 1000;
      save();
    },
    async exists(k) {
      return !!live(k);
    },
  };
}

const raw: RawKV = storageMode === "redis" ? redisKV() : memoryKV();

const parse = <T>(s: string | null): T | null => {
  if (s == null) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
};

/** JSON bilan ishlaydigan qulay qatlam. */
export const kv = {
  get: async <T>(k: string) => parse<T>(await raw.get(k)),
  set: (k: string, v: unknown, ttl?: number) => raw.set(k, JSON.stringify(v), ttl),
  del: (...k: string[]) => raw.del(...k),
  hget: async <T>(k: string, f: string) => parse<T>(await raw.hget(k, f)),
  hgetall: async <T>(k: string) => {
    const r = await raw.hgetall(k);
    const out: Record<string, T> = {};
    for (const [f, v] of Object.entries(r)) {
      const p = parse<T>(typeof v === "string" ? v : JSON.stringify(v));
      if (p != null) out[f] = p;
    }
    return out;
  },
  hset: (k: string, o: Record<string, unknown>) =>
    raw.hset(k, Object.fromEntries(Object.entries(o).map(([f, v]) => [f, JSON.stringify(v)]))),
  hsetnx: (k: string, f: string, v: unknown) => raw.hsetnx(k, f, JSON.stringify(v)),
  hdel: (k: string, ...f: string[]) => raw.hdel(k, ...f),
  hlen: (k: string) => raw.hlen(k),
  expire: (k: string, s: number) => raw.expire(k, s),
  exists: (k: string) => raw.exists(k),
};
