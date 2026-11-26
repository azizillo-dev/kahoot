import { getSection, getSettings, listQuestions } from "@/lib/content";
import { fail, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

// Mashq rejimi uchun (to'g'ri javoblar bilan)
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const section = await getSection(id);
  if (!section) return fail("not_found", 404);
  const [questions, settings] = await Promise.all([listQuestions(id), getSettings()]);
  return ok({ section, questions, settings });
}
