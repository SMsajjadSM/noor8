import { ok, readJson, route } from "@/lib/api/route";
import { getCategories, saveCategories } from "@/features/content/categories";

export const GET = route(async () => ok(await getCategories()));
export const PUT = route(async (req) => ok(await saveCategories(await readJson(req))));
