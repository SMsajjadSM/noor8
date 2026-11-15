import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Gem, Leaf, ScrollText, ShieldCheck } from "lucide-react";
import { ArticleCard, ProductCard, SectionHead } from "@/components/public/cards";
import { BuyCta } from "@/components/public/buy-cta";
import { getArticles, getProducts, getSettings } from "@/lib/content/public";
import { describe, pageMeta } from "@/lib/seo/site";

export const metadata = pageMeta({
  title: { absolute: "نور هشتم | حرز امام جواد (ع)، حرز ابی دجانه و محصولات مذهبی" },
  description: describe("نور هشتم؛ معرفی و عرضه حرز امام جواد (ع) و حرز ابی دجانه روی پوست آهو، بازوبند چرم طبیعی و قاب نقره، همراه با اطلاعات کامل و مقالات آموزشی."),
  path: "/",
  image: "/photo/articles/herz-imam-javad-cover.webp",
});

const VALUES = [
  { icon: ScrollText, title: "کتابت با رعایت آداب", text: "حرزها روی پوست آهو و با رعایت آداب کتابت نوشته می‌شوند؛ جزئیات هر محصول در صفحه آن آمده است." },
  { icon: Leaf, title: "چرم طبیعی", text: "بازوبندها از چرم طبیعی حیوانی تهیه می‌شوند و در دو سایز متوسط و بزرگ عرضه می‌شوند." },
  { icon: Gem, title: "قاب نقره عیار ۹۲۵", text: "قاب نقره با عیار ۹۲۵ برای نگهداری حرز و ادعیه، در کنار بازوبند یا به‌صورت آویز." },
  { icon: ShieldCheck, title: "اطلاعات شفاف", text: "قیمت و مشخصات هر محصول روشن است و برای سفارش می‌توانید مستقیم با ما گفتگو کنید." },
];

export default function Home() {
  const products = getProducts();
  const settings = getSettings();
  const best = products.filter((p) => p.tag === "پرفروش").slice(0, 4);
  const rest = products.filter((p) => !best.includes(p)).slice(0, 4);
  const articles = getArticles().slice(0, 2);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_85%_10%,color-mix(in_oklab,var(--teal)_22%,transparent),transparent),radial-gradient(50%_50%_at_10%_90%,var(--accent-soft),transparent)]" />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div className="hero-rise space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-1.5 text-sm text-muted"><span className="size-2 rounded-full bg-accent" aria-hidden />حرز و محصولات مذهبی</p>
            <h1 className="text-4xl font-bold leading-[1.5] sm:text-5xl">نور هشتم؛<br /><span className="text-accent">حرز اصیل</span> با رعایت آداب</h1>
            <p className="max-w-xl text-lg leading-9 text-muted">حرز امام جواد (ع) و حرز ابی دجانه روی پوست آهو، بازوبند چرم طبیعی و قاب نقره؛ با توضیح کامل هر محصول و راهنمای درست نگهداری.</p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/products" className="inline-flex h-14 items-center gap-2 rounded-full bg-accent px-8 font-medium text-on-accent transition hover:brightness-110">مشاهده محصولات<ArrowLeft className="size-4" aria-hidden /></Link>
              <BuyCta settings={settings} size="lg" />
            </div>
          </div>
          <div className="hero-rise relative mx-auto w-full max-w-md [animation-delay:.12s]">
            <div aria-hidden className="absolute -inset-4 rounded-t-[999px] rounded-b-[3rem] bg-gradient-to-b from-accent/30 to-teal/20 blur-2xl" />
            <div className="relative aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-[3rem] border border-line shadow-2xl">
              <Image src="/photo/articles/herz-imam-javad-cover.webp" alt="حرز امام جواد (ع) روی پوست، در کنار پارچه سبز و ظروف برنجی" fill priority sizes="(min-width:1024px) 40vw, 90vw" className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Brand intro + values */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="reveal mb-10 max-w-2xl">
          <p className="mb-1 text-sm font-medium text-teal">درباره نور هشتم</p>
          <h2 className="text-2xl font-bold leading-snug sm:text-3xl">محصولاتی که با دقت و اطلاعات کامل معرفی می‌شوند</h2>
          <p className="mt-4 leading-9 text-muted">در نور هشتم تلاش می‌کنیم هر محصول را با مشخصات روشن، قیمت مشخص و توضیح درباره‌ی شیوه‌ی تهیه و نگهداری‌اش معرفی کنیم تا با آگاهی انتخاب کنید.</p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="reveal rounded-3xl border border-line bg-surface p-6">
              <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent"><Icon className="size-6" aria-hidden /></span>
              <h3 className="mb-2 font-bold">{title}</h3>
              <p className="text-sm leading-8 text-muted">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      {best.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12">
          <SectionHead eyebrow="محبوب‌ترین‌ها" title="محصولات پرفروش" href="/products" />
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{best.map((p) => <li key={p.id} className="reveal"><ProductCard p={p} unit={settings.currencyUnit} /></li>)}</ul>
        </section>
      )}

      {rest.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12">
          <SectionHead eyebrow="مجموعه محصولات" title="محصولات منتخب" href="/products" />
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{rest.map((p) => <li key={p.id} className="reveal"><ProductCard p={p} unit={settings.currencyUnit} /></li>)}</ul>
        </section>
      )}

      {articles.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12">
          <SectionHead eyebrow="بخوانید و بشناسید" title="آخرین مقالات" href="/articles" />
          <ul className="grid gap-6 md:grid-cols-2">{articles.map((a) => <li key={a.id} className="reveal"><ArticleCard a={a} /></li>)}</ul>
        </section>
      )}

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="reveal relative overflow-hidden rounded-[2rem] border border-line bg-surface p-8 text-center sm:p-14">
          <div aria-hidden className="absolute inset-0 -z-0 bg-[radial-gradient(60%_80%_at_50%_0%,var(--accent-soft),transparent)]" />
          <div className="relative space-y-5">
            <h2 className="text-2xl font-bold sm:text-3xl">برای سفارش یا مشاوره با ما در ارتباط باشید</h2>
            <p className="mx-auto max-w-xl leading-9 text-muted">سفارش به‌صورت تلفنی یا پیام‌رسان ثبت می‌شود. درباره محصول مناسب خود بپرسید؛ پاسخ‌گوی شما هستیم.</p>
            <div className="flex justify-center"><BuyCta settings={settings} size="lg" /></div>
          </div>
        </div>
      </section>
    </>
  );
}
