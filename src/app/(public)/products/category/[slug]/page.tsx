import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { CategoryChips } from "@/components/public/category-chips";
import { ProductCard } from "@/components/public/cards";
import { getSettings, MIN_INDEXABLE_CATEGORY, productCategories } from "@/lib/content/public";
import { describe, pageMeta } from "@/lib/seo/site";

export const dynamicParams = false;
export const generateStaticParams = () => productCategories().map((x) => ({ slug: x.category.slug }));

const find = (slug: string) => productCategories().find((x) => x.category.slug === slug);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const x = find((await params).slug);
  if (!x) return {};
  const meta = pageMeta({
    title: `${x.category.name} | محصولات`,
    description: describe(x.category.description || `${x.category.name}؛ محصولات نور هشتم در این دسته، همراه با قیمت و توضیح کامل.`),
    path: `/products/category/${x.category.slug}`,
    image: x.items[0]?.image,
  });
  // Thin pages are useful to visitors but are not worth indexing.
  return x.items.length < MIN_INDEXABLE_CATEGORY ? { ...meta, robots: { index: false, follow: true } } : meta;
}

export default async function ProductCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const x = find(slug);
  if (!x) notFound();
  const { currencyUnit } = getSettings();
  const all = productCategories().map((c) => ({ slug: c.category.slug, name: c.category.name, count: c.items.length }));
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Breadcrumbs items={[{ name: "محصولات", path: "/products" }, { name: x.category.name, path: `/products/category/${slug}` }]} />
      <h1 className="text-3xl font-bold">{x.category.name}</h1>
      {x.category.description && <p className="mt-3 max-w-2xl leading-9 text-muted">{x.category.description}</p>}
      <CategoryChips kind="products" items={all} current={slug} />
      <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{x.items.map((p, i) => <li key={p.id}><ProductCard p={p} unit={currencyUnit} priority={i < 4} /></li>)}</ul>
    </div>
  );
}
