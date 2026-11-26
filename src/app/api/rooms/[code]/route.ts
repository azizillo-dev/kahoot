import { playerView } from "@/lib/game";
import { fail, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const pid = new URL(req.url).searchParams.get("pid");
  const view = await playerView(code, pid);
  if (!view) return fail("not_found", 404);
  return ok(view);
}
