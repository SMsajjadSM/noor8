import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import { articleSchema, categoriesSchema, DEFAULT_CATEGORIES, DEFAULT_SETTINGS, productSchema, settingsSchema, type Article, type Categories, type Category, type Product, type Settings } from "@/lib/validation/schemas";

/** Build-time readers for the public site. Invalid files fail the build loudly instead of shipping broken pages. */
const dataDir = (...p: string[]) => path.join(/* turbopackIgnore: true */ process.cwd(), "data", ...p);

function readAll<T>(dir: string, parse: (x: unknown) => T): T[] {
  const base = dataDir(dir);
  if (!fs.existsSync(base)) return [];
  return fs.readdirSync(base).filter((f) => f.endsWith(".json")).map((f) => {
    try {
      return parse(JSON.parse(fs.readFileSync(path.join(base, f), "utf8")));
    } catch (e) {
      throw new Error(`data/${dir}/${f} نامعتبر است: ${(e as Error).message}`);
    }
  });
}

export const getProducts = cache((): Product[] =>
  readAll("products", (x) => productSchema.parse(x)).filter((p) => p.published).sort((a, b) => a.order - b.order || b.updatedAt.localeCompare(a.updatedAt)),
);
export const getArticles = cache((): Article[] =>
  readAll("articles", (x) => articleSchema.parse(x)).filter((a) => a.published).sort((a, b) => b.date.localeCompare(a.date)),
);
export const getProduct = (slug: string) => getProducts().find((p) => p.slug === slug);
export const getArticle = (slug: string) => getArticles().find((a) => a.slug === slug);

export const getSettings = cache((): Settings => {
  const f = dataDir("settings.json");
  if (!fs.existsSync(f)) return DEFAULT_SETTINGS;
  return settingsSchema.parse({ ...DEFAULT_SETTINGS, ...JSON.parse(fs.readFileSync(f, "utf8")) });
});

export const getCategories = cache((): Categories => {
  const f = dataDir("categories.json");
  if (!fs.existsSync(f)) return DEFAULT_CATEGORIES;
  return categoriesSchema.parse(JSON.parse(fs.readFileSync(f, "utf8")));
});
export const getCategory = (kind: "products" | "articles", slug: string | null | undefined): Category | undefined =>
  slug ? getCategories()[kind].find((c) => c.slug === slug) : undefined;

/** Categories that have at least one published item, with those items. Unknown/removed category slugs are ignored. */
export const productCategories = () =>
  getCategories().products.map((category) => ({ category, items: getProducts().filter((p) => p.category === category.slug) })).filter((x) => x.items.length > 0);
export const articleCategories = () =>
  getCategories().articles.map((category) => ({ category, items: getArticles().filter((a) => a.category === category.slug) })).filter((x) => x.items.length > 0);

/** Thin category pages (fewer items than this) are kept out of Google: noindex + not in the sitemap. */
export const MIN_INDEXABLE_CATEGORY = 2;
