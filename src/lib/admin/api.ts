export class ApiFail extends Error {
  constructor(message: string, public code: string, public details?: { path: string; message: string }[] | string[]) {
    super(message);
  }
}

let csrf: string | null = null;
const toLogin = () => {
  if (typeof window !== "undefined") window.location.assign("/admin/login");
};

async function csrfToken(): Promise<string> {
  if (csrf) return csrf;
  const r = await fetch("/api/admin/auth/session");
  if (r.status === 401) {
    toLogin();
    throw new ApiFail("ابتدا وارد شوید", "UNAUTHORIZED");
  }
  csrf = ((await r.json()) as { data: { csrf: string } }).data.csrf;
  return csrf;
}
export const resetCsrf = () => void (csrf = null);

export async function api<T>(method: string, url: string, body?: unknown): Promise<T> {
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const headers: Record<string, string> = {};
  if (method !== "GET") headers["x-csrf-token"] = await csrfToken();
  if (body !== undefined && !isForm) headers["Content-Type"] = "application/json";
  let res: Response;
  try {
    res = await fetch(url, { method, headers, body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body) });
  } catch {
    throw new ApiFail("ارتباط با سرور برقرار نشد. اینترنت را بررسی کنید", "NETWORK");
  }
  const json = (await res.json().catch(() => null)) as { ok: boolean; data?: T; error?: { code: string; message: string; details?: never } } | null;
  if (res.status === 401) {
    toLogin();
    throw new ApiFail("ابتدا وارد شوید", "UNAUTHORIZED");
  }
  if (!json || !json.ok) throw new ApiFail(json?.error?.message ?? "خطای ناشناخته", json?.error?.code ?? "UNKNOWN", json?.error?.details);
  return json.data as T;
}

export const adminImg = (path: string) => `/api/admin/media/file?path=${encodeURIComponent(path)}`;

/** Resize and convert to WebP in the browser to stay well under the upload limit. */
export async function compressImage(file: File, maxSide = 1600): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/avif") return file;
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")?.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.82));
  if (!blob || blob.type !== "image/webp") return file;
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp" });
}
