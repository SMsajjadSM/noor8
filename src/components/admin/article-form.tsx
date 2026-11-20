"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Copy, Trash2 } from "lucide-react";
import { adminImg, api, ApiFail } from "@/lib/admin/api";
import { useLoad } from "@/lib/admin/use-load";
import { jalali } from "@/lib/utils/format";
import { articleInputSchema, type Article, type Block, type Categories } from "@/lib/validation/schemas";
import { ArticleBody } from "@/components/public/article-body";
import { ImagePicker } from "./image-picker";
import { PageHead } from "./page-head";
import { Button, ConfirmDialog, ErrorState, Field, inputCls, Skeleton, Switch, useToast } from "./ui";

type KBlock = { k: number; b: Block };
type Form = { slug: string; title: string; excerpt: string; date: string; readTime: string; image: string; category: string; published: boolean };
let keySeq = 0; // stable React keys for blocks
const todayIso = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tehran" });
const TYPES: [Block["type"], string][] = [["h2", "عنوان بخش"], ["h3", "زیرعنوان"], ["p", "پاراگراف"], ["ul", "فهرست نقطه‌ای"], ["ol", "فهرست شماره‌ای"], ["quote", "نقل‌قول / حدیث"], ["image", "تصویر"]];
const blank = (t: Block["type"]): Block =>
  t === "ul" || t === "ol" ? { type: t, items: [""] } : t === "image" ? { type: "image", src: "", alt: "" } : ({ type: t, text: "" } as Block);

function convert(b: Block, to: Block["type"]): Block {
  const text = "text" in b ? b.text : "items" in b ? b.items.join("\n") : "";
  if (to === "ul" || to === "ol") return { type: to, items: text.split("\n").filter(Boolean).length ? text.split("\n").filter(Boolean) : [""] };
  if (to === "image") return b.type === "image" ? b : blank("image");
  return { type: to, text } as Block;
}

