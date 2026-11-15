import { Breadcrumbs } from "@/components/layout/breadcrumbs";

export function ProsePage({ title, crumb, path, intro, children }: { title: string; crumb: string; path: string; intro?: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Breadcrumbs items={[{ name: crumb, path }]} />
      <h1 className="text-3xl font-bold">{title}</h1>
      {intro && <p className="mt-4 text-lg leading-9 text-muted">{intro}</p>}
      <div className="mt-8 space-y-5 leading-9 [&_h2]:pt-4 [&_h2]:text-xl [&_h2]:font-bold [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pr-6 [&_ul]:marker:text-accent">{children}</div>
    </div>
  );
}
