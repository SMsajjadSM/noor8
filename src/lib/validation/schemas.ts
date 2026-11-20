import { z } from "zod";

export const slugSchema = z
  .string()
  .min(2, "حداقل ۲ نویسه")
  .max(80, "حداکثر ۸۰ نویسه")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "فقط حروف کوچک انگلیسی، عدد و خط تیره");
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "قالب تاریخ باید YYYY-MM-DD باشد");
export const imagePathSchema = z
  .string()
  .regex(/^\/photo\/(products|articles)\/[a-z0-9][a-z0-9-]*\.(webp|avif|jpg|png)$/, "مسیر تصویر نامعتبر است");

/* ---- Article blocks (extend here to add new block types) ---- */
const text = <T extends string>(t: T) =>
  z.object({ type: z.literal(t), text: z.string().trim().min(1, "متن خالی است").max(20000) });
const list = <T extends string>(t: T) =>
  z.object({ type: z.literal(t), items: z.array(z.string().trim().min(1).max(5000)).min(1).max(100) });

export const blockSchema = z.discriminatedUnion("type", [
  text("h2"),
  text("h3"),
  text("p"),
  text("quote"),
  list("ul"),
  list("ol"),
  z.object({
    type: z.literal("image"),
    src: imagePathSchema,
    alt: z.string().trim().min(1, "متن جایگزین تصویر الزامی است").max(200),
    caption: z.string().trim().max(300).optional(),
  }),
]);
export type Block = z.infer<typeof blockSchema>;

/* ---- Product ---- */
export const productSchema = z.object({
  id: slugSchema,
  slug: slugSchema,
  name: z.string().trim().min(2).max(150),
  desc: z.string().trim().max(300),
  price: z.number().int().min(0).max(10_000_000_000),
  icon: z.string().trim().min(1).max(30),
  image: imagePathSchema,
  tag: z.string().trim().max(30).nullable(),
  /** Slug of a category from data/categories.json (optional). */
  category: slugSchema.nullable().default(null),
  details: z.string().max(20000),
  /** Display order in listings (lower first). Optional; defaults to 100. */
  order: z.number().int().min(0).max(9999).default(100),
  published: z.boolean(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});
export type Product = z.infer<typeof productSchema>;

/* ---- Article ---- */
export const articleSchema = z.object({
  id: slugSchema,
  slug: slugSchema,
  title: z.string().trim().min(3).max(200),
  excerpt: z.string().trim().min(3).max(400),
  date: dateSchema,
  readTime: z.number().int().min(1).max(120),
  image: imagePathSchema,
  category: slugSchema.nullable().default(null),
  content: z.array(blockSchema).min(1).max(500),
  published: z.boolean(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});
export type Article = z.infer<typeof articleSchema>;

const server = { id: true, createdAt: true, updatedAt: true } as const;
export const productInputSchema = productSchema.omit(server);
export const articleInputSchema = articleSchema.omit(server);

export const loginSchema = z.object({ username: z.string().min(1).max(100), password: z.string().min(1).max(200) });

export const publishSchema = z.object({
  paths: z.union([z.literal("all"), z.array(z.string().max(300)).min(1).max(500)]),
});

/* ---- Site settings ---- */
/** Optional full https link (e.g. a Bale or Eitaa channel). Rejects other schemes such as javascript:. */
const httpsLink = z.string().trim().max(300).refine((v) => v === "" || /^https:\/\/[^\s]+$/.test(v), "لینک کامل باشد و با https:// شروع شود").default("");
export const settingsSchema = z.object({
  currencyUnit: z.string().trim().min(1, "واحد قیمت الزامی است").max(20),
  phone: z.string().trim().max(30),
  phoneLabel: z.string().trim().max(40).default(""),
  phone2: z.string().trim().max(30).default(""),
  phone2Label: z.string().trim().max(40).default(""),
  whatsapp: z.string().trim().max(30),
  telegram: z.string().trim().max(100),
  instagram: z.string().trim().max(100),
  bale: httpsLink,
  eitaa: httpsLink,
  email: z.union([z.literal(""), z.email("ایمیل معتبر نیست")]),
  address: z.string().trim().max(300),
});
export type Settings = z.infer<typeof settingsSchema>;
export const DEFAULT_SETTINGS: Settings = { currencyUnit: "تومان", phone: "", phoneLabel: "", phone2: "", phone2Label: "", whatsapp: "", telegram: "", instagram: "", bale: "", eitaa: "", email: "", address: "" };

/* ---- Categories (separate lists for products and articles) ---- */
export const categorySchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(2, "حداقل ۲ نویسه").max(60, "حداکثر ۶۰ نویسه"),
  description: z.string().trim().max(300, "حداکثر ۳۰۰ نویسه").default(""),
});
export type Category = z.infer<typeof categorySchema>;
const uniqueSlugs = (a: Category[]) => new Set(a.map((c) => c.slug)).size === a.length;
const categoryList = z.array(categorySchema).max(30).refine(uniqueSlugs, "آدرس (slug) دسته‌ها باید یکتا باشد").default([]);
export const categoriesSchema = z.object({ products: categoryList, articles: categoryList });
export type Categories = z.infer<typeof categoriesSchema>;
export const DEFAULT_CATEGORIES: Categories = { products: [], articles: [] };
