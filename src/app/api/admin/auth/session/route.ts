import { ok, route } from "@/lib/api/route";

export const GET = route(async (_req, _ctx, session) => ok({ username: session?.u, csrf: session?.csrf }));
