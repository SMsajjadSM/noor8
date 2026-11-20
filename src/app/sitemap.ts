import type { MetadataRoute } from "next";
import { articleCategories, getArticles, getProducts, MIN_INDEXABLE_CATEGORY, productCategories } from "@/lib/content/public";
import { abs } from "@/lib/seo/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const stat = ["/", "/products", "/articles", "/about", "/contact", "/terms", "/privacy"].map((p) => ({ url: abs(p), priority: p === "/" ? 1 : 0.6 }));
  return [
    ...stat,
    ...getProducts().map((p) => ({ url: abs(`/products/${p.slug}`), lastModified: p.updatedAt, priority: 0.8 })),
    ...productCategories().filter((x) => x.items.length >= MIN_INDEXABLE_CATEGORY).map((x) => ({ url: abs(`/products/category/${x.category.slug}`), priority: 0.6 })),
    ...articleCategories().filter((x) => x.items.length >= MIN_INDEXABLE_CATEGORY).map((x) => ({ url: abs(`/articles/category/${x.category.slug}`), priority: 0.5 })),
    ...getArticles().map((a) => ({ url: abs(`/articles/${a.slug}`), lastModified: a.updatedAt, priority: 0.7 })),
  ];
}
