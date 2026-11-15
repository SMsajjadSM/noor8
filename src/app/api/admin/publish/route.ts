import { ok, readJson, route } from "@/lib/api/route";
import { publish, publishStatus } from "@/features/content/publish";
import { publishSchema } from "@/lib/validation/schemas";

export const GET = route(async () => ok(await publishStatus()));
export const POST = route(async (req) => ok(await publish(publishSchema.parse(await readJson(req)).paths)));
