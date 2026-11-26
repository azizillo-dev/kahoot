import { randomId } from "@/lib/auth";
import { listSections, saveSection } from "@/lib/content";
import { body, fail, ok, requireAdmin } from "@/lib/http";
import { cleanL10n, fillL10n } from "@/lib/validate";
import type { Section } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const deny = await requireAdmin();
  if (deny) return deny;
  const b = await body<Record<string, unknown>>(req);
  const title = cleanL10n(b?.title, 120);
  if (!title.uz && !title.ru) return fail("title_required");
  const all = await listSections();
  const s: Section = {
    id: randomId(8),
    title: await fillL10n(title),
    description: await fillL10n(cleanL10n(b?.description, 300)),
    icon: typeof b?.icon === "string" && /^[a-z_0-9]{1,40}$/.test(b.icon) ? b.icon : "menu_book",
    color: Math.abs(Number(b?.color) || 0) % 6,
    order: all.length,
    createdAt: Date.now(),
  };
  await saveSection(s);
  return ok({ section: s });
}
