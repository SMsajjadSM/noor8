import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { JsonLd } from "@/components/layout/json-ld";
import { ArticleCard, ProductCard, SectionHead } from "@/components/public/cards";
import { ArticleBody } from "@/components/public/article-body";
import { BuyCta } from "@/components/public/buy-cta";
import { getArticle, getArticles, getCategory, getProducts, getSettings } from "@/lib/content/public";
import { articleLd } from "@/lib/seo/schema";
import { pageMeta } from "@/lib/seo/site";
import { jalali } from "@/lib/utils/format";

export const dynamicParams = false;
export const generateStaticParams = () => getArticles().map((a) => ({ slug: a.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const a = getArticle((await params).slug);
  if (!a) return {};
  return pageMeta({ title: a.title, description: a.excerpt, path: `/articles/${a.slug}`, image: a.image, type: "article", publishedTime: a.date, modifiedTime: a.updatedAt });
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const a = getArticle((await params).slug);
  if (!a) notFound();
  const settings = getSettings();
  const cat = getCategory("articles", a.category);
  const others = getArticles().filter((x) => x.id !== a.id);
  const more = [...others.filter((x) => cat && x.category === cat.slug), ...others.filter((x) => !cat || x.category !== cat.slug)].slice(0, 2);
  const products = getProducts().slice(0, 4);
  const toc = a.content.map((b, i) => ({ b, i })).filter(({ b }) => b.type === "h2") as { b: { type: "h2"; text: string }; i: number }[];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <JsonLd data={articleLd(a)} />
      <Breadcrumbs items={[{ name: "مقالات", path: "/articles" }, ...(cat ? [{ name: cat.name, path: `/articles/category/${cat.slug}` }] : []), { name: a.title, path: `/articles/${a.slug}` }]} />
      <article className="mx-auto max-w-3xl">
        <header>
          {cat && <Link href={`/articles/category/${cat.slug}`} className="inline-block rounded-full border border-line bg-surface px-3 py-1 text-sm text-accent hover:border-accent">{cat.name}</Link>}
          <h1 className="mt-3 text-3xl font-bold leading-[1.7] sm:text-4xl">{a.title}</h1>
          <p className="mt-4 text-sm text-muted">
            منتشرشده در <time dateTime={a.date}>{jalali(a.date)}</time>
            {a.updatedAt > a.date && <> · به‌روزرسانی <time dateTime={a.updatedAt}>{jalali(a.updatedAt)}</time></>} · {a.readTime.toLocaleString("fa-IR")} دقیقه مطالعه
          </p>
          <p className="mt-5 text-lg leading-9 text-muted">{a.excerpt}</p>
          <div className="relative mt-8 aspect-[16/10] overflow-hidden rounded-3xl border border-line">
            <Image src={a.image} alt={a.title} fill priority sizes="(min-width:768px) 48rem, 95vw" className="object-cover" />
          </div>
        </header>

        {toc.length > 3 && (
          <details className="mt-8 rounded-2xl border border-line bg-surface p-5">
            <summary className="cursor-pointer font-bold">فهرست مطالب</summary>
            <ol className="mt-4 list-decimal space-y-2 pr-6 text-sm marker:text-accent">
              {toc.map(({ b, i }) => <li key={i}><a href={`#s${i}`} className="hover:text-accent">{b.text}</a></li>)}
            </ol>
          </details>
        )}

        <div className="mt-8"><ArticleBody blocks={a.content} /></div>

        <aside className="mt-14 rounded-3xl border border-line bg-surface p-6 text-center sm:p-8">
          <h2 className="text-xl font-bold">درباره سفارش حرز سؤال دارید؟</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-8 text-muted">برای مشاوره و ثبت سفارش با ما در ارتباط باشید.</p>
          <div className="mt-5 flex justify-center"><BuyCta settings={settings} /></div>
        </aside>
      </article>

      {more.length > 0 && <section className="mt-20"><SectionHead title="مقالات بیشتر" href="/articles" /><ul className="grid gap-6 md:grid-cols-2">{more.map((x) => <li key={x.id}><ArticleCard a={x} /></li>)}</ul></section>}
      {products.length > 0 && <section className="mt-20"><SectionHead title="محصولات نور هشتم" href="/products" /><ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{products.map((p) => <li key={p.id}><ProductCard p={p} unit={settings.currencyUnit} /></li>)}</ul></section>}
      <p className="mt-16 text-center text-sm"><Link href="/articles" className="text-accent hover:underline">← بازگشت به مقالات</Link></p>
    </div>
  );
}
