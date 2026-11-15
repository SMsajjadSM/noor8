"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { inputCls } from "@/components/admin/ui";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: f.get("username"), password: f.get("password") }),
      });
      const json = (await res.json()) as { ok: boolean; error?: { message: string } };
      if (!json.ok) throw new Error(json.error?.message ?? "ورود ناموفق بود");
      router.replace("/admin/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ارتباط با سرور برقرار نشد");
      setBusy(false);
    }
  }

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-4">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(ellipse_at_top,var(--accent-soft),transparent_70%)]" />
      <div className="absolute left-4 top-4"><ThemeToggle /></div>
      <form onSubmit={submit} className="relative w-full max-w-sm space-y-5 rounded-3xl border border-line bg-surface p-8 shadow-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.webp" alt="نور هشتم" width={84} height={90} className="mx-auto" />
        <div className="text-center">
          <h1 className="text-xl font-bold">ورود به پنل مدیریت</h1>
          <p className="mt-1 text-sm text-muted">نام کاربری و رمز عبور را وارد کنید</p>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="u" className="text-sm font-medium">نام کاربری</label>
          <input id="u" name="username" autoComplete="username" required dir="ltr" className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="p" className="text-sm font-medium">رمز عبور</label>
          <input id="p" name="password" type="password" autoComplete="current-password" required dir="ltr" className={inputCls} />
        </div>
        {error && <p role="alert" className="rounded-lg bg-danger/10 p-3 text-sm text-danger">{error}</p>}
        <button disabled={busy} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent font-medium text-on-accent transition hover:brightness-110 disabled:opacity-60">
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
          ورود
        </button>
      </form>
    </main>
  );
}
