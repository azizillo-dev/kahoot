import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";

const PASS = process.env.ADMIN_PASSWORD || "admin123";
const SECRET = (process.env.AUTH_SECRET || "bilimdon-secret") + ":" + PASS;

export const ADMIN_COOKIE = "bilimdon_admin";
export const usingDefaultPassword = !process.env.ADMIN_PASSWORD;

export function adminToken() {
  return crypto.createHmac("sha256", SECRET).update("admin-v1").digest("hex");
}

export function checkPassword(p: string) {
  const a = crypto.createHash("sha256").update(p).digest();
  const b = crypto.createHash("sha256").update(PASS).digest();
  return crypto.timingSafeEqual(a, b);
}

export async function isAdmin() {
  const c = (await cookies()).get(ADMIN_COOKIE)?.value;
  return !!c && c === adminToken();
}

export function randomId(len = 10) {
  return crypto.randomBytes(16).toString("base64url").slice(0, len);
}
