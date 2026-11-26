import { deleteSection, getSection, saveSection } from "@/lib/content";
import { body, fail, ok, requireAdmin } from "@/lib/http";
import { cleanL10n, fillL10n } from "@/lib/validate";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const deny = await requireAdmin();
  if (deny) return deny;
  const { id } = await params;
  const s = await getSection(id);
  if (!s) return fail("not_found", 404);
  const b = await body<Record<string, unknown>>(req);
  const title = cleanL10n(b?.title, 120);
  if (!title.uz && !title.ru) return fail("title_required");
  const next = {
    ...s,
    title: await fillL10n(title),
    description: await fillL10n(cleanL10n(b?.description, 300)),
    icon: typeof b?.icon === "string" && /^[a-z_0-9]{1,40}$/.test(b.icon) ? b.icon : s.icon,
    color: b?.color != null ? Math.abs(Number(b.color) || 0) % 6 : s.color,
    order: b?.order != null ? Number(b.order) || 0 : s.order,
  };
  await saveSection(next);
  return ok({ section: next });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const deny = await requireAdmin();
  if (deny) return deny;
  const { id } = await params;
  await deleteSection(id);
  return ok({ ok: true });
}
