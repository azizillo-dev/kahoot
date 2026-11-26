import { body, fail, ok, requireAdmin } from "@/lib/http";
import { translateMany } from "@/lib/translate";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const deny = await requireAdmin();
  if (deny) return deny;
  const b = await body<{ texts?: string[]; from?: string; to?: string }>(req);
  const from = b?.from === "ru" ? "ru" : "uz";
  const to = from === "ru" ? "uz" : "ru";
  if (!Array.isArray(b?.texts) || b.texts.length > 20) return fail("texts_required");
  const out = await translateMany(b.texts.map((t) => String(t ?? "").slice(0, 500)), from, to);
  return ok({ texts: out });
}
