import { getSettings, saveSettings } from "@/lib/content";
import { body, ok, requireAdmin } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  return ok({ settings: await getSettings() });
}

export async function PUT(req: Request) {
  const deny = await requireAdmin();
  if (deny) return deny;
  const b = await body<{ answerTheme?: string }>(req);
  const s = { answerTheme: b?.answerTheme === "space" ? ("space" as const) : ("classic" as const) };
  await saveSettings(s);
  return ok({ settings: s });
}
