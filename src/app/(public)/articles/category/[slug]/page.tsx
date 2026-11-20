import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { CategoryChips } from "@/components/public/category-chips";
import { ArticleCard } from "@/components/public/cards";
import { articleCategories, MIN_INDEXABLE_CATEGORY } from "@/lib/content/public";
import { describe, pageMeta } from "@/lib/seo/site";

export const dynamicParams = false;
export const generateStaticParams = () => articleCategories().map((x) => ({ slug: x.category.slug }));

const find = (slug: string) => articleCategories().find((x) => x.category.slug === slug);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const x = find((await params).slug);
  if (!x) return {};
  const meta = pageMeta({
    title: `${x.category.name} | مقالات`,
    description: describe(x.category.description || `مقالات نور هشتم درباره ${x.category.name}.`),
    path: `/articles/category/${x.category.slug}`,
    image: x.items[0]?.image,
  });
  return x.items.length < MIN_INDEXABLE_CATEGORY ? { ...meta, robots: { index: false, follow: true } } : meta;
}

export default async function ArticleCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const x = find(slug);
  if (!x) notFound();
  const all = articleCategories().map((c) => ({ slug: c.category.slug, name: c.category.name, count: c.items.length }));
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Breadcrumbs items={[{ name: "مقالات", path: "/articles" }, { name: x.category.name, path: `/articles/category/${slug}` }]} />
      <h1 className="text-3xl font-bold">{x.category.name}</h1>
      {x.category.description && <p className="mt-3 max-w-2xl leading-9 text-muted">{x.category.description}</p>}
      <CategoryChips kind="articles" items={all} current={slug} />
      <ul className="mt-8 grid gap-6 md:grid-cols-2">{x.items.map((a, i) => <li key={a.id}><ArticleCard a={a} priority={i < 2} /></li>)}</ul>
    </div>
  );
}
