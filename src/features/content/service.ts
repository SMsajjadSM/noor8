import { randomBytes } from "node:crypto";
import { ApiError } from "@/lib/errors";
import { getStore } from "@/lib/store";
import { pool, today } from "@/lib/utils/misc";
import {
  articleInputSchema, articleSchema, productInputSchema, productSchema, slugSchema,
  type Article, type Product,
} from "@/lib/validation/schemas";

export type Kind = "products" | "articles";
export type ItemOf<K extends Kind> = K extends "products" ? Product : Article;
type AnyItem = Product | Article;

const CFG = {
  products: { dir: "data/products", prefix: "p", label: "محصول", schema: productSchema, input: productInputSchema },
  articles: { dir: "data/articles", prefix: "a", label: "مقاله", schema: articleSchema, input: articleInputSchema },
} as const;

const fileOf = (kind: Kind, id: string) => `${CFG[kind].dir}/${id}.json`;
const serialize = (item: AnyItem) => JSON.stringify(item, null, 2) + "\n";

export async function listItems<K extends Kind>(kind: K) {
  const store = getStore();
  const entries = (await store.list(CFG[kind].dir)).filter((e) => e.path.endsWith(".json"));
  const items: { item: ItemOf<K>; sha: string }[] = [];
  const invalid: string[] = [];
  await pool(entries, 8, async (e) => {
    try {
      const parsed = CFG[kind].schema.safeParse(JSON.parse(await store.readText(e)));
      if (parsed.success) items.push({ item: parsed.data as ItemOf<K>, sha: e.sha });
      else invalid.push(e.path);
    } catch {
      invalid.push(e.path);
    }
  });
  items.sort((a, b) => b.item.updatedAt.localeCompare(a.item.updatedAt) || a.item.id.localeCompare(b.item.id));
  return { items, invalid };
}

export async function getItem<K extends Kind>(kind: K, id: string) {
  slugSchema.parse(id);
  const file = await getStore().readFile(fileOf(kind, id));
  if (!file) throw new ApiError(404, "NOT_FOUND", `${CFG[kind].label} پیدا نشد`);
  return { item: CFG[kind].schema.parse(JSON.parse(file.text)) as ItemOf<K>, sha: file.sha };
}

async function assertSlugFree(kind: Kind, slug: string, exceptId?: string) {
  const { items } = await listItems(kind);
  if (items.some((x) => x.item.slug === slug && x.item.id !== exceptId)) {
    throw new ApiError(409, "SLUG_TAKEN", "این آدرس (slug) قبلاً استفاده شده است");
  }
}

export async function createItem<K extends Kind>(kind: K, raw: unknown) {
  const input = CFG[kind].input.parse(raw);
  await assertSlugFree(kind, input.slug);
  const now = today();
  const item = { ...input, id: `${CFG[kind].prefix}-${randomBytes(4).toString("hex")}`, createdAt: now, updatedAt: now } as AnyItem;
  CFG[kind].schema.parse(item);
  await getStore().commit([{ path: fileOf(kind, item.id), text: serialize(item) }], `content: add ${kind}/${item.id}`);
  return item as ItemOf<K>;
}

export async function updateItem<K extends Kind>(kind: K, id: string, raw: unknown, baseSha?: string) {
  const input = CFG[kind].input.parse(raw);
  const { item: existing, sha } = await getItem(kind, id);
  if (baseSha && baseSha !== sha) {
    throw new ApiError(409, "CONFLICT", "این مورد در جای دیگری ویرایش شده است. صفحه را تازه کنید.");
  }
  if (input.slug !== existing.slug) await assertSlugFree(kind, input.slug, id);
  const next = { ...existing, ...input, id, createdAt: existing.createdAt, updatedAt: existing.updatedAt } as AnyItem;
  if (serialize(next) === serialize(existing)) return { item: existing, changed: false };
  next.updatedAt = today();
  CFG[kind].schema.parse(next);
  await getStore().commit([{ path: fileOf(kind, id), text: serialize(next) }], `content: update ${kind}/${id}`);
  return { item: next as ItemOf<K>, changed: true };
}

export async function deleteItem(kind: Kind, id: string) {
  await getItem(kind, id);
  await getStore().commit([{ path: fileOf(kind, id), remove: true }], `content: delete ${kind}/${id}`);
}

/** Every image path referenced by any product or article (draft state). */
export async function referencedImages(): Promise<Map<string, string[]>> {
  const used = new Map<string, string[]>();
  const add = (img: string, by: string) => used.set(img, [...(used.get(img) ?? []), by]);
  for (const { item } of (await listItems("products")).items) add(item.image, `محصول: ${item.name}`);
  for (const { item } of (await listItems("articles")).items) {
    add(item.image, `مقاله: ${item.title}`);
    for (const b of item.content) if (b.type === "image") add(b.src, `مقاله: ${item.title}`);
  }
  return used;
}
