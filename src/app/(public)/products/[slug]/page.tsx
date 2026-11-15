import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { JsonLd } from "@/components/layout/json-ld";
import { ArticleCard, ProductCard, SectionHead } from "@/components/public/cards";
import { BuyCta } from "@/components/public/buy-cta";
import { getArticles, getProduct, getProducts, getSettings } from "@/lib/content/public";
import { productLd } from "@/lib/seo/schema";
import { describe, pageMeta } from "@/lib/seo/site";
import { formatPrice } from "@/lib/utils/format";

export const dynamicParams = false;
export const generateStaticParams = () => getProducts().map((p) => ({ slug: p.slug }));

const text = (p: NonNullable<ReturnType<typeof getProduct>>) => describe(`${p.name}؛ ${p.desc}. ${p.details}`);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = getProduct((await params).slug);
  if (!p) return {};
  return pageMeta({ title: p.name, description: text(p), path: `/products/${p.slug}`, image: p.image });
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = getProduct((await params).slug);
  if (!p) notFound();
  const settings = getSettings();
  const related = getProducts().filter((x) => x.id !== p.id).slice(0, 4);
  const articles = getArticles().slice(0, 2);
  const paragraphs = p.details.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <JsonLd data={productLd(p, text(p))} />
      <Breadcrumbs items={[{ name: "محصولات", path: "/products" }, { name: p.name, path: `/products/${p.slug}` }]} />

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-[2rem] border border-line bg-white">
          <Image src={p.image} alt={p.name} fill priority sizes="(min-width:1024px) 45vw, 95vw" className="object-contain p-6" />
          {p.tag && <span className="absolute right-4 top-4 rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-on-accent">{p.tag}</span>}
        </div>

        <div className="space-y-6">
          <h1 className="text-3xl font-bold leading-[1.6]">{p.name}</h1>
          <p className="text-lg leading-9 text-muted">{p.desc}</p>
          <p className="text-3xl font-bold text-accent">{p.price > 0 ? formatPrice(p.price, settings.currencyUnit) : "برای قیمت تماس بگیرید"}</p>
          <BuyCta settings={settings} productName={p.name} />
          <p className="text-sm leading-8 text-muted">سفارش به‌صورت تلفنی یا پیام‌رسان ثبت می‌شود؛ پرداخت آنلاین در سایت وجود ندارد.</p>

          {paragraphs.length > 0 && (
            <section aria-labelledby="details" className="border-t border-line pt-6">
              <h2 id="details" className="mb-3 text-xl font-bold">توضیحات محصول</h2>
              <div className="space-y-4 leading-9">{paragraphs.map((t, i) => <p key={i}>{t}</p>)}</div>
            </section>
          )}
        </div>
      </div>

      {articles.length > 0 && (
        <section className="mt-20"><SectionHead title="بیشتر بخوانید" href="/articles" />
          <ul className="grid gap-6 md:grid-cols-2">{articles.map((a) => <li key={a.id}><ArticleCard a={a} /></li>)}</ul>
        </section>
      )}
      {related.length > 0 && (
        <section className="mt-20"><SectionHead title="محصولات دیگر" href="/products" />
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{related.map((x) => <li key={x.id}><ProductCard p={x} unit={settings.currencyUnit} /></li>)}</ul>
        </section>
      )}
      <p className="mt-16 text-center text-sm"><Link href="/products" className="text-accent hover:underline">← بازگشت به همه محصولات</Link></p>
    </div>
  );
}
