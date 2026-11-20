"use client";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { api, ApiFail } from "@/lib/admin/api";
import { useLoad } from "@/lib/admin/use-load";
import { categoriesSchema, type Categories, type Category } from "@/lib/validation/schemas";
import { PageHead } from "@/components/admin/page-head";
import { Button, ErrorState, inputCls, Skeleton, useToast } from "@/components/admin/ui";

type Kind = "products" | "articles";
const TITLE: Record<Kind, string> = { products: "دسته‌بندی محصولات", articles: "دسته‌بندی مقالات" };

export default function CategoriesPage() {
  const toast = useToast();
  const load = useLoad(() => api<Categories>("GET", "/api/admin/categories"));
  const [data, setData] = useState<Categories | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  if (!data && load.data) setData(load.data);
  if (load.error) return <><PageHead title="دسته‌بندی‌ها" /><ErrorState message={load.error} onRetry={load.reload} /></>;
  if (!data) return <Skeleton className="h-72" />;

  const patch = (kind: Kind, i: number, c: Partial<Category>) => setData({ ...data, [kind]: data[kind].map((x, j) => (j === i ? { ...x, ...c } : x)) });
  const remove = (kind: Kind, i: number) => setData({ ...data, [kind]: data[kind].filter((_, j) => j !== i) });
  const add = (kind: Kind) => setData({ ...data, [kind]: [...data[kind], { slug: "", name: "", description: "" }] });

  async function save() {
    const parsed = categoriesSchema.safeParse(data);
    if (!parsed.success) {
      setErrors(parsed.error.issues.map((i) => `${i.path[0] === "products" ? "محصولات" : "مقالات"}${typeof i.path[1] === "number" ? ` (ردیف ${i.path[1] + 1})` : ""}: ${i.message}`));
      return;
    }
    setErrors([]);
    setBusy(true);
    try {
      await api("PUT", "/api/admin/categories", parsed.data);
      toast.ok("دسته‌بندی‌ها ذخیره شد. برای اعمال در سایت، از بخش «انتشار» منتشر کنید");
    } catch (e) {
      if (e instanceof ApiFail && Array.isArray(e.details)) setErrors(e.details.map(String));
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHead title="دسته‌بندی‌ها" hint="هر دسته صفحه جداگانه دارد. دسته‌ای که کمتر از ۲ مورد دارد در گوگل معرفی نمی‌شود، ولی برای بازدیدکننده نمایش داده می‌شود."
        actions={<Button loading={busy} onClick={save}>ذخیره دسته‌بندی‌ها</Button>} />
      {errors.length > 0 && <ul role="alert" className="mb-5 list-disc space-y-1 rounded-xl border border-danger/40 bg-danger/10 p-4 pr-8 text-sm text-danger">{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>}
      <div className="space-y-8">
        {(["products", "articles"] as const).map((kind) => (
          <section key={kind} aria-label={TITLE[kind]} className="space-y-3">
            <h2 className="text-lg font-bold">{TITLE[kind]}</h2>
            {data[kind].length === 0 && <p className="rounded-xl border border-dashed border-line p-5 text-sm text-muted">هنوز دسته‌ای ساخته نشده.</p>}
            {data[kind].map((c, i) => (
              <div key={i} className="grid gap-3 rounded-2xl border border-line bg-surface p-4 sm:grid-cols-[1fr_1fr_auto]">
                <input aria-label="نام دسته" placeholder="نام دسته (فارسی)" value={c.name} onChange={(e) => patch(kind, i, { name: e.target.value })} className={inputCls} />
                <input aria-label="آدرس دسته" placeholder="آدرس انگلیسی، مثلاً armband" dir="ltr" value={c.slug} onChange={(e) => patch(kind, i, { slug: e.target.value.toLowerCase() })} className={inputCls} />
                <button type="button" aria-label="حذف دسته" onClick={() => remove(kind, i)} className="grid size-10 place-items-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger"><Trash2 className="size-4" /></button>
                <textarea aria-label="توضیح دسته" placeholder="توضیح کوتاه برای گوگل و بازدیدکننده (اختیاری)" rows={2} value={c.description} onChange={(e) => patch(kind, i, { description: e.target.value })} className={`${inputCls} sm:col-span-3`} />
              </div>
            ))}
            <Button variant="secondary" onClick={() => add(kind)}><Plus className="size-4" aria-hidden />افزودن دسته</Button>
          </section>
        ))}
      </div>
    </>
  );
}
