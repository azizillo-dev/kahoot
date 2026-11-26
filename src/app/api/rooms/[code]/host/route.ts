import { hostAction, hostView, type HostAction } from "@/lib/game";
import { body, fail, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ code: string }> };

const ACTIONS: HostAction[] = ["start", "reveal", "board", "next", "finish", "kick"];

export async function GET(req: Request, { params }: Ctx) {
  const { code } = await params;
  const token = req.headers.get("x-host-token") ?? "";
  try {
    return ok(await hostView(code, token));
  } catch (e) {
    const m = (e as Error).message;
    return fail(m, m === "not_found" ? 404 : 403);
  }
}

export async function POST(req: Request, { params }: Ctx) {
  const { code } = await params;
  const token = req.headers.get("x-host-token") ?? "";
  const b = await body<{ action?: HostAction; arg?: string }>(req);
  if (!b?.action || !ACTIONS.includes(b.action)) return fail("bad_action");
  try {
    await hostAction(code, token, b.action, b.arg);
    return ok(await hostView(code, token));
  } catch (e) {
    const m = (e as Error).message;
    return fail(m, m === "not_found" ? 404 : 403);
  }
}
