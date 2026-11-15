"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Eye, EyeOff, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { adminImg, api } from "@/lib/admin/api";
import { useLoad } from "@/lib/admin/use-load";
import { formatPrice, jalali } from "@/lib/utils/format";
import type { Article, Product, Settings } from "@/lib/validation/schemas";
import { PageHead } from "./page-head";
import { Badge, Button, ConfirmDialog, EmptyState, ErrorState, inputCls, Skeleton, useToast } from "./ui";

type Kind = "products" | "articles";
type Item = Product | Article;
type Row = { item: Item; sha: string };
const PAGE = 10;
const LABEL = { products: { one: "محصول", many: "محصولات", add: "محصول جدید" }, articles: { one: "مقاله", many: "مقالات", add: "مقاله جدید" } };
const isProduct = (i: Item): i is Product => "name" in i;
const titleOf = (i: Item) => (isProduct(i) ? i.name : i.title);

export function ContentList({ kind }: { kind: Kind }) {
  const toast = useToast();
  const list = useLoad(() => api<{ items: Row[]; invalid: string[] }>("GET", `/api/admin/${kind}`));
  const settings = useLoad(() => api<Settings>("GET", "/api/admin/settings"));
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "published" | "draft">("all");
  const [sort, setSort] = useState<"updated" | "title" | "price">("updated");
  const [page, setPage] = useState(1);
  const [del, setDel] = useState<Item | null>(null);
  const [busy, setBusy] = useState(false);
  const L = LABEL[kind];

  const rows = useMemo(() => {
    const all = list.data?.items ?? [];
    const term = q.trim().toLowerCase();
    const out = all.filter(({ item }) => (status === "all" || item.published === (status === "published")) && (!term || titleOf(item).toLowerCase().includes(term) || item.slug.includes(term)));
    out.sort((a, b) =>
      sort === "title" ? titleOf(a.item).localeCompare(titleOf(b.item), "fa")
      : sort === "price" && isProduct(a.item) && isProduct(b.item) ? b.item.price - a.item.price
      : b.item.updatedAt.localeCompare(a.item.updatedAt));
    return out;
  }, [list.data, q, status, sort]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const cur = Math.min(page, pages);
  const shown = rows.slice((cur - 1) * PAGE, cur * PAGE);

  async function toggle({ item, sha }: Row) {
    const { id: _id, createdAt: _c, updatedAt: _u, ...input } = item;
    try {
      await api("PUT", `/api/admin/${kind}/${item.id}`, { ...input, published: !item.published, sha });
      toast.ok(item.published ? "به پیش‌نویس برگشت. برای اعمال در سایت، منتشر کنید" : "برای انتشار آماده شد. در بخش «انتشار» منتشر کنید");
      list.reload();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }
  async function remove() {
    if (!del) return;
    setBusy(true);
    try {
      await api("DELETE", `/api/admin/${kind}/${del.id}`);
      toast.ok(`${L.one} حذف شد`);
      setDel(null);
      list.reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHead title={L.many} hint="تغییرات به‌صورت پیش‌نویس ذخیره می‌شوند و تا زمانی که منتشر نکنید در سایت دیده نمی‌شوند."
        actions={<Link href={`/admin/${kind}/new`} className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-on-accent hover:brightness-110"><Plus className="size-4" aria-hidden />{L.add}</Link>} />

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input aria-label="جست‌وجو" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="جست‌وجو در عنوان یا آدرس…" className={`${inputCls} pr-9`} />
        </div>
        <select aria-label="فیلتر وضعیت" value={status} onChange={(e) => { setStatus(e.target.value as typeof status); setPage(1); }} className={inputCls}>
          <option value="all">همه وضعیت‌ها</option><option value="published">آماده انتشار</option><option value="draft">پیش‌نویس</option>
        </select>
        <select aria-label="مرتب‌سازی" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className={inputCls}>
          <option value="updated">جدیدترین ویرایش</option><option value="title">بر اساس عنوان</option>{kind === "products" && <option value="price">گران‌ترین</option>}
        </select>
      </div>

      {list.error ? <ErrorState message={list.error} onRetry={list.reload} />
      : list.loading ? <div className="space-y-3">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-20" />)}</div>
      : !list.data?.items.length ? <EmptyState title={`هنوز ${L.one}ی ثبت نشده`} hint={`با دکمه «${L.add}» اولین مورد را بسازید.`} />
      : !rows.length ? <EmptyState title="موردی با این فیلتر پیدا نشد" hint="جست‌وجو یا فیلتر را تغییر دهید." />
      : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {shown.map((row) => {
            const { item } = row;
            return (
              <li key={item.id} className="flex flex-wrap items-center gap-4 p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={adminImg(item.image)} alt="" loading="lazy" className="size-16 shrink-0 rounded-lg border border-line bg-white object-contain" />
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/${kind}/${item.id}`} className="block truncate font-medium hover:text-accent">{titleOf(item)}</Link>
                  <p className="mt-0.5 truncate text-xs text-muted" dir="ltr">/{item.slug}</p>
                  <p className="mt-1 text-xs text-muted">
                    {isProduct(item) ? formatPrice(item.price, settings.data?.currencyUnit ?? "تومان") + " · " : ""}آخرین ویرایش: {jalali(item.updatedAt)}
                  </p>
                </div>
                <Badge tone={item.published ? "ok" : "muted"}>{item.published ? "آماده انتشار" : "پیش‌نویس"}</Badge>
                <div className="flex gap-1">
                  <Link href={`/admin/${kind}/${item.id}`} aria-label={`ویرایش ${titleOf(item)}`} className="grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-text"><Pencil className="size-4" /></Link>
                  <button type="button" aria-label={item.published ? "برگرداندن به پیش‌نویس" : "علامت‌گذاری برای انتشار"} onClick={() => toggle(row)} className="grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-text">{item.published ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
                  <button type="button" aria-label={`حذف ${titleOf(item)}`} onClick={() => setDel(item)} className="grid size-9 place-items-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger"><Trash2 className="size-4" /></button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {list.data?.invalid.length ? <p className="mt-3 text-xs text-danger">{list.data.invalid.length} فایل نامعتبر نادیده گرفته شد: {list.data.invalid.join("، ")}</p> : null}

      {pages > 1 && (
        <nav aria-label="صفحه‌بندی" className="mt-4 flex items-center justify-center gap-3 text-sm">
          <Button variant="secondary" disabled={cur === 1} onClick={() => setPage(cur - 1)} aria-label="صفحه قبل"><ChevronRight className="size-4" /></Button>
          <span>{cur.toLocaleString("fa-IR")} از {pages.toLocaleString("fa-IR")}</span>
          <Button variant="secondary" disabled={cur === pages} onClick={() => setPage(cur + 1)} aria-label="صفحه بعد"><ChevronLeft className="size-4" /></Button>
        </nav>
      )}

      <ConfirmDialog open={!!del} busy={busy} danger title={`حذف ${L.one}`} confirmLabel="حذف"
        message={`«${del ? titleOf(del) : ""}» از پیش‌نویس حذف می‌شود. این حذف تا زمانی که منتشر نکنید روی سایت اعمال نمی‌شود، اما فایل تصویر آن پاک نمی‌شود.`}
        onConfirm={remove} onCancel={() => setDel(null)} />
    </>
  );
}
