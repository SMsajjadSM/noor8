import { NextResponse } from "next/server";
import { fail, readJson, route } from "@/lib/api/route";
import { checkCredentials, createSessionToken, SESSION_COOKIE, sessionCookieOptions, verifySessionToken } from "@/lib/auth/session";
import { lockRemainingMs, recordFailure, recordSuccess } from "@/lib/auth/throttle";
import { loginSchema } from "@/lib/validation/schemas";

export const POST = route(
  async (req) => {
    const { username, password } = loginSchema.parse(await readJson(req));
    const key = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const wait = lockRemainingMs(key);
    if (wait) return fail(429, "LOCKED", `تلاش‌های ناموفق زیاد بود. ${Math.ceil(wait / 60000)} دقیقه بعد دوباره تلاش کنید`);
    if (!checkCredentials(username, password)) {
      await recordFailure(key);
      return fail(401, "BAD_CREDENTIALS", "نام کاربری یا رمز عبور اشتباه است");
    }
    recordSuccess(key);
    const token = createSessionToken(username);
    const res = NextResponse.json({ ok: true, data: { csrf: verifySessionToken(token)?.csrf } }, { headers: { "Cache-Control": "no-store" } });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return res;
  },
  { auth: false },
);
