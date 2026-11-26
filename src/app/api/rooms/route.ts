import { createRoom } from "@/lib/game";
import { body, fail, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const b = await body<{
    sectionIds?: string[];
    shuffleQuestions?: boolean;
    shuffleAnswers?: boolean;
    limit?: number;
    theme?: string;
  }>(req);
  if (!Array.isArray(b?.sectionIds) || !b.sectionIds.length) return fail("sections_required");
  try {
    const room = await createRoom({
      sectionIds: b.sectionIds.slice(0, 20).map(String),
      shuffleQuestions: !!b.shuffleQuestions,
      shuffleAnswers: !!b.shuffleAnswers,
      limit: Number(b.limit) || 0,
      theme: b.theme === "space" ? "space" : b.theme === "classic" ? "classic" : undefined,
    });
    return ok({ code: room.code, hostToken: room.hostToken });
  } catch (e) {
    return fail((e as Error).message);
  }
}
