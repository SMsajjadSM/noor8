"use client";
import { useRef, useState } from "react";
import { ImagePlus, Upload } from "lucide-react";
import { adminImg, api, compressImage } from "@/lib/admin/api";
import { useLoad } from "@/lib/admin/use-load";
import { Button, Skeleton, useToast } from "./ui";

type Media = { path: string; size: number; usedBy: string[] };

export function ImagePicker({ value, folder, onChange, error }: { value: string; folder: "products" | "articles"; onChange: (path: string) => void; error?: string }) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [lib, setLib] = useState(false);
  const media = useLoad(() => api<Media[]>("GET", "/api/admin/media"));

  async function upload(file: File) {
    setBusy(true);
    try {
      const small = await compressImage(file);
      const fd = new FormData();
      fd.set("folder", folder);
      fd.set("file", small);
      const r = await api<{ path: string; duplicate: boolean }>("POST", "/api/admin/media", fd);
      onChange(r.path);
      media.reload();
      toast.ok(r.duplicate ? "این تصویر قبلاً آپلود شده بود و همان استفاده شد" : "تصویر آپلود شد");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-4">
        <div className="grid size-32 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-white">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={adminImg(value)} alt="پیش‌نمایش تصویر انتخاب‌شده" className="size-full object-contain" />
          ) : (
            <ImagePlus className="size-8 text-muted" aria-hidden />
          )}
        </div>
        <div className="flex flex-col justify-center gap-2">
          <Button variant="secondary" loading={busy} onClick={() => fileRef.current?.click()}><Upload className="size-4" aria-hidden />{value ? "تغییر تصویر" : "آپلود تصویر"}</Button>
          <Button variant="ghost" onClick={() => setLib(true)}>انتخاب از کتابخانه</Button>
          {value && <Button variant="ghost" className="text-danger" onClick={() => onChange("")}>برداشتن تصویر</Button>}
          <input ref={fileRef} type="file" accept="image/webp,image/avif,image/jpeg,image/png" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        </div>
      </div>
      <p className="text-xs text-muted">تصویر قبل از آپلود به WebP و حداکثر ۱۶۰۰ پیکسل کوچک می‌شود.</p>
      {error && <p role="alert" className="text-xs text-danger">{error}</p>}

      {lib && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setLib(false)}>
          <div role="dialog" aria-label="کتابخانه تصاویر" className="max-h-[85dvh] w-full max-w-3xl overflow-auto rounded-2xl border border-line bg-surface p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between"><h2 className="font-bold">کتابخانه تصاویر</h2><Button variant="ghost" onClick={() => setLib(false)}>بستن</Button></div>
            {media.loading ? (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="aspect-square" />)}</div>
            ) : (
              <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {media.data?.map((m) => (
                  <li key={m.path}>
                    <button type="button" onClick={() => { onChange(m.path); setLib(false); }} className={`block w-full overflow-hidden rounded-xl border bg-white ${m.path === value ? "border-accent ring-2 ring-accent" : "border-line"}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={adminImg(m.path)} alt={m.path.split("/").pop()} loading="lazy" className="aspect-square w-full object-contain" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
