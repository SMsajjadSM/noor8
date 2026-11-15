import { createHash } from "node:crypto";
import { ApiError } from "@/lib/errors";
import { getStore } from "@/lib/store";
import { imagePathSchema } from "@/lib/validation/schemas";
import { referencedImages } from "./service";

export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
export type Folder = "products" | "articles";

function detectExt(b: Buffer): "webp" | "avif" | "jpg" | "png" | null {
  if (b.length < 16) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") return "webp";
  if (b.toString("ascii", 4, 12) === "ftypavif") return "avif";
  return null;
}

const baseName = (name: string) =>
  name.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "image";

export async function listMedia() {
  const store = getStore();
  const used = await referencedImages();
  const out: { path: string; size: number; usedBy: string[] }[] = [];
  for (const folder of ["products", "articles"] as const) {
    for (const f of await store.list(`public/photo/${folder}`)) {
      const url = f.path.replace(/^public/, "");
      if (imagePathSchema.safeParse(url).success) out.push({ path: url, size: f.size, usedBy: used.get(url) ?? [] });
    }
  }
  return out;
}

/** Content-addressed: same bytes always map to the same file name, so duplicates are never stored twice. */
export async function uploadImage(folder: Folder, originalName: string, data: Buffer) {
  if (data.length > MAX_IMAGE_BYTES) throw new ApiError(413, "TOO_LARGE", "حجم تصویر بیش از ۳ مگابایت است");
  const ext = detectExt(data);
  if (!ext) throw new ApiError(415, "BAD_TYPE", "فقط تصویر WebP، AVIF، JPEG یا PNG مجاز است");
  const hash = createHash("sha1").update(data).digest("hex").slice(0, 8);
  const url = `/photo/${folder}/${baseName(originalName)}-${hash}.${ext}`;
  imagePathSchema.parse(url);
  const path = `public${url}`;
  const store = getStore();
  if (await store.readFile(path)) return { path: url, duplicate: true };
  await store.commit([{ path, base64: data.toString("base64") }], `media: add ${url}`);
  return { path: url, duplicate: false };
}

export async function deleteImage(url: string) {
  imagePathSchema.parse(url);
  const usedBy = (await referencedImages()).get(url);
  if (usedBy?.length) throw new ApiError(409, "IN_USE", "این تصویر در محتوا استفاده شده و حذف نمی‌شود", usedBy);
  const path = `public${url}`;
  if (!(await getStore().readFile(path))) throw new ApiError(404, "NOT_FOUND", "تصویر پیدا نشد");
  await getStore().commit([{ path, remove: true }], `media: delete ${url}`);
}
