# نور هشتم (Noor Hashtom)

وب‌سایت معرفی محصولات مذهبی و فرهنگی (حرز امام جواد (ع)، حرز ابی دجانه، بازوبند چرم، قاب نقره و …) با پنل مدیریت اختصاصی.
محتوا در **فایل‌های JSON داخل همین Repository** نگهداری می‌شود؛ بدون دیتابیس و بدون VPS. پنل از طریق GitHub API فایل‌ها را ویرایش می‌کند و Vercel/Netlify سایت را از روی Branch اصلی می‌سازد.

> **سایت فعلاً درگاه پرداخت ندارد.** خرید از راه تماس تلفنی/پیام‌رسان است. شماره‌ها را در «پنل ← تنظیمات» وارد کنید.

## ⚠️ پیش از هر کاری: هزینه و شرایط میزبانی

بررسی آنلاین (آبان ۱۴۰۵ / نوامبر ۲۰۲۶):

| میزبان | پلن رایگان برای سایت تجاری؟ | نکته |
|---|---|---|
| **Vercel Hobby** | ❌ خیر. فقط استفاده شخصی و غیرتجاری | سایتی که محصول یا خدمات تجاری را معرفی می‌کند «تجاری» محسوب می‌شود. پلن Pro حدود ۲۰ دلار در ماه است |
| **Netlify Free** | ✅ بله، با سقف اعتبار ماهانه | با تمام شدن اعتبار، سایت‌ها تا ماه بعد متوقف می‌شوند. پشتیبانی کامل Next 16 باید آزمایش شود |
| **Cloudflare** | ✅ بله | اجرای Next.js نیاز به آداپتر OpenNext دارد؛ با Next 16 و `proxy.ts` آزمایش نشده است |

