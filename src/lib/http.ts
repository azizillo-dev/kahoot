import "server-only";
import { NextResponse } from "next/server";
import { isAdmin } from "./auth";

export const ok = (data: unknown, init?: number) =>
  NextResponse.json(data, { status: init ?? 200, headers: { "Cache-Control": "no-store" } });

export const fail = (error: string, status = 400) =>
  NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });

export async function requireAdmin() {
  return (await isAdmin()) ? null : fail("unauthorized", 401);
}

export async function body<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}
