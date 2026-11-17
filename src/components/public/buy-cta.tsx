import Link from "next/link";
import { MessageCircle, Phone } from "lucide-react";
import { channels } from "@/lib/seo/site";
import type { Settings } from "@/lib/validation/schemas";

/** There is no online checkout: buying happens by phone / messenger. Falls back to the contact page until channels are set. */
export function BuyCta({ settings, productName, size = "md" }: { settings: Settings; productName?: string; size?: "md" | "lg" }) {
  const ch = channels(settings);
  const phone = ch.find((c) => c.kind === "phone");
  const phone2 = ch.find((c) => c.kind === "phone2");
  const wa = ch.find((c) => c.kind === "whatsapp");
  const h = size === "lg" ? "h-14 px-8 text-base" : "h-12 px-6 text-sm";
  const text = productName ? `?text=${encodeURIComponent(`سلام، درباره «${productName}» سؤال دارم`)}` : "";
  return (
    <div className="flex flex-wrap gap-3">
      <Link href={phone?.href ?? "/contact"} className={`inline-flex items-center gap-2 rounded-full bg-accent font-medium text-on-accent transition hover:brightness-110 ${h}`}><Phone className="size-4" aria-hidden />{phone ? (phone2 ? phone.label : "تماس برای خرید") : "راه‌های ارتباط و خرید"}</Link>
      {phone2 && <a href={phone2.href} className={`inline-flex items-center gap-2 rounded-full border border-line bg-surface font-medium transition hover:border-accent ${h}`}><Phone className="size-4" aria-hidden />{phone2.label}</a>}
      {wa && <a href={wa.href + text} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2 rounded-full border border-line bg-surface font-medium transition hover:border-accent ${h}`}><MessageCircle className="size-4" aria-hidden />واتساپ</a>}
    </div>
  );
}
