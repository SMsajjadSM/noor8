"use client";
import { useRef, useState } from "react";
import { Trash2, Upload } from "lucide-react";
import { adminImg, api, compressImage } from "@/lib/admin/api";
import { useLoad } from "@/lib/admin/use-load";
import { PageHead } from "@/components/admin/page-head";
import { Badge, Button, ConfirmDialog, EmptyState, ErrorState, Skeleton, useToast } from "@/components/admin/ui";

type Media = { path: string; size: number; usedBy: string[] };

export default function MediaPage() {
  const toast = useToast();
  const media = useLoad(() => api<Media[]>("GET", "/api/admin/media"));
  const fileRef = useRef<HTMLInputElement>(null);
  const [folder, setFolder] = useState<"products" | "articles">("products");
  const [filter, setFilter] = useState<"all" | "unused">("all");
  const [uploading, setUploading] = useState(false);
  const [del, setDel] = useState<Media | null>(null);
  const [busy, setBusy] = useState(false);

  async function upload(files: FileList) {
    setUploading(true);
    let added = 0;
    for (const f of Array.from(files)) {
      try {
        const fd = new FormData();
        fd.set("folder", folder);
        fd.set("file", await compressImage(f));
        const r = await api<{ duplicate: boolean }>("POST", "/api/admin/media", fd);
        if (!r.duplicate) added++;
        else toast.ok(`«${f.name}» قبلاً آپلود شده بود`);
      } catch (e) {
        toast.error(`${f.name}: ${(e as Error).message}`);
      }
    }
    if (added) toast.ok(`${added.toLocaleString("fa-IR")} تصویر آپلود شد`);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    media.reload();
  }

  async function remove() {
    if (!del) return;
    setBusy(true);
    try {
      await api("DELETE", `/api/admin/media?path=${encodeURIComponent(del.path)}`);
      toast.ok("تصویر حذف شد");
      setDel(null);
      media.reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const items = (media.data ?? []).filter((m) => filter === "all" || !m.usedBy.length);

  return (
    <>
      <PageHead title="رسانه" hint="تصاویر استفاده‌شده در محتوا قابل حذف نیستند تا صفحه‌ای خراب نشود."
        actions={<>
          <select aria-label="پوشه آپلود" value={folder} onChange={(e) => setFolder(e.target.value as typeof folder)} className="h-10 rounded-lg border border-line bg-surface px-3 text-sm">
            <option value="products">آپلود در: محصولات</option><option value="articles">آپلود در: مقالات</option>
          </select>
          <Button loading={uploading} onClick={() => fileRef.current?.click()}><Upload className="size-4" aria-hidden />آپلود تصویر</Button>
          <input ref={fileRef} type="file" multiple accept="image/webp,image/avif,image/jpeg,image/png" hidden onChange={(e) => e.target.files?.length && upload(e.target.files)} />
        </>} />
      <div className="mb-4 flex gap-2 text-sm">
        {([["all", "همه"], ["unused", "بلااستفاده"]] as const).map(([v, l]) => (
          <button key={v} type="button" aria-pressed={filter === v} onClick={() => setFilter(v)} className={`rounded-full border px-4 py-1.5 ${filter === v ? "border-accent bg-accent-soft text-accent" : "border-line text-muted"}`}>{l}</button>
        ))}
      </div>
      {media.error ? <ErrorState message={media.error} onRetry={media.reload} />
      : media.loading ? <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="aspect-square" />)}</div>
      : !items.length ? <EmptyState title={filter === "unused" ? "تصویر بلااستفاده‌ای وجود ندارد" : "هنوز تصویری آپلود نشده"} />
      : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((m) => (
            <li key={m.path} className="overflow-hidden rounded-2xl border border-line bg-surface">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={adminImg(m.path)} alt={m.path.split("/").pop()} loading="lazy" className="aspect-square w-full bg-white object-contain" />
              <div className="space-y-2 p-3 text-xs">
                <p className="truncate text-muted" dir="ltr">{m.path.replace("/photo/", "")}</p>
                <div className="flex items-center justify-between gap-2">
                  {m.usedBy.length ? <Badge tone="ok" ><span title={m.usedBy.join("\n")}>در {m.usedBy.length.toLocaleString("fa-IR")} مورد</span></Badge> : <Badge>بلااستفاده</Badge>}
                  <span className="text-muted">{Math.round(m.size / 1024).toLocaleString("fa-IR")} KB</span>
                  <button type="button" aria-label="حذف تصویر" disabled={m.usedBy.length > 0} onClick={() => setDel(m)} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger disabled:opacity-30"><Trash2 className="size-4" /></button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog open={!!del} busy={busy} danger title="حذف تصویر" confirmLabel="حذف" message="این تصویر از پیش‌نویس حذف می‌شود و با انتشار از سایت هم برداشته خواهد شد." onConfirm={remove} onCancel={() => setDel(null)} />
    </>
  );
}
