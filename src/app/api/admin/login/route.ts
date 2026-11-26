import { cookies } from "next/headers";
import { ADMIN_COOKIE, adminToken, checkPassword, isAdmin, usingDefaultPassword } from "@/lib/auth";
import { body, fail, ok } from "@/lib/http";
import { storageMode } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return ok({ admin: await isAdmin(), storageMode, defaultPassword: usingDefaultPassword });
}

export async function POST(req: Request) {
  const b = await body<{ password?: string }>(req);
  if (!b?.password || !checkPassword(b.password)) return fail("wrong_password", 401);
  (await cookies()).set(ADMIN_COOKIE, adminToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return ok({ admin: true });
}

export async function DELETE() {
  (await cookies()).delete(ADMIN_COOKIE);
  return ok({ admin: false });
}
