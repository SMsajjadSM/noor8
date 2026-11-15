import { ApiError } from "@/lib/errors";
import { ok, route } from "@/lib/api/route";
import { deleteImage, listMedia, uploadImage, type Folder } from "@/features/content/media";

export const GET = route(async () => ok(await listMedia()));

export const POST = route(async (req) => {
  const form = await req.formData();
  const file = form.get("file");
  const folder = form.get("folder");
  if (!(file instanceof File)) throw new ApiError(400, "NO_FILE", "فایلی ارسال نشده است");
  if (folder !== "products" && folder !== "articles") throw new ApiError(400, "BAD_FOLDER", "پوشه نامعتبر است");
  return ok(await uploadImage(folder as Folder, file.name, Buffer.from(await file.arrayBuffer())), 201);
});

export const DELETE = route(async (req) => {
  const path = new URL(req.url).searchParams.get("path") ?? "";
  await deleteImage(path);
  return ok({ deleted: true });
});
