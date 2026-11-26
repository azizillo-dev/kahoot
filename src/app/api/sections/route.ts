import { listSections, getSettings } from "@/lib/content";
import { ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const [sections, settings] = await Promise.all([listSections(), getSettings()]);
  return ok({ sections, settings });
}
