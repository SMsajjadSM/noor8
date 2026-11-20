"use client";
import { useEffect, useMemo, useState } from "react";
import { GitMerge, Rocket } from "lucide-react";
import { api, ApiFail } from "@/lib/admin/api";
import { useLoad } from "@/lib/admin/use-load";
import type { Article, Product } from "@/lib/validation/schemas";
import { PageHead } from "@/components/admin/page-head";
import { Badge, Button, ConfirmDialog, EmptyState, ErrorState, Skeleton, useToast } from "@/components/admin/ui";

type Diff = { path: string; status: "added" | "modified" | "deleted" };
type Status = { diff: Diff[]; mainHead: string; recent: { sha: string; message: string }[]; deploy: { state: string; url?: string } };
type Rows<T> = { items: { item: T }[] };
const ST = { added: ["جدید", "ok"], modified: ["ویرایش‌شده", "accent"], deleted: ["حذف‌شده", "danger"] } as const;
const DEPLOY: Record<string, [string, "ok" | "muted" | "danger" | "accent"]> = {
  success: ["Deploy موفق", "ok"], pending: ["در صف Deploy", "accent"], queued: ["در صف Deploy", "accent"], in_progress: ["در حال ساخت", "accent"],
  failure: ["Deploy ناموفق", "danger"], error: ["خطا در Deploy", "danger"], inactive: ["غیرفعال", "muted"], unknown: ["وضعیت Deploy هنوز مشخص نیست", "muted"],
};

export default function PublishPage() {
  const toast = useToast();
  const status = useLoad(() => api<Status>("GET", "/api/admin/publish"));
  const products = useLoad(() => api<Rows<Product>>("GET", "/api/admin/products"));
  const articles = useLoad(() => api<Rows<Article>>("GET", "/api/admin/articles"));
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<"selected" | "all" | null>(null);
  const [busy, setBusy] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [watch, setWatch] = useState<string | null>(null);
  const [deploy, setDeploy] = useState<{ state: string; url?: string } | null>(null);

  const names = useMemo(() => {
    const m = new Map<string, string>();
    products.data?.items.forEach(({ item }) => m.set(`data/products/${item.id}.json`, `محصول: ${item.name}`));
    articles.data?.items.forEach(({ item }) => m.set(`data/articles/${item.id}.json`, `مقاله: ${item.title}`));
    m.set("data/settings.json", "تنظیمات سایت");
    m.set("data/categories.json", "دسته‌بندی‌ها");
    return m;
  }, [products.data, articles.data]);
  const label = (p: string) => names.get(p) ?? (p.startsWith("public/photo/") ? `تصویر: ${p.split("/").pop()}` : p);

  // After publishing, poll the deployment state so failures are visible.
  useEffect(() => {
    if (!watch) return;
    let n = 0;
    const t = setInterval(async () => {
      n++;
      try {
        const s = await api<Status>("GET", "/api/admin/publish");
        setDeploy(s.deploy);
        if (["success", "failure", "error"].includes(s.deploy.state) || n > 40) clearInterval(t);
      } catch { clearInterval(t); }
    }, 8000);
    return () => clearInterval(t);
  }, [watch]);

  if (status.error) {
    const local = status.error.includes("GitHub");
    return <><PageHead title="انتشار" /><ErrorState message={local ? status.error : `${status.error}`} onRetry={status.reload} /></>;
  }
  const diff = status.data?.diff ?? [];
  const toggle = (p: string) => setSel((s) => { const n = new Set(s); n.has(p) ? n.delete(p) : n.add(p); return n; });

  async function run(mode: "selected" | "all") {
    setBusy(true);
    try {
      const r = await api<{ commitSha: string; published: string[] }>("POST", "/api/admin/publish", { paths: mode === "all" ? "all" : [...sel] });
      toast.ok(`${r.published.length.toLocaleString("fa-IR")} مورد منتشر شد. Vercel در حال ساخت سایت است`);
      setSel(new Set());
      setConfirm(null);
      setWatch(r.commitSha);
      setDeploy({ state: "pending" });
      status.reload();
    } catch (e) {
      toast.error((e as Error).message + (e instanceof ApiFail && Array.isArray(e.details) ? `: ${e.details.join("، ")}` : ""));
      setConfirm(null);
    } finally {
      setBusy(false);
    }
  }

  async function sync() {
    setSyncing(true);
    try {
      const r = await api<{ merged: boolean }>("POST", "/api/admin/publish/sync");
      toast.ok(r.merged ? "تغییرات main به پیش‌نویس‌ها اضافه شد" : "پیش‌نویس‌ها از قبل هماهنگ بودند");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSyncing(false);
    }
  }

  const d = deploy ?? status.data?.deploy;
  const dl = DEPLOY[d?.state ?? "unknown"] ?? DEPLOY.unknown!;

  return (
    <>
      <PageHead title="انتشار" hint="فقط مواردی که انتخاب کنید به سایت اصلی منتقل می‌شوند و سایت دوباره ساخته می‌شود."
        actions={<Button variant="secondary" loading={syncing} onClick={sync}><GitMerge className="size-4" aria-hidden />هماهنگ‌سازی با main</Button>} />

      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface p-4 text-sm">
        <span className="text-muted">آخرین وضعیت:</span><Badge tone={dl[1]}>{dl[0]}</Badge>
        {d?.url && <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-accent underline" dir="ltr">{d.url}</a>}
        {(d?.state === "failure" || d?.state === "error") && <span className="text-danger">ساخت سایت ناموفق بود؛ لاگ را در Vercel بررسی کنید.</span>}
      </div>

      {status.loading ? <Skeleton className="h-64" /> : !diff.length ? (
        <EmptyState title="همه چیز منتشر شده است" hint="تغییر جدیدی در پیش‌نویس‌ها وجود ندارد." />
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={sel.size === diff.length} onChange={(e) => setSel(e.target.checked ? new Set(diff.map((x) => x.path)) : new Set())} className="size-4 accent-[var(--accent)]" />انتخاب همه</label>
            <span className="flex-1" />
            <Button variant="secondary" disabled={!sel.size} onClick={() => setConfirm("selected")}><Rocket className="size-4" aria-hidden />انتشار انتخاب‌شده‌ها ({sel.size.toLocaleString("fa-IR")})</Button>
            <Button onClick={() => setConfirm("all")}><Rocket className="size-4" aria-hidden />انتشار همه ({diff.length.toLocaleString("fa-IR")})</Button>
          </div>
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {diff.map((x) => (
              <li key={x.path}>
                <label className="flex cursor-pointer items-center gap-3 p-4 hover:bg-surface-2">
                  <input type="checkbox" checked={sel.has(x.path)} onChange={() => toggle(x.path)} className="size-4 accent-[var(--accent)]" />
                  <span className="flex-1 truncate">{label(x.path)}</span>
                  <Badge tone={ST[x.status][1]}>{ST[x.status][0]}</Badge>
                </label>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">تصاویر استفاده‌شده در موارد انتخابی به‌طور خودکار همراه آن‌ها منتشر می‌شوند.</p>
        </>
      )}

      <ConfirmDialog open={!!confirm} busy={busy} title="انتشار در سایت اصلی"
        message={confirm === "all" ? `همه ${diff.length.toLocaleString("fa-IR")} تغییر منتشر می‌شود و سایت دوباره ساخته خواهد شد.` : `${sel.size.toLocaleString("fa-IR")} مورد انتخابی منتشر می‌شود و سایت دوباره ساخته خواهد شد.`}
        confirmLabel="انتشار" onConfirm={() => confirm && run(confirm)} onCancel={() => setConfirm(null)} />
    </>
  );
}
