import { joinRoom } from "@/lib/game";
import { body, fail, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const b = await body<{ name?: string; avatar?: string }>(req);
  const name = String(b?.name ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 20);
  const avatar = String(b?.avatar ?? "").slice(0, 80);
  if (name.length < 2) return fail("name_short");
  if (!/^[a-z0-9-]+:[\w-]+$/i.test(avatar)) return fail("bad_avatar");
  try {
    const p = await joinRoom(code, name, avatar);
    return ok({ pid: p.id, token: p.token });
  } catch (e) {
    const m = (e as Error).message;
    return fail(m, m === "not_found" ? 404 : 400);
  }
}
