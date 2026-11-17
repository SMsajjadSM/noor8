import { Instagram, Mail, MapPin, MessageCircle, Phone, Send } from "lucide-react";
import { ProsePage } from "@/components/public/prose-page";
import { getSettings } from "@/lib/content/public";
import { channels, pageMeta } from "@/lib/seo/site";

export const metadata = pageMeta({
  title: "تماس با ما",
  description: "راه‌های ارتباط با نور هشتم برای مشاوره و ثبت سفارش: تماس تلفنی، واتساپ، تلگرام و اینستاگرام.",
  path: "/contact",
});
const ICON = { phone: Phone, whatsapp: MessageCircle, telegram: Send, instagram: Instagram, email: Mail };

export default function ContactPage() {
  const s = getSettings();
  const ch = channels(s);
  return (
    <ProsePage title="تماس با ما" crumb="تماس با ما" path="/contact" intro="برای مشاوره و ثبت سفارش از یکی از راه‌های زیر با ما در ارتباط باشید.">
      {ch.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-6 text-muted">اطلاعات تماس در حال تکمیل است.</p>
      ) : (
        <ul className="list-none! space-y-3! pr-0!">
          {ch.map((c) => {
            const I = ICON[c.kind];
            const ext = c.kind !== "phone" && c.kind !== "email";
            return (
              <li key={c.kind}>
                <a href={c.href} {...(ext ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 no-underline transition hover:border-accent">
                  <span className="grid size-12 place-items-center rounded-xl bg-accent-soft text-accent"><I className="size-6" aria-hidden /></span>
                  <span><span className="block font-bold">{c.label}</span><span className="block text-muted" dir="ltr">{c.display}</span></span>
                </a>
              </li>
            );
          })}
        </ul>
      )}
      {s.address && <p className="flex items-start gap-3"><MapPin className="mt-2 size-5 shrink-0 text-accent" aria-hidden /><span>{s.address}</span></p>}
    </ProsePage>
  );
}
