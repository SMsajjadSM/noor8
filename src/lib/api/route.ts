import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { ApiError } from "@/lib/errors";
import { SESSION_COOKIE, verifySessionToken, type Session } from "@/lib/auth/session";

const noStore = { "Cache-Control": "no-store" };
export const ok = <T>(data: T, status = 200) => NextResponse.json({ ok: true, data }, { status, headers: noStore });
export const fail = (status: number, code: string, message: string, details?: unknown) =>
  NextResponse.json({ ok: false, error: { code, message, details } }, { status, headers: noStore });

function requireAdmin(req: NextRequest): Session {
  const session = verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) throw new ApiError(401, "UNAUTHORIZED", "ابتدا وارد شوید");
  if (!["GET", "HEAD"].includes(req.method)) {
    const origin = req.headers.get("origin");
    if (origin && new URL(origin).host !== req.headers.get("host")) throw new ApiError(403, "CSRF", "درخواست از مبدأ نامعتبر");
    if (req.headers.get("x-csrf-token") !== session.csrf) throw new ApiError(403, "CSRF", "توکن امنیتی نامعتبر است");
  }
  return session;
}

type Ctx = { params: Promise<Record<string, string>> };

/** Wraps a handler with auth (default), CSRF checks, and uniform error responses. */
export function route<C extends Ctx = Ctx>(
  fn: (req: NextRequest, ctx: C, session: Session | null) => Promise<Response>,
  opts: { auth?: boolean } = {},
) {
  return async (req: NextRequest, ctx: C): Promise<Response> => {
    try {
      const session = opts.auth === false ? null : requireAdmin(req);
      return await fn(req, ctx, session);
    } catch (e) {
      if (e instanceof ZodError) {
        return fail(400, "VALIDATION", "داده‌های ورودی معتبر نیست", e.issues.map((i) => ({ path: i.path.join("."), message: i.message })));
      }
      if (e instanceof ApiError) return fail(e.status, e.code, e.message, e.details);
      console.error("[api]", e);
      return fail(500, "INTERNAL", "خطای داخلی سرور");
    }
  };
}

export async function readJson(req: NextRequest): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new ApiError(400, "BAD_JSON", "بدنه درخواست JSON معتبر نیست");
  }
}
