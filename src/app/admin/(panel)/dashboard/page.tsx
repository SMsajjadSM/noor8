"use client";
import Link from "next/link";
import { FileText, Package, Rocket } from "lucide-react";
import { api } from "@/lib/admin/api";
import { useLoad } from "@/lib/admin/use-load";
import { faNum } from "@/lib/utils/format";
import type { Article, Product } from "@/lib/validation/schemas";
import { PageHead } from "@/components/admin/page-head";
import { Badge, ErrorState, Skeleton } from "@/components/admin/ui";

type Rows<T> = { items: { item: T }[] };
type PublishInfo = { diff: unknown[]; recent: { sha: string; message: string; date: string }[]; deploy: { state: string; url?: string } };
const DEPLOY: Record<string, [string, "ok" | "muted" | "danger" | "accent"]> = {
  success: ["موفق", "ok"], pending: ["در صف", "accent"], queued: ["در صف", "accent"], in_progress: ["در حال ساخت", "accent"],
  failure: ["ناموفق", "danger"], error: ["خطا", "danger"], unknown: ["نامشخص", "muted"],
};

export default function Dashboard() {
  const products = useLoad(() => api<Rows<Product>>("GET", "/api/admin/products"));
  const articles = useLoad(() => api<Rows<Article>>("GET", "/api/admin/articles"));
  const pub = useLoad(() => api<PublishInfo>("GET", "/api/admin/publish").catch((e: Error & { code?: string }) => (e.code === "LOCAL_MODE" ? null : Promise.reject(e))));

  const stat = (rows?: { item: { published: boolean } }[]) => ({ all: rows?.length ?? 0, live: rows?.filter((r) => r.item.published).length ?? 0 });
  const p = stat(products.data?.items);
  const a = stat(articles.data?.items);
  const err = products.error ?? articles.error;

  return (
    <>
      <PageHead title="داشبورد" hint="خلاصه‌ای از وضعیت محتوا و انتشار" />
      {err && <ErrorState message={err} onRetry={() => { products.reload(); articles.reload(); }} />}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Card href="/admin/products" icon={Package} title="محصولات" loading={products.loading} value={p.all} sub={`${faNum(p.live)} آماده انتشار · ${faNum(p.all - p.live)} پیش‌نویس`} />
        <Card href="/admin/articles" icon={FileText} title="مقالات" loading={articles.loading} value={a.all} sub={`${faNum(a.live)} آماده انتشار · ${faNum(a.all - a.live)} پیش‌نویس`} />
        <Card href="/admin/publish" icon={Rocket} title="در انتظار انتشار" loading={pub.loading} value={pub.data?.diff.length ?? 0} sub={pub.data === null ? "حالت محلی؛ انتشار غیرفعال" : "تغییر منتشرنشده"} />
      </div>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="min-w-0 rounded-2xl border border-line bg-surface p-5">
          <h2 className="mb-3 font-bold">آخرین Deploy</h2>
          {pub.loading ? <Skeleton className="h-8 w-40" /> : pub.error ? <p className="text-sm text-danger">{pub.error}</p> : pub.data ? (
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <Badge tone={(DEPLOY[pub.data.deploy.state] ?? DEPLOY.unknown)![1]}>{(DEPLOY[pub.data.deploy.state] ?? DEPLOY.unknown)![0]}</Badge>
              {pub.data.deploy.url && <a href={pub.data.deploy.url} target="_blank" rel="noopener noreferrer" className="break-all text-accent underline" dir="ltr">{pub.data.deploy.url}</a>}
            </div>
          ) : <p className="text-sm text-muted">اطلاعات Deploy فقط با اتصال GitHub در دسترس است.</p>}
        </div>
        <div className="min-w-0 rounded-2xl border border-line bg-surface p-5">
          <h2 className="mb-3 font-bold">آخرین تغییرات</h2>
          {pub.loading ? <Skeleton className="h-24" /> : pub.data?.recent.length ? (
            <ul className="space-y-2 text-sm">
              {pub.data.recent.slice(0, 6).map((c) => (
                <li key={c.sha} className="flex min-w-0 gap-3"><code className="shrink-0 text-xs leading-6 text-muted" dir="ltr">{c.sha}</code><span className="min-w-0 break-words [overflow-wrap:anywhere]">{c.message}</span></li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted">هنوز تغییری ثبت نشده است.</p>}
        </div>
      </section>
    </>
  );
}

function Card({ href, icon: Icon, title, value, sub, loading }: { href: string; icon: typeof Package; title: string; value: number; sub: string; loading: boolean }) {
  return (
    <Link href={href} className="rounded-2xl border border-line bg-surface p-5 transition hover:border-accent">
      <div className="flex items-center justify-between text-muted"><span className="text-sm">{title}</span><Icon className="size-5" aria-hidden /></div>
      {loading ? <Skeleton className="mt-3 h-9 w-16" /> : <p className="mt-2 text-3xl font-bold">{faNum(value)}</p>}
      <p className="mt-1 text-xs text-muted">{sub}</p>
    </Link>
  );
}
