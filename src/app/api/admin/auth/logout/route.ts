import { NextResponse } from "next/server";
import { route } from "@/lib/api/route";
import { SESSION_COOKIE } from "@/lib/auth/session";

export const POST = route(
  async () => {
    const res = NextResponse.json({ ok: true, data: { loggedOut: true } }, { headers: { "Cache-Control": "no-store" } });
    res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
    return res;
  },
  { auth: false },
);
