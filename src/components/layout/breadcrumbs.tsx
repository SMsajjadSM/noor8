import Link from "next/link";
import { breadcrumbLd } from "@/lib/seo/schema";
import { JsonLd } from "./json-ld";

export function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  const all = [{ name: "خانه", path: "/" }, ...items];
  return (
    <nav aria-label="مسیر صفحه" className="mb-6 text-sm text-muted">
      <JsonLd data={breadcrumbLd(all)} />
      <ol className="flex flex-wrap items-center gap-2">
        {all.map((it, i) => (
          <li key={it.path} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden>/</span>}
            {i === all.length - 1 ? <span aria-current="page" className="text-text">{it.name}</span> : <Link href={it.path} className="hover:text-accent">{it.name}</Link>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
