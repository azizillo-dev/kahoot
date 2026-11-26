import { deleteQuestion, listQuestions, saveQuestion } from "@/lib/content";
import { body, fail, ok, requireAdmin } from "@/lib/http";
import { fillL10n, fillList, parseQuestion } from "@/lib/validate";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; qid: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const deny = await requireAdmin();
  if (deny) return deny;
  const { id, qid } = await params;
  const old = (await listQuestions(id)).find((q) => q.id === qid);
  if (!old) return fail("not_found", 404);
  const parsed = parseQuestion(await body(req));
  if (typeof parsed === "string") return fail(parsed);
  const q = {
    ...old,
    ...parsed,
    image: parsed.image,
    text: await fillL10n(parsed.text),
    options: await fillList(parsed.options),
  };
  await saveQuestion(q);
  return ok({ question: q });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const deny = await requireAdmin();
  if (deny) return deny;
  const { id, qid } = await params;
  await deleteQuestion(id, qid);
  return ok({ ok: true });
}
