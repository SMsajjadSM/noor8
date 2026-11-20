"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiFail } from "@/lib/admin/api";
import { useLoad } from "@/lib/admin/use-load";
import { formatPrice } from "@/lib/utils/format";
import { productInputSchema, type Categories, type Product, type Settings } from "@/lib/validation/schemas";
import { ImagePicker } from "./image-picker";
import { PageHead } from "./page-head";
import { Button, ConfirmDialog, ErrorState, Field, inputCls, Skeleton, Switch, useToast } from "./ui";

export const PRODUCT_ICONS = [["ring", "حلقه"], ["pendant", "آویز"], ["frame", "قاب"]] as const;
type Form = { slug: string; name: string; desc: string; price: string; icon: string; image: string; tag: string; category: string; details: string; order: string; published: boolean };
const empty: Form = { slug: "", name: "", desc: "", price: "", icon: "frame", image: "", tag: "", category: "", details: "", order: "100", published: false };
const fromProduct = (p: Product): Form => ({ ...p, price: String(p.price), order: String(p.order), tag: p.tag ?? "", category: p.category ?? "" });

export function ProductForm({ id }: { id?: string }) {
  const router = useRouter();
  const toast = useToast();
  const settings = useLoad(() => api<Settings>("GET", "/api/admin/settings"));
  const cats = useLoad(() => api<Categories>("GET", "/api/admin/categories"));
  const existing = useLoad(async () => (id ? api<{ item: Product; sha: string }>("GET", `/api/admin/products/${id}`) : null));
  const [form, setForm] = useState<Form | null>(id ? null : empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState(false);
  if (!form && existing.data) setForm(fromProduct(existing.data.item));

  if (existing.error) return <ErrorState message={existing.error} onRetry={existing.reload} />;
  if (!form) return <Skeleton className="h-96" />;

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm({ ...form, [k]: v });
  const unit = settings.data?.currencyUnit ?? "تومان";

  async function save() {
    if (!form) return;
    const input = { ...form, price: form.price.trim() === "" ? NaN : Number(form.price), order: form.order === "" ? 100 : Number(form.order), tag: form.tag.trim() || null, category: form.category || null };
    const parsed = productInputSchema.safeParse(input);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])));
      toast.error("فرم را بررسی کنید؛ چند فیلد نیاز به اصلاح دارد");
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      if (id) await api("PUT", `/api/admin/products/${id}`, { ...parsed.data, sha: existing.data?.sha });
      else await api("POST", "/api/admin/products", parsed.data);
      toast.ok("پیش‌نویس ذخیره شد. برای نمایش در سایت از بخش «انتشار» منتشر کنید");
      router.push("/admin/products");
    } catch (e) {
      if (e instanceof ApiFail && Array.isArray(e.details)) setErrors(Object.fromEntries((e.details as { path: string; message: string }[]).map((d) => [d.path, d.message])));
      if (e instanceof ApiFail && e.code === "SLUG_TAKEN") setErrors({ slug: e.message });
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await api("DELETE", `/api/admin/products/${id}`);
      toast.ok("محصول حذف شد");
      router.push("/admin/products");
    } catch (e) {
      toast.error((e as Error).message);
      setBusy(false);
      setDel(false);
    }
  }

  return (
    <>
      <PageHead title={id ? "ویرایش محصول" : "محصول جدید"} hint="ذخیره، فقط پیش‌نویس را به‌روز می‌کند." />
      <form onSubmit={(e) => { e.preventDefault(); void save(); }} className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-5 rounded-2xl border border-line bg-surface p-5">
          <Field label="نام محصول" error={errors.name}>{(i) => <input id={i} value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} />}</Field>
          <Field label="آدرس صفحه (slug)" error={errors.slug} hint="فقط حروف کوچک انگلیسی، عدد و خط تیره؛ مثلاً imam-javad-deer-skin">
            {(i) => <input id={i} dir="ltr" value={form.slug} onChange={(e) => set("slug", e.target.value.toLowerCase())} className={inputCls} />}
          </Field>
          <Field label="توضیح کوتاه" error={errors.desc}>{(i) => <input id={i} value={form.desc} onChange={(e) => set("desc", e.target.value)} className={inputCls} />}</Field>
          <Field label={`قیمت (${unit})`} error={errors.price} hint={form.price && Number(form.price) >= 0 ? `نمایش در سایت: ${formatPrice(Number(form.price), unit)}` : "عدد را بدون جداکننده وارد کنید"}>
            {(i) => <input id={i} inputMode="numeric" dir="ltr" value={form.price} onChange={(e) => set("price", e.target.value.replace(/[^\d]/g, ""))} className={inputCls} />}
          </Field>
          <Field label="توضیحات کامل" error={errors.details} hint="هر پاراگراف را با یک خط خالی جدا کنید.">
            {(i) => <textarea id={i} rows={10} value={form.details} onChange={(e) => set("details", e.target.value)} className={inputCls} />}
          </Field>
        </div>

        <aside className="space-y-5">
          <div className="space-y-5 rounded-2xl border border-line bg-surface p-5">
            <Switch checked={form.published} onChange={(v) => set("published", v)} label={form.published ? "آماده انتشار" : "پیش‌نویس"} />
            <Field label="برچسب" error={errors.tag} hint="مثلاً «پرفروش» یا «جدید»؛ خالی بگذارید تا نمایش داده نشود">{(i) => <input id={i} value={form.tag} onChange={(e) => set("tag", e.target.value)} className={inputCls} />}</Field>
            <Field label="دسته‌بندی" error={errors.category} hint={cats.data && cats.data.products.length === 0 ? "ابتدا از منوی «دسته‌بندی‌ها» دسته بسازید" : undefined}>
              {(i) => <select id={i} value={form.category} onChange={(e) => set("category", e.target.value)} className={inputCls}><option value="">بدون دسته‌بندی</option>{cats.data?.products.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select>}
            </Field>
            <Field label="ترتیب نمایش" error={errors.order} hint="عدد کمتر، بالاتر در لیست سایت">{(i) => <input id={i} inputMode="numeric" dir="ltr" value={form.order} onChange={(e) => set("order", e.target.value.replace(/\D/g, ""))} className={inputCls} />}</Field>
            <Field label="آیکون" error={errors.icon}>
              {(i) => <select id={i} value={form.icon} onChange={(e) => set("icon", e.target.value)} className={inputCls}>{PRODUCT_ICONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>}
            </Field>
          </div>
          <div className="space-y-3 rounded-2xl border border-line bg-surface p-5">
            <p className="text-sm font-medium">تصویر محصول</p>
            <ImagePicker value={form.image} folder="products" onChange={(v) => set("image", v)} error={errors.image} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" loading={busy} className="flex-1">ذخیره پیش‌نویس</Button>
            {id && <Button variant="secondary" className="text-danger" onClick={() => setDel(true)}>حذف</Button>}
          </div>
        </aside>
      </form>
      <ConfirmDialog open={del} busy={busy} danger title="حذف محصول" confirmLabel="حذف" message={`«${form.name}» از پیش‌نویس حذف می‌شود و با انتشار از سایت هم برداشته خواهد شد.`} onConfirm={remove} onCancel={() => setDel(false)} />
    </>
  );
}
