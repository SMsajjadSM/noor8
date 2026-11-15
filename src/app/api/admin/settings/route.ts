import { ok, readJson, route } from "@/lib/api/route";
import { getSettings, saveSettings } from "@/features/content/settings";

export const GET = route(async () => ok(await getSettings()));
export const PUT = route(async (req) => ok(await saveSettings(await readJson(req))));
