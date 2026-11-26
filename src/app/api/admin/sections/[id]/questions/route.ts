import { randomId } from "@/lib/auth";
import { getSection, listQuestions, reorderQuestions, saveQuestion } from "@/lib/content";
import { body, fail, ok, requireAdmin } from "@/lib/http";
import { fillL10n, fillList, parseQuestion } from "@/lib/validate";
import type { Question } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const deny = await requireAdmin();
  if (deny) return deny;
  const { id } = await params;
  if (!(await getSection(id))) return fail("not_found", 404);
  const parsed = parseQuestion(await body(req));
  if (typeof parsed === "string") return fail(parsed);
  const existing = await listQuestions(id);
  const q: Question = {
    id: randomId(),
    sectionId: id,
    ...parsed,
    text: await fillL10n(parsed.text),
    options: await fillList(parsed.options),
    order: existing.length,
    createdAt: Date.now(),
  };
  await saveQuestion(q);
  return ok({ question: q });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const deny = await requireAdmin();
  if (deny) return deny;
  const { id } = await params;
  const b = await body<{ ids?: string[] }>(req);
  if (!Array.isArray(b?.ids)) return fail("ids_required");
  await reorderQuestions(id, b.ids.map(String));
  return ok({ ok: true });
}
