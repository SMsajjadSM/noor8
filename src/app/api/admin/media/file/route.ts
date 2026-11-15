import { ApiError } from "@/lib/errors";
import { route } from "@/lib/api/route";
import { getStore } from "@/lib/store";
import { imagePathSchema } from "@/lib/validation/schemas";

const TYPES: Record<string, string> = { webp: "image/webp", avif: "image/avif", jpg: "image/jpeg", png: "image/png" };

/** Serves an image from the DRAFT branch so the panel can preview images that are not published yet. */
export const GET = route(async (req) => {
  const p = imagePathSchema.parse(new URL(req.url).searchParams.get("path"));
  const data = await getStore().readBinary(`public${p}`);
  if (!data) throw new ApiError(404, "NOT_FOUND", "تصویر پیدا نشد");
  return new Response(new Uint8Array(data), {
    headers: { "Content-Type": TYPES[p.split(".").pop() as string] ?? "application/octet-stream", "Cache-Control": "private, max-age=300", "X-Content-Type-Options": "nosniff" },
  });
});
