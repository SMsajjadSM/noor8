import Link from "next/link";
import { ProsePage } from "@/components/public/prose-page";
import { BuyCta } from "@/components/public/buy-cta";
import { getSettings } from "@/lib/content/public";
import { pageMeta } from "@/lib/seo/site";

export const metadata = pageMeta({
  title: "درباره ما",
  description: "نور هشتم؛ معرفی حرز امام جواد (ع)، حرز ابی دجانه، بازوبند چرم طبیعی و قاب نقره، با اطلاعات شفاف و راهنمای نگهداری.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <ProsePage title="درباره نور هشتم" crumb="درباره ما" path="/about" intro="نور هشتم محصولات مذهبی و فرهنگی را با اطلاعات کامل و شفاف معرفی می‌کند.">
      <p>در نور هشتم حرز امام جواد (ع) و حرز ابی دجانه را روی پوست آهو و با رعایت آداب کتابت عرضه می‌کنیم. در کنار آن، بازوبند از چرم طبیعی حیوانی، قاب نقره با عیار ۹۲۵ و نماز نیابتی توسط فرد قابل اعتماد در مجموعه محصولات ما قرار دارد.</p>
      <h2>رویکرد ما</h2>
      <ul>
        <li>معرفی روشن هر محصول: جنس، سایز، قیمت و شیوه استفاده</li>
        <li>انتشار مقالات آموزشی درباره پیشینه، آداب کتابت و نگهداری حرزها</li>
        <li>پاسخ‌گویی مستقیم از طریق تماس تلفنی و پیام‌رسان</li>
      </ul>
      <h2>نحوه خرید</h2>
      <p>سایت فعلاً درگاه پرداخت آنلاین ندارد. محصول مورد نظر را در بخش <Link href="/products" className="text-accent underline">محصولات</Link> ببینید و برای ثبت سفارش با ما تماس بگیرید.</p>
      <div className="pt-2"><BuyCta settings={getSettings()} /></div>
    </ProsePage>
  );
}