export function ArticleForm({ id }: { id?: string }) {
  const router = useRouter();
  const toast = useToast();
  const wrap = (bs: Block[]): KBlock[] => bs.map((b) => ({ k: ++keySeq, b }));
  const cats = useLoad(() => api<Categories>("GET", "/api/admin/categories"));
  const existing = useLoad(async () => (id ? api<{ item: Article; sha: string }>("GET", `/api/admin/articles/${id}`) : null));
  const [form, setForm] = useState<Form | null>(id ? null : { slug: "", title: "", excerpt: "", date: todayIso(), readTime: "5", image: "", category: "", published: false });
  const [blocks, setBlocks] = useState<KBlock[]>(() => (id ? [] : wrap([blank("p")])));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState(false);

  if (!form && existing.data) {
    const a = existing.data.item;
    setForm({ slug: a.slug, title: a.title, excerpt: a.excerpt, date: a.date, readTime: String(a.readTime), image: a.image, category: a.category ?? "", published: a.published });
    setBlocks(wrap(a.content));
  }
  if (existing.error) return <ErrorState message={existing.error} onRetry={existing.reload} />;
  if (!form) return <Skeleton className="h-96" />;

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm({ ...form, [k]: v });
  const patch = (k: number, b: Block) => setBlocks(blocks.map((x) => (x.k === k ? { k, b } : x)));
  const move = (i: number, d: -1 | 1) => {
    const n = [...blocks];
    const [x] = n.splice(i, 1);
    n.splice(i + d, 0, x as KBlock);
    setBlocks(n);
  };
  const words = blocks.reduce((n, { b }) => n + ("text" in b ? b.text : "items" in b ? b.items.join(" ") : "").split(/\s+/).filter(Boolean).length, 0);

  function build() {
    return {
      ...form!, readTime: Number(form!.readTime), category: form!.category || null,
      content: blocks.map(({ b }) => (b.type === "ul" || b.type === "ol" ? { ...b, items: b.items.map((s) => s.trim()).filter(Boolean) } : b)),
    };
  }

  async function save() {
    const parsed = articleInputSchema.safeParse(build());
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path.join("."), i.message])));
      toast.error("فرم را بررسی کنید؛ چند فیلد نیاز به اصلاح دارد");
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      if (id) await api("PUT", `/api/admin/articles/${id}`, { ...parsed.data, sha: existing.data?.sha });
      else await api("POST", "/api/admin/articles", parsed.data);
      toast.ok("پیش‌نویس ذخیره شد. برای نمایش در سایت از بخش «انتشار» منتشر کنید");
      router.push("/admin/articles");
    } catch (e) {
      if (e instanceof ApiFail && e.code === "SLUG_TAKEN") setErrors({ slug: e.message });
      else if (e instanceof ApiFail && Array.isArray(e.details)) setErrors(Object.fromEntries((e.details as { path: string; message: string }[]).map((d) => [d.path, d.message])));
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await api("DELETE", `/api/admin/articles/${id}`);
      toast.ok("مقاله حذف شد");
      router.push("/admin/articles");
    } catch (e) {
      toast.error((e as Error).message);
      setBusy(false);
      setDel(false);
    }
  }

  const preview = build();
  const validPreview = preview.content.filter((b) => !(b.type === "image" && !b.src) && !("text" in b && !b.text.trim())) as Block[];

  return (
    <>
      <PageHead title={id ? "ویرایش مقاله" : "مقاله جدید"} hint="ذخیره، فقط پیش‌نویس را به‌روز می‌کند."
        actions={
          <div role="tablist" className="flex rounded-lg border border-line p-0.5 text-sm">
            {([["edit", "ویرایش"], ["preview", "پیش‌نمایش"]] as const).map(([v, l]) => (
              <button key={v} type="button" role="tab" aria-selected={tab === v} onClick={() => setTab(v)} className={`rounded-md px-4 py-1.5 ${tab === v ? "bg-accent text-on-accent" : "text-muted"}`}>{l}</button>
            ))}
          </div>
        } />

      {tab === "preview" ? (
        <article className="mx-auto max-w-2xl rounded-2xl border border-line bg-surface p-6 sm:p-10">
          {form.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={adminImg(form.image)} alt="" className="mb-6 w-full rounded-xl" />}
          <h1 className="text-3xl font-bold leading-snug">{form.title || "عنوان مقاله"}</h1>
          <p className="mt-2 text-sm text-muted"><time dateTime={form.date}>{jalali(form.date)}</time> · زمان مطالعه {Number(form.readTime || 0).toLocaleString("fa-IR")} دقیقه</p>
          <p className="mt-4 text-muted">{form.excerpt}</p>
          <div className="mt-6"><ArticleBody blocks={validPreview} resolveSrc={adminImg} /></div>
        </article>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); void save(); }} className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <div className="space-y-6">
            <div className="space-y-5 rounded-2xl border border-line bg-surface p-5">
              <Field label="عنوان مقاله" error={errors.title}>{(i) => <input id={i} value={form.title} onChange={(e) => set("title", e.target.value)} className={inputCls} />}</Field>
              <Field label="آدرس صفحه (slug)" error={errors.slug} hint="فقط حروف کوچک انگلیسی، عدد و خط تیره">{(i) => <input id={i} dir="ltr" value={form.slug} onChange={(e) => set("slug", e.target.value.toLowerCase())} className={inputCls} />}</Field>
              <Field label="خلاصه مقاله" error={errors.excerpt} hint="در لیست مقالات و توضیحات گوگل (Meta Description) استفاده می‌شود">{(i) => <textarea id={i} rows={3} value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} className={inputCls} />}</Field>
            </div>

            <section aria-label="بلوک‌های مقاله" className="space-y-3">
              <h2 className="font-bold">محتوای مقاله</h2>
              {errors.content && <p role="alert" className="text-sm text-danger">{errors.content}</p>}
              {blocks.map(({ k, b }, i) => {
                const err = Object.entries(errors).find(([p]) => p.startsWith(`content.${i}.`))?.[1];
                return (
                  <div key={k} className="rounded-2xl border border-line bg-surface p-4">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <select aria-label="نوع بلوک" value={b.type} onChange={(e) => patch(k, convert(b, e.target.value as Block["type"]))} className={`${inputCls} !w-auto`}>{TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                      <span className="flex-1" />
                      <IconBtn label="انتقال به بالا" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="size-4" /></IconBtn>
                      <IconBtn label="انتقال به پایین" disabled={i === blocks.length - 1} onClick={() => move(i, 1)}><ArrowDown className="size-4" /></IconBtn>
                      <IconBtn label="کپی بلوک" onClick={() => setBlocks([...blocks.slice(0, i + 1), ...wrap([b]), ...blocks.slice(i + 1)])}><Copy className="size-4" /></IconBtn>
                      <IconBtn label="حذف بلوک" danger disabled={blocks.length === 1} onClick={() => setBlocks(blocks.filter((x) => x.k !== k))}><Trash2 className="size-4" /></IconBtn>
                    </div>
                    <BlockFields b={b} onChange={(nb) => patch(k, nb)} />
                    {err && <p role="alert" className="mt-2 text-xs text-danger">{err}</p>}
                  </div>
                );
              })}
              <div className="flex flex-wrap gap-2 rounded-2xl border border-dashed border-line p-3">
                <span className="self-center text-sm text-muted">افزودن بلوک:</span>
                {TYPES.map(([t, l]) => <Button key={t} variant="secondary" className="h-8 px-3 text-xs" onClick={() => setBlocks([...blocks, ...wrap([blank(t)])])}>{l}</Button>)}
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <div className="space-y-5 rounded-2xl border border-line bg-surface p-5">
              <Switch checked={form.published} onChange={(v) => set("published", v)} label={form.published ? "آماده انتشار" : "پیش‌نویس"} />
              <Field label="تاریخ انتشار" error={errors.date} hint={`تاریخ شمسی: ${jalali(form.date)}`}>{(i) => <input id={i} type="date" dir="ltr" value={form.date} onChange={(e) => set("date", e.target.value)} className={inputCls} />}</Field>
              <Field label="دسته‌بندی" error={errors.category} hint={cats.data && cats.data.articles.length === 0 ? "ابتدا از منوی «دسته‌بندی‌ها» دسته بسازید" : undefined}>
                {(i) => <select id={i} value={form.category} onChange={(e) => set("category", e.target.value)} className={inputCls}><option value="">بدون دسته‌بندی</option>{cats.data?.articles.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select>}
              </Field>
              <Field label="زمان مطالعه (دقیقه)" error={errors.readTime}>
                {(i) => (
                  <div className="flex gap-2">
                    <input id={i} inputMode="numeric" dir="ltr" value={form.readTime} onChange={(e) => set("readTime", e.target.value.replace(/\D/g, ""))} className={inputCls} />
                    <Button variant="secondary" className="shrink-0 px-3" onClick={() => set("readTime", String(Math.max(1, Math.round(words / 200))))}>محاسبه</Button>
                  </div>
                )}
              </Field>
            </div>
            <div className="space-y-3 rounded-2xl border border-line bg-surface p-5">
              <p className="text-sm font-medium">تصویر شاخص</p>
              <ImagePicker value={form.image} folder="articles" onChange={(v) => set("image", v)} error={errors.image} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" loading={busy} className="flex-1">ذخیره پیش‌نویس</Button>
              {id && <Button variant="secondary" className="text-danger" onClick={() => setDel(true)}>حذف</Button>}
            </div>
          </aside>
        </form>
      )}
      <ConfirmDialog open={del} busy={busy} danger title="حذف مقاله" confirmLabel="حذف" message={`«${form.title}» از پیش‌نویس حذف می‌شود و با انتشار از سایت هم برداشته خواهد شد.`} onConfirm={remove} onCancel={() => setDel(false)} />
    </>
  );
}

