import Link from "next/link";

/** Links to category pages. `current` highlights the active one; "همه" links back to the full list. */
export function CategoryChips({ kind, items, current }: { kind: "products" | "articles"; items: { slug: string; name: string; count: number }[]; current?: string }) {
  if (items.length === 0) return null;
  const chip = (active: boolean) => `rounded-full border px-4 py-1.5 text-sm transition ${active ? "border-accent bg-accent-soft text-accent" : "border-line text-muted hover:border-accent hover:text-text"}`;
  return (
    <nav aria-label="دسته‌بندی‌ها" className="mt-6 flex flex-wrap gap-2">
      <Link href={`/${kind}`} className={chip(!current)} aria-current={!current ? "page" : undefined}>همه</Link>
      {items.map((c) => (
        <Link key={c.slug} href={`/${kind}/category/${c.slug}`} className={chip(c.slug === current)} aria-current={c.slug === current ? "page" : undefined}>
          {c.name} <span className="text-xs opacity-70">({c.count.toLocaleString("fa-IR")})</span>
        </Link>
      ))}
    </nav>
  );
}