منابع: [Vercel Fair Use Guidelines](https://vercel.com/docs/limits/fair-use-guidelines)، مقایسه‌های ۲۰۲۶ میزبان‌ها.
پروژه به Vercel قفل نیست (فقط `vercel.json` برای غیرفعال کردن Deploy پیش‌نویس‌ها دارد)، پس می‌توانید بعداً جابه‌جا شوید. **توصیه:** اگر می‌خواهید دقیقاً طبق قوانین عمل کنید، Vercel Pro یا یک Deploy آزمایشی روی Netlify (و بررسی همه قابلیت‌ها) انتخاب منطقی است.

**دسترسی از ایران:** این را نتوانستم بررسی کنم. قبل از انتقال دامنه `noor8.shop.ir`، سایت آزمایشی را از چند اینترنت ایرانی باز کنید (سرعت و فیلترینگ).

## فناوری‌ها

Next.js 16 (App Router) · React 19 · TypeScript Strict · Tailwind CSS 4 · Zod 4 · Lucide · GitHub REST API (Contents + Git Data) · فونت وزیرمتن (self-host).

## اجرای محلی

```bash
npm install
cp .env.example .env.local        # مقادیر را پر کنید
npm run dev                       # http://localhost:3000
```

**بدون GitHub (فقط توسعه):** در `.env.local` مقدار `CONTENT_STORE=local` بگذارید. پنل مستقیم روی فایل‌های پوشه `data/` و `public/photo/` کار می‌کند. این حالت در Production غیرفعال است و «انتشار» در آن کار نمی‌کند.

دستورها: `npm run typecheck` · `npm run lint` · `npm run build` · `npm run test:flow` (راهنما: `docs/TESTING.md`).

## ساختار پوشه‌ها

```
data/products/*.json      هر محصول یک فایل
data/articles/*.json      هر مقاله یک فایل
data/settings.json        واحد قیمت و راه‌های تماس
public/photo/{products,articles}/   تصاویر (WebP)
src/app/(public)/         صفحات عمومی (استاتیک)
src/app/admin/            پنل مدیریت
src/app/api/admin/        APIهای پنل (نیازمند ورود)
src/features/content/     منطق محتوا، رسانه، انتشار
src/lib/{github,store,auth,seo,validation,content}/
src/proxy.ts              محافظت اولیه از /admin و /api/admin
scripts/                  تست جریان انتشار با GitHub ساختگی
docs/                     ARCHITECTURE.md ، TESTING.md
```

## متغیرهای محیطی

| نام | توضیح |
|---|---|
| `GITHUB_TOKEN` | توکن Fine-grained (فقط سمت سرور) |
| `GITHUB_OWNER` / `GITHUB_REPO` | مالک و نام Repository |
| `GITHUB_MAIN_BRANCH` | پیش‌فرض `main` |
| `GITHUB_DRAFT_BRANCH` | پیش‌فرض `content-drafts` |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | ورود تک‌مدیره؛ رمز قوی انتخاب کنید |
| `SESSION_SECRET` | حداقل ۳۲ نویسه تصادفی (مثلاً `openssl rand -base64 48`) |
| `NEXT_PUBLIC_SITE_URL` | آدرس نهایی سایت، بدون `/` انتهایی |
| `SITE_NOINDEX` | `true` روی سایت آزمایشی تا گوگل ایندکسش نکند؛ روی دامنه اصلی خالی بگذارید |

هیچ Secretی در کد یا Repository نیست. `.env.local` در `.gitignore` است.

## تنظیم GitHub

1. یک Repository **خصوصی** بسازید و کد را Push کنید (`main`).
2. توکن: GitHub ← Settings ← Developer settings ← **Fine-grained tokens** ← Generate:
   - Repository access: فقط همین Repository
   - Permissions: **Contents: Read and write** ، **Deployments: Read-only** (برای نمایش وضعیت Deploy)، Metadata: Read-only (خودکار)
   - مدت اعتبار را مشخص کنید و تاریخ تمدید را یادداشت کنید.
3. Branch `main` را **بدون** قانون «الزام Pull Request» نگه دارید؛ انتشار مستقیم روی آن Commit می‌زند.
4. Branch `content-drafts` را نسازید؛ پنل در اولین استفاده خودش از `main` می‌سازد.

## نحوه کار Branchها

- **`content-drafts`**: هر «ذخیره» در پنل یک Commit روی این Branch است. Deploy نمی‌سازد.
- **`main`**: نسخه منتشرشده. «انتشار» فقط فایل‌های محتوایی (`data/` و `public/photo/`) انتخاب‌شده را با **یک Commit** به `main` می‌برد. Vercel/Netlify با Push روی `main` سایت را می‌سازد.
- انتشار بر اساس مقایسه SHA فایل‌هاست؛ پس انتشار مجدد محتوای بدون تغییر ممکن نیست و کد آزمایشی به `main` نمی‌رود.
- اگر کد را روی `main` تغییر دادید، در صفحه «انتشار» روی **هماهنگ‌سازی با main** بزنید تا به پیش‌نویس‌ها برسد. در صورت تعارض، باید در GitHub دستی حل شود.

## استفاده از پنل

آدرس: `/admin` ← ورود با `ADMIN_USERNAME` و `ADMIN_PASSWORD`.

- **محصولات / مقالات:** افزودن، ویرایش، حذف، جست‌وجو، فیلتر، تغییر سریع وضعیت. «ذخیره» فقط پیش‌نویس را به‌روز می‌کند.
- **ویرایشگر مقاله:** بلوک‌های عنوان، زیرعنوان، پاراگراف، فهرست، نقل‌قول و تصویر؛ جابه‌جایی و پیش‌نمایش. Alt تصاویر الزامی است.
- **رسانه:** آپلود (تبدیل خودکار به WebP، حداکثر ۱۶۰۰ پیکسل و ۳ مگابایت). تصویر استفاده‌شده قابل حذف نیست.
- **تنظیمات:** واحد قیمت، تلفن، واتساپ، تلگرام، اینستاگرام، ایمیل، نشانی.
- **انتشار:** موارد تغییرکرده را ببینید، انتخاب کنید و منتشر کنید. وضعیت Deploy نمایش داده می‌شود.

محصول یا مقاله با وضعیت «پیش‌نویس» (`published: false`) حتی بعد از انتشار در سایت عمومی دیده نمی‌شود.

## Deploy روی Vercel (یا میزبان دیگر)

1. Repository را Import کنید. Framework: Next.js (خودکار).
2. همه متغیرهای جدول بالا را در Settings ← Environment Variables وارد کنید.
3. **سایت آزمایشی اول:** `SITE_NOINDEX=true` و `NEXT_PUBLIC_SITE_URL` را آدرس موقت Vercel بگذارید. همه صفحات و پنل را تست کنید (`docs/TESTING.md`).
4. `vercel.json` Deploy روی `content-drafts` را غیرفعال می‌کند. اگر کار نکرد: Settings ← Git ← **Ignored Build Step** با این فرمان:
   `[ "$VERCEL_GIT_COMMIT_REF" != "main" ]`
5. بعد از تأیید، `SITE_NOINDEX` را حذف و `NEXT_PUBLIC_SITE_URL=https://noor8.shop.ir` را تنظیم و Redeploy کنید.

## اتصال دامنه

سایت فعلی را تا پایان تست دست نزنید. بعد: Vercel ← Settings ← Domains ← `noor8.shop.ir` را اضافه کنید و **رکورد DNS را دقیقاً همان‌طور که Vercel نمایش می‌دهد** در پنل DNS دامنه `.ir` وارد کنید. پس از فعال شدن HTTPS، `www` را در صورت نیاز به دامنه اصلی Redirect کنید.

## ثبت در Google Search Console

1. [search.google.com/search-console](https://search.google.com/search-console) ← Add property ← **Domain** یا URL prefix.
2. تأیید مالکیت با رکورد DNS TXT (برای Domain) یا فایل/متا (برای URL prefix).
3. Sitemaps ← `https://noor8.shop.ir/sitemap.xml` را ثبت کنید.
4. با URL Inspection صفحه اصلی را «Request indexing» کنید.

رتبه گوگل تضمین‌شدنی نیست؛ پروژه فقط زیرساخت فنی SEO و محتوای قابل خزش را فراهم می‌کند.

## چک‌لیست قبل از جایگزینی سایت فعلی

- [ ] شماره تماس و پیام‌رسان‌ها در «تنظیمات» وارد و منتشر شده
- [ ] متن «درباره ما»، «شرایط استفاده»، «حریم خصوصی» و شعار صفحه اصلی بازبینی شده (در `src/app/(public)/`)
- [ ] «توضیحات کامل» محصولات ۵ تا ۸ نوشته شده
- [ ] رمز و `SESSION_SECRET` قوی و متفاوت از نمونه‌ها
- [ ] تست دستی GitHub (`docs/TESTING.md` بخش ۲) انجام شده
- [ ] سایت آزمایشی از اینترنت ایران بررسی شده
- [ ] Lighthouse روی سایت Deploy‌شده گرفته شده

## محدودیت‌های شناخته‌شده

- محدودیت تلاش ورود در حافظه است و روی Serverless با Cold Start صفر می‌شود؛ سرعت حدس رمز را کم می‌کند ولی مانع قطعی نیست.
- هر Commit با سرعت GitHub API ذخیره می‌شود (چند ثانیه). برای ده‌ها آیتم لیست‌ها کند می‌شوند؛ تا حدود چند صد آیتم مناسب است.
- Vercel حدود ۴٫۵ مگابایت سقف بدنه درخواست دارد؛ آپلود ۳ مگابایت است.
- اگر دو نفر هم‌زمان یک مورد را ویرایش کنند، دومی پیام تعارض می‌گیرد (بر اساس SHA).
