import type { MetadataRoute } from "next";
import { getArticles, getProducts } from "@/lib/content/public";
import { abs } from "@/lib/seo/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const stat = ["/", "/products", "/articles", "/about", "/contact", "/terms", "/privacy"].map((p) => ({ url: abs(p), priority: p === "/" ? 1 : 0.6 }));
  return [
    ...stat,
    ...getProducts().map((p) => ({ url: abs(`/products/${p.slug}`), lastModified: p.updatedAt, priority: 0.8 })),
    ...getArticles().map((a) => ({ url: abs(`/articles/${a.slug}`), lastModified: a.updatedAt, priority: 0.7 })),
  ];
}
