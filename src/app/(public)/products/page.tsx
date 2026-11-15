import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ProductCard } from "@/components/public/cards";
import { getProducts, getSettings } from "@/lib/content/public";
import { pageMeta } from "@/lib/seo/site";

export const metadata = pageMeta({
  title: "محصولات | حرز، بازوبند چرم و قاب نقره",
  description: "فهرست محصولات نور هشتم: حرز امام جواد (ع)، حرز ابی دجانه روی پوست آهو، بازوبند چرم طبیعی، قاب نقره عیار ۹۲۵ و نماز نیابتی، با قیمت و توضیح کامل.",
  path: "/products",
});

export default function ProductsPage() {
  const products = getProducts();
  const { currencyUnit } = getSettings();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Breadcrumbs items={[{ name: "محصولات", path: "/products" }]} />
      <h1 className="text-3xl font-bold">محصولات</h1>
      <p className="mt-3 max-w-2xl leading-9 text-muted">همه محصولات نور هشتم با قیمت و توضیح کامل. برای ثبت سفارش، از صفحه هر محصول با ما تماس بگیرید.</p>
      {products.length === 0 ? <p className="mt-10 text-muted">در حال حاضر محصولی برای نمایش وجود ندارد.</p> : (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{products.map((p, i) => <li key={p.id}><ProductCard p={p} unit={currencyUnit} priority={i < 4} /></li>)}</ul>
      )}
    </div>
  );
}
