import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { ConfigError } from "@/lib/errors";

export const SESSION_COOKIE = "noor8_session";
const MAX_AGE = 60 * 60 * 8;

export type Session = { u: string; exp: number; csrf: string };

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new ConfigError("SESSION_SECRET باید حداقل ۳۲ نویسه باشد");
  return s;
}
const sign = (data: string) => createHmac("sha256", secret()).update(data).digest("base64url");

export function createSessionToken(username: string) {
  const p: Session = { u: username, exp: Math.floor(Date.now() / 1000) + MAX_AGE, csrf: randomBytes(24).toString("base64url") };
  const body = Buffer.from(JSON.stringify(p)).toString("base64url");
  return `${body}.${sign(body)}`;
}

/** Returns the session or null. Never throws on a bad/missing token. */
export function verifySessionToken(token?: string): Session | null {
  try {
    if (!token) return null;
    const [body, sig] = token.split(".");
    if (!body || !sig) return null;
    const a = Buffer.from(sig);
    const b = Buffer.from(sign(body));
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const p = JSON.parse(Buffer.from(body, "base64url").toString()) as Session;
    return typeof p.exp === "number" && p.exp > Date.now() / 1000 ? p : null;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: MAX_AGE,
};

export function checkCredentials(username: string, password: string) {
  const eu = process.env.ADMIN_USERNAME;
  const ep = process.env.ADMIN_PASSWORD;
  if (!eu || !ep) throw new ConfigError("ADMIN_USERNAME و ADMIN_PASSWORD تنظیم نشده‌اند");
  const h = (s: string) => createHash("sha256").update(s).digest();
  const okU = timingSafeEqual(h(username), h(eu));
  const okP = timingSafeEqual(h(password), h(ep));
  return okU && okP;
}
