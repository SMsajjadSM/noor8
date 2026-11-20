import { ApiError } from "@/lib/errors";
import { getStore } from "@/lib/store";
import { categoriesSchema, DEFAULT_CATEGORIES, type Categories } from "@/lib/validation/schemas";
import { listItems } from "./service";

const FILE = "data/categories.json";

export async function getCategories(): Promise<Categories> {
  const f = await getStore().readFile(FILE);
  if (!f) return DEFAULT_CATEGORIES;
  const parsed = categoriesSchema.safeParse(JSON.parse(f.text));
  return parsed.success ? parsed.data : DEFAULT_CATEGORIES;
}

/** Saves the whole list. Refuses if any product/article still uses a category that would disappear. */
export async function saveCategories(raw: unknown): Promise<Categories> {
  const next = categoriesSchema.parse(raw);
  const inUse: string[] = [];
  for (const kind of ["products", "articles"] as const) {
    const keep = new Set(next[kind].map((c) => c.slug));
    for (const { item } of (await listItems(kind)).items) {
      if (item.category && !keep.has(item.category)) inUse.push(`${kind === "products" ? "محصول" : "مقاله"}: ${"name" in item ? item.name : item.title} (دسته: ${item.category})`);
    }
  }
  if (inUse.length) throw new ApiError(409, "IN_USE", "برخی دسته‌ها هنوز استفاده می‌شوند؛ ابتدا دسته آن موارد را عوض کنید", inUse);
  await getStore().commit([{ path: FILE, text: JSON.stringify(next, null, 2) + "\n" }], "content: update categories");
  return next;
}
