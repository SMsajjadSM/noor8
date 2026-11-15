# معماری

## نمای کلی

```
Admin Panel (React, client)
        │ fetch + CSRF header
        ▼
Next.js Route Handlers  (/api/admin/*)  ← session cookie + Zod
        │
        ▼
Store (interface)  ── GitHub store ──► GitHub REST API (Git Data)
        │                                   │
        └─ local store (dev only)           ▼
                                   Branch content-drafts   (ذخیره‌ها)
                                            │  «انتشار» = یک Commit فقط‌محتوا
                                            ▼
                                   Branch main ──► Vercel/Netlify Build ──► سایت عمومی (HTML استاتیک)
```

صفحات عمومی هنگام Build از فایل‌های `data/` خوانده و **استاتیک** تولید می‌شوند. هیچ درخواست GitHub یا دیتابیسی در زمان بازدید کاربر وجود ندارد.

## مدل داده

- `data/products/<id>.json` ، `data/articles/<id>.json` ، `data/settings.json`
- نام فایل = `id` ثابت (slug قابل ویرایش است ولی نام فایل عوض نمی‌شود).
- Schema تنها منبع حقیقت است: `src/lib/validation/schemas.ts` (Zod). هم سرور، هم فرم‌های پنل و هم Build عمومی از آن استفاده می‌کنند؛ فایل نامعتبر Build را متوقف می‌کند.
- مقاله: لیست بلوک‌های `h2 h3 p quote ul ol image`. بلوک جدید = یک خط در `blockSchema` + یک `case` در `ArticleBody`.
- محصول: فیلدهای ساختار قبلی شما + `order` (اختیاری) برای ترتیب نمایش.

## لایه ذخیره‌سازی (`src/lib/store`)

یک interface (`list / readText / readFile / readBinary / commit`). پیاده‌سازی GitHub:

- خواندن: Git Trees (یک درخواست برای کل پوشه) + Blob برای هر فایل.
- نوشتن: `commit(changes[])` همه تغییرها را با **یک** Commit می‌نویسد: Blob (برای تصویر) ← Tree ← Commit ← به‌روزرسانی Ref با `force:false`. در رقابت (422) یک بار دوباره تلاش می‌کند.
- اگر `content-drafts` وجود نداشته باشد از `main` ساخته می‌شود.

پیاده‌سازی محلی فقط در توسعه و فقط با `CONTENT_STORE=local` فعال است.

## انتشار (`src/features/content/publish.ts`)

1. درخت کامل `main` و `content-drafts` گرفته و فقط مسیرهای `data/` و `public/photo/` مقایسه می‌شوند (بر اساس SHA Blob): `added / modified / deleted`.
2. انتخاب کاربر یا «همه» اعمال می‌شود؛ مسیر ناشناخته رد می‌شود.
3. **وابستگی تصویر:** تصاویر تغییرکرده‌ای که فایل‌های انتخاب‌شده به آن‌ها ارجاع دارند خودکار اضافه می‌شوند.
4. **حذف امن:** تصویری که پس از انتشار هنوز در محتوای `main` استفاده می‌شود حذف نمی‌شود (409).
5. یک Commit روی `main` با **استفاده مجدد از همان Blobها** (بدون آپلود دوباره).
6. وضعیت Deploy از GitHub Deployments API برای Commit جدید خوانده می‌شود (Vercel وضعیت را آنجا ثبت می‌کند).
7. `syncDraft` با `POST /merges` تغییرات کد را از `main` به پیش‌نویس می‌آورد.

چرا مقایسه SHA و نه Pull Request؟ ساده، قابل پیش‌بینی، بدون ریسک انتقال کد غیرمحتوایی، و با Commit یکتا؛ هر انتشار یک رکورد روشن در تاریخچه Git است (بازگشت: `git revert`).

## احراز هویت و امنیت

- کوکی `noor8_session`: payload امضاشده HMAC-SHA256 با `SESSION_SECRET`، `HttpOnly`، `SameSite=Strict`، `Secure` در Production، اعتبار ۸ ساعت.
- مقایسه نام کاربری و رمز با هش و `timingSafeEqual`.
- **CSRF:** هر درخواست غیر GET باید هدر `x-csrf-token` (داخل Session) را داشته باشد + بررسی Origin.
- همه ورودی‌ها با Zod؛ مسیر فایل‌ها هرگز از ورودی خام ساخته نمی‌شود (id/slug با regex و تصویر با `imagePathSchema`)؛ پیش‌نمایش تصویر هم فقط مسیرهای معتبر را می‌پذیرد.
- آپلود: تشخیص نوع با magic bytes، سقف ۳ مگابایت، نام بر اساس هش محتوا (تکراری ذخیره نمی‌شود).
- محافظت دو لایه: `src/proxy.ts` (ریدایرکت/401) **و** بررسی Session داخل هر API. صفحات `/admin` به‌صورت `force-dynamic` هستند تا HTML آن‌ها کش CDN نشود. (روی Next 16 پروکسی Node ممکن است پشت کش اجرا شود؛ به همین دلیل امنیت واقعی روی APIهاست.)
- خطاهای داخلی به کاربر نشان داده نمی‌شوند و در لاگ سرور ثبت می‌شوند.

## SEO

- `generateStaticParams` + `dynamicParams=false` برای محصول و مقاله؛ `generateMetadata` با Title/Description/Canonical/OG/Twitter.
- JSON-LD: Organization، WebSite، BreadcrumbList، Article، Product. **Product بدون `offers`** (پرداخت آنلاین ندارد؛ موجودی/امکان خرید جعلی منتشر نمی‌شود).
- `sitemap.ts` و `robots.ts` از داده‌های منتشرشده ساخته می‌شوند. پیش‌نویس‌ها اصلاً Build نمی‌شوند. `/admin` و `/api` با `noindex` و Disallow.
- `SITE_NOINDEX=true` برای سایت آزمایشی.

## تصمیم‌های مهم

- **بدون دیتابیس:** حجم محتوا کم است؛ Git تاریخچه و بازگشت رایگان می‌دهد.
- **حالت ساده برای فایل‌ها:** یک فایل JSON برای هر مورد، تا تعارض ویرایش کمینه شود.
- **بدون کتابخانه ویرایشگر/فرم سنگین:** ویرایشگر بلوکی اختصاصی؛ اعتبارسنجی کلاینت با همان Schema سرور.
