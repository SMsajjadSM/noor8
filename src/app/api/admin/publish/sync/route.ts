import { ok, route } from "@/lib/api/route";
import { syncDraft } from "@/features/content/publish";

export const POST = route(async () => ok(await syncDraft()));
