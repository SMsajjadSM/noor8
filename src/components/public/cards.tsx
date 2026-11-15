import Link from "next/link";
import Image from "next/image";
import { formatPrice, jalali } from "@/lib/utils/format";
import type { Article, Product } from "@/lib/validation/schemas";

export function ProductCard({ p, unit, priority }: { p: Product; unit: string; priority?: boolean }) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-line bg-surface transition duration-300 hover:-translate-y-1 hover:border-accent/60 hover:shadow-xl">
      <div className="relative aspect-square bg-white">
        <Image src={p.image} alt={p.name} fill priority={priority} sizes="(min-width:1024px) 22vw, (min-width:640px) 45vw, 90vw" className="object-contain p-5 transition duration-500 group-hover:scale-105" />
        {p.tag && <span className="absolute right-3 top-3 rounded-full bg-accent px-3 py-1 text-xs font-medium text-on-accent">{p.tag}</span>}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-bold leading-7"><Link href={`/products/${p.slug}`} className="after:absolute after:inset-0">{p.name}</Link></h3>
        <p className="text-sm leading-7 text-muted">{p.desc}</p>
        <p className="mt-auto pt-3 font-bold text-accent">{p.price > 0 ? formatPrice(p.price, unit) : "تماس بگیرید"}</p>
      </div>
    </article>
  );
}

export function ArticleCard({ a, priority }: { a: Article; priority?: boolean }) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-line bg-surface transition duration-300 hover:-translate-y-1 hover:border-accent/60 hover:shadow-xl">
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image src={a.image} alt={a.title} fill priority={priority} sizes="(min-width:1024px) 45vw, 90vw" className="object-cover transition duration-500 group-hover:scale-105" />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-6">
        <p className="text-xs text-muted"><time dateTime={a.date}>{jalali(a.date)}</time> · {a.readTime.toLocaleString("fa-IR")} دقیقه مطالعه</p>
        <h3 className="text-lg font-bold leading-8"><Link href={`/articles/${a.slug}`} className="after:absolute after:inset-0">{a.title}</Link></h3>
        <p className="text-sm leading-8 text-muted">{a.excerpt}</p>
      </div>
    </article>
  );
}

export function SectionHead({ eyebrow, title, href, linkLabel }: { eyebrow?: string; title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="mb-1 text-sm font-medium text-teal">{eyebrow}</p>}
        <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
      </div>
      {href && <Link href={href} className="shrink-0 text-sm text-accent hover:underline">{linkLabel ?? "مشاهده همه"} ←</Link>}
    </div>
  );
}
