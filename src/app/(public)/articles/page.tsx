import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ArticleCard } from "@/components/public/cards";
import { CategoryChips } from "@/components/public/category-chips";
import { articleCategories, getArticles } from "@/lib/content/public";
import { pageMeta } from "@/lib/seo/site";

export const metadata = pageMeta({
  title: "مقالات | آشنایی با حرز امام جواد و حرز ابی دجانه",
  description: "مقالات آموزشی نور هشتم درباره حرز امام جواد (ع)، حرز ابی دجانه، آداب کتابت و نگهداری، پیشینه و منابع.",
  path: "/articles",
});

export default function ArticlesPage() {
  const articles = getArticles();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Breadcrumbs items={[{ name: "مقالات", path: "/articles" }]} />
      <h1 className="text-3xl font-bold">مقالات</h1>
      <p className="mt-3 max-w-2xl leading-9 text-muted">مطالب آموزشی و تحلیلی درباره حرزها، آداب کتابت و شیوه صحیح نگهداری آن‌ها.</p>
      <CategoryChips kind="articles" items={articleCategories().map((c) => ({ slug: c.category.slug, name: c.category.name, count: c.items.length }))} />
      {articles.length === 0 ? <p className="mt-10 text-muted">هنوز مقاله‌ای منتشر نشده است.</p> : (
        <ul className="mt-8 grid gap-6 md:grid-cols-2">{articles.map((a, i) => <li key={a.id}><ArticleCard a={a} priority={i < 2} /></li>)}</ul>
      )}
    </div>
  );
}
