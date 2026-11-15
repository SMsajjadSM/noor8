"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function MobileNav({ items }: { items: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button type="button" aria-label={open ? "بستن منو" : "باز کردن منو"} aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(!open)} className="grid size-10 place-items-center rounded-full border border-line text-muted">
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>
      {open && (
        <nav id="mobile-menu" aria-label="منوی موبایل" className="absolute inset-x-0 top-16 border-b border-line bg-bg px-4 py-3 shadow-lg animate-[pop_.18s_ease-out]">
          <ul className="space-y-1">{items.map((n) => <li key={n.href}><Link href={n.href} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-3 hover:bg-surface-2">{n.label}</Link></li>)}</ul>
        </nav>
      )}
    </div>
  );
}
