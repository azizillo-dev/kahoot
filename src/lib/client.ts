"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export class ApiError extends Error {
  constructor(
    public code: string,
    public status: number,
  ) {
    super(code);
  }
}

export async function api<T>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {};
  const r = await fetch(url, {
    cache: "no-store",
    ...rest,
    headers: { ...(json !== undefined ? { "Content-Type": "application/json" } : {}), ...(rest.headers ?? {}) },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new ApiError((data as { error?: string }).error ?? "error", r.status);
  return data as T;
}

/** Serverni muntazam so'rab turish (Vercel'da WebSocket o'rniga). */
export function usePoll<T>(fetcher: () => Promise<T>, ms: number, enabled = true) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const f = useRef(fetcher);
  f.current = fetcher;
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const run = async () => {
      try {
        const d = await f.current();
        if (alive) {
          setData(d);
          setError(null);
        }
      } catch (e) {
        if (alive) setError(e instanceof ApiError ? e : new ApiError("network", 0));
      } finally {
        if (alive) timer = setTimeout(run, document.hidden ? ms * 3 : ms);
      }
    };
    run();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [ms, enabled, tick]);

  const refresh = useCallback(() => setTick((x) => x + 1), []);
  return { data, error, setData, refresh };
}

/** Server soati bilan sinxronlashgan "hozir". */
export function useServerClock(serverNow: number | undefined, intervalMs = 100) {
  const offset = useRef(0);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (serverNow) offset.current = serverNow - Date.now();
  }, [serverNow]);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now() + offset.current), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export function store<T>(key: string): { get: () => T | null; set: (v: T) => void; del: () => void } {
  return {
    get: () => {
      try {
        const s = localStorage.getItem(key);
        return s ? (JSON.parse(s) as T) : null;
      } catch {
        return null;
      }
    },
    set: (v) => {
      try {
        localStorage.setItem(key, JSON.stringify(v));
      } catch {}
    },
    del: () => {
      try {
        localStorage.removeItem(key);
      } catch {}
    },
  };
}