function IconBtn({ label, danger, disabled, onClick, children }: { label: string; danger?: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" aria-label={label} title={label} disabled={disabled} onClick={onClick} className={`grid size-8 place-items-center rounded-lg text-muted hover:bg-surface-2 disabled:opacity-30 ${danger ? "hover:text-danger" : "hover:text-text"}`}>{children}</button>;
}

function BlockFields({ b, onChange }: { b: Block; onChange: (b: Block) => void }) {
  if (b.type === "h2" || b.type === "h3") return <input aria-label="متن عنوان" value={b.text} onChange={(e) => onChange({ ...b, text: e.target.value })} className={`${inputCls} ${b.type === "h2" ? "text-base font-bold" : "font-semibold"}`} />;
  if (b.type === "p" || b.type === "quote") return <textarea aria-label="متن" rows={b.type === "p" ? 5 : 3} value={b.text} onChange={(e) => onChange({ ...b, text: e.target.value })} className={`${inputCls} ${b.type === "quote" ? "border-r-4 border-r-accent" : ""}`} />;
  if (b.type === "ul" || b.type === "ol")
    return (
      <div className="space-y-1">
        <textarea aria-label="موارد فهرست" rows={Math.max(3, b.items.length + 1)} value={b.items.join("\n")} onChange={(e) => onChange({ ...b, items: e.target.value.split("\n") })} className={inputCls} />
        <p className="text-xs text-muted">هر خط یک مورد فهرست است.</p>
      </div>
    );
  return (
    <div className="space-y-3">
      <ImagePicker value={b.src} folder="articles" onChange={(src) => onChange({ ...b, src })} />
      <input aria-label="متن جایگزین تصویر (Alt)" placeholder="متن جایگزین تصویر (الزامی؛ برای دسترسی‌پذیری و سئو)" value={b.alt} onChange={(e) => onChange({ ...b, alt: e.target.value })} className={inputCls} />
      <input aria-label="زیرنویس" placeholder="زیرنویس (اختیاری)" value={b.caption ?? ""} onChange={(e) => onChange({ ...b, caption: e.target.value })} className={inputCls} />
    </div>
  );
}
