import Link from "next/link";
import type { Metadata } from "next";
import { SiteShell } from "@/components/layout/site-shell";

export const metadata: Metadata = { title: "صفحه پیدا نشد", robots: { index: false } };

export default function NotFound() {
  return (
    <SiteShell>
      <section className="mx-auto grid max-w-xl place-items-center gap-5 px-4 py-28 text-center">
        <p className="text-7xl font-bold text-accent">۴۰۴</p>
        <h1 className="text-2xl font-bold">صفحه‌ای که دنبالش بودید پیدا نشد</h1>
        <p className="text-muted">ممکن است آدرس تغییر کرده یا صفحه حذف شده باشد. از لینک‌های زیر ادامه دهید.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/" className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-on-accent">صفحه اصلی</Link>
          <Link href="/products" className="rounded-full border border-line px-6 py-3 text-sm">محصولات</Link>
          <Link href="/articles" className="rounded-full border border-line px-6 py-3 text-sm">مقالات</Link>
        </div>
      </section>
    </SiteShell>
  );
}
