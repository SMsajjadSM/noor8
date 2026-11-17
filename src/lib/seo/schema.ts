import type { Article, Product, Settings } from "@/lib/validation/schemas";
import { abs, channels, SITE_NAME } from "./site";

type Json = Record<string, unknown>;
const org: Json = { "@type": "Organization", "@id": abs("/#organization"), name: SITE_NAME, url: abs("/") };

export function organizationLd(s: Settings): Json {
  const ch = channels(s);
  const phones = ch.filter((c) => c.kind === "phone" || c.kind === "phone2");
  const sameAs = ch.filter((c) => ["instagram", "telegram", "bale", "eitaa"].includes(c.kind)).map((c) => c.href);
  return {
    "@context": "https://schema.org", ...org, logo: abs("/logo.png"),
    ...(sameAs.length ? { sameAs } : {}),
    ...(phones.length ? { contactPoint: phones.map((c) => ({ "@type": "ContactPoint", telephone: c.href.replace("tel:", ""), contactType: "customer service", availableLanguage: "fa" })) } : {}),
  };
}

export const websiteLd = (): Json => ({ "@context": "https://schema.org", "@type": "WebSite", "@id": abs("/#website"), name: SITE_NAME, url: abs("/"), inLanguage: "fa-IR", publisher: { "@id": abs("/#organization") } });

export const breadcrumbLd = (items: { name: string; path: string }[]): Json => ({
  "@context": "https://schema.org", "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: abs(it.path) })),
});

/** Intentionally has no "offers": the site has no online checkout, so we do not publish availability or purchase data. */
export const productLd = (p: Product, description: string): Json => ({
  "@context": "https://schema.org", "@type": "Product", name: p.name, description, image: [abs(p.image)], url: abs(`/products/${p.slug}`), sku: p.id, brand: { "@type": "Brand", name: SITE_NAME },
});

export const articleLd = (a: Article): Json => ({
  "@context": "https://schema.org", "@type": "Article", headline: a.title, description: a.excerpt, image: [abs(a.image)], inLanguage: "fa-IR",
  datePublished: a.date, dateModified: a.updatedAt > a.date ? a.updatedAt : a.date,
  mainEntityOfPage: abs(`/articles/${a.slug}`), author: { "@id": abs("/#organization"), "@type": "Organization", name: SITE_NAME }, publisher: { "@id": abs("/#organization") },
});
