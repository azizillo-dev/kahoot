import { submitAnswer } from "@/lib/game";
import { body, fail, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const b = await body<{ pid?: string; token?: string; qIndex?: number; choice?: number }>(req);
  if (!b?.pid || !b.token) return fail("forbidden", 403);
  try {
    const r = await submitAnswer(code, b.pid, b.token, Number(b.qIndex), Number(b.choice));
    return ok(r);
  } catch (e) {
    return fail((e as Error).message);
  }
}
