import Link from "next/link";
import Image from "next/image";
import { Instagram, Mail, Megaphone, MessageCircle, MessagesSquare, Phone, Send } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getSettings } from "@/lib/content/public";
import { channels, isExternal, isPhone, isTextLink, SITE_NAME } from "@/lib/seo/site";
import { MobileNav } from "./mobile-nav";

export const NAV = [
  { href: "/", label: "خانه" },
  { href: "/products", label: "محصولات" },
  { href: "/articles", label: "مقالات" },
  { href: "/about", label: "درباره ما" },
  { href: "/contact", label: "تماس با ما" },
];
const ICON = { phone: Phone, phone2: Phone, whatsapp: MessageCircle, telegram: Send, instagram: Instagram, bale: MessagesSquare, eitaa: Megaphone, email: Mail };

export function SiteShell({ children }: { children: React.ReactNode }) {
  const settings = getSettings();
  const ch = channels(settings);
  const phone = ch.find((c) => c.kind === "phone");
  const year = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { year: "numeric" }).format(new Date());

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:right-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-on-accent">پرش به محتوا</a>
      <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
          <Link href="/" className="flex items-center gap-2.5" aria-label={`${SITE_NAME} - صفحه اصلی`}>
            <Image src="/logo.webp" alt="" width={36} height={39} priority />
            <span className="text-lg font-bold">{SITE_NAME}</span>
          </Link>
          <nav aria-label="منوی اصلی" className="mr-6 hidden items-center gap-1 md:flex">
            {NAV.map((n) => <Link key={n.href} href={n.href} className="rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-surface-2 hover:text-text">{n.label}</Link>)}
          </nav>
          <div className="mr-auto flex items-center gap-2">
            <Link href={phone?.href ?? "/contact"} className="hidden h-10 items-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-on-accent transition hover:brightness-110 sm:inline-flex"><Phone className="size-4" aria-hidden />{phone ? "تماس برای خرید" : "ارتباط با ما"}</Link>
            <ThemeToggle />
            <MobileNav items={NAV} />
          </div>
        </div>
      </header>

      <main id="main">{children}</main>

      <footer className="mt-24 border-t border-line bg-surface">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1.3fr_1fr_1fr]">
          <div className="space-y-4">
            <div className="flex items-center gap-3"><Image src="/logo.webp" alt="" width={44} height={47} /><span className="text-xl font-bold">{SITE_NAME}</span></div>
            <p className="max-w-sm text-sm leading-8 text-muted">معرفی و عرضه حرز، بازوبند چرم طبیعی، قاب نقره و محصولات مذهبی و فرهنگی، همراه با اطلاعات کامل درباره هر محصول.</p>
          </div>
          <nav aria-label="پیوندهای سایت"><h2 className="mb-4 font-bold">دسترسی سریع</h2>
            <ul className="space-y-2 text-sm text-muted">{[...NAV.slice(1), { href: "/terms", label: "شرایط استفاده و سفارش" }, { href: "/privacy", label: "حریم خصوصی" }].map((n) => <li key={n.href}><Link href={n.href} className="hover:text-accent">{n.label}</Link></li>)}</ul>
          </nav>
          <div><h2 className="mb-4 font-bold">ارتباط با ما</h2>
            {ch.length ? (
              <ul className="space-y-3 text-sm text-muted">
                {ch.map((c) => { const I = ICON[c.kind]; return <li key={c.kind}><a href={c.href} {...(isExternal(c) ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="flex items-center gap-2 hover:text-accent"><I className="size-4" aria-hidden />{(isPhone(c) || isTextLink(c)) && <span>{c.label}{isPhone(c) ? ":" : ""}</span>}{!isTextLink(c) && <span dir="ltr">{c.display}</span>}</a></li>; })}
              </ul>
            ) : <p className="text-sm text-muted">برای سفارش از صفحه <Link href="/contact" className="text-accent underline">تماس با ما</Link> استفاده کنید.</p>}
          </div>
        </div>
        <div className="border-t border-line py-5 text-center text-xs text-muted">© {year} {SITE_NAME}. همه حقوق محفوظ است.</div>
      </footer>
    </>
  );
}
