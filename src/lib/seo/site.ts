import type { Metadata } from "next";
import type { Settings } from "@/lib/validation/schemas";

export const SITE_NAME = "نور هشتم";
export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "https://noor8.shop.ir").replace(/\/$/, "");
export const abs = (p: string) => `${siteUrl()}${p}`;

/** Clean a long text into a meta description (<= 160 chars, whole words). */
export function describe(text: string, max = 158) {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return t.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

export function pageMeta(o: { title: string | { absolute: string }; description: string; path: string; image?: string; type?: "website" | "article"; publishedTime?: string; modifiedTime?: string }): Metadata {
  const plain = typeof o.title === "string" ? o.title : o.title.absolute;
  const images = o.image ? [{ url: o.image }] : undefined;
  return {
    title: o.title,
    description: o.description,
    alternates: { canonical: o.path },
    openGraph: { title: plain, description: o.description, url: o.path, type: o.type ?? "website", locale: "fa_IR", siteName: SITE_NAME, images, publishedTime: o.publishedTime, modifiedTime: o.modifiedTime },
    twitter: { card: images ? "summary_large_image" : "summary", title: plain, description: o.description, images: o.image ? [o.image] : undefined },
  };
}

/* ---- Contact channels from settings ---- */
export type Channel = { kind: "phone" | "phone2" | "whatsapp" | "telegram" | "instagram" | "bale" | "eitaa" | "email"; label: string; href: string; display: string };
const digits = (s: string) => s.replace(/\D/g, "");
export const telHref = (phone: string) => { const d = digits(phone); return `tel:${d.startsWith("0") ? "+98" + d.slice(1) : d.startsWith("98") ? "+" + d : d}`; };

export function channels(s: Settings): Channel[] {
  const out: Channel[] = [];
  if (s.phone) out.push({ kind: "phone", label: s.phoneLabel ? `تماس با ${s.phoneLabel}` : "تماس تلفنی", href: telHref(s.phone), display: s.phone });
  if (s.phone2) out.push({ kind: "phone2", label: s.phone2Label ? `تماس با ${s.phone2Label}` : "تماس تلفنی دوم", href: telHref(s.phone2), display: s.phone2 });
  if (s.whatsapp) out.push({ kind: "whatsapp", label: "واتساپ", href: `https://wa.me/${digits(s.whatsapp)}`, display: s.whatsapp });
  if (s.telegram) out.push({ kind: "telegram", label: "تلگرام", href: `https://t.me/${s.telegram.replace(/^@/, "")}`, display: `@${s.telegram.replace(/^@/, "")}` });
  if (s.instagram) out.push({ kind: "instagram", label: "اینستاگرام", href: `https://instagram.com/${s.instagram.replace(/^@/, "")}`, display: `@${s.instagram.replace(/^@/, "")}` });
  if (s.bale) out.push({ kind: "bale", label: "بله", href: s.bale, display: "مشاهده در بله" });
  if (s.eitaa) out.push({ kind: "eitaa", label: "کانال ایتا", href: s.eitaa, display: "مشاهده در ایتا" });
  if (s.email) out.push({ kind: "email", label: "ایمیل", href: `mailto:${s.email}`, display: s.email });
  return out;
}

export const isPhone = (c: Channel) => c.kind === "phone" || c.kind === "phone2";
/** Opens in a new tab: everything except phone calls and email. */
export const isExternal = (c: Channel) => !isPhone(c) && c.kind !== "email";
/** Link buttons whose display text is Persian words rather than a number/handle. */
export const isTextLink = (c: Channel) => c.kind === "bale" || c.kind === "eitaa";
