"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { FileText, Images, LayoutDashboard, LogOut, Menu, Package, Rocket, Settings, X } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { api } from "@/lib/admin/api";
import { ToastProvider } from "./ui";

const NAV = [
  { href: "/admin/dashboard", label: "داشبورد", icon: LayoutDashboard },
  { href: "/admin/products", label: "محصولات", icon: Package },
  { href: "/admin/articles", label: "مقالات", icon: FileText },
  { href: "/admin/media", label: "رسانه", icon: Images },
  { href: "/admin/publish", label: "انتشار", icon: Rocket },
  { href: "/admin/settings", label: "تنظیمات", icon: Settings },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await api("POST", "/api/admin/auth/logout").catch(() => {});
    router.replace("/admin/login");
  }

  const nav = (
    <nav aria-label="منوی مدیریت" className="flex flex-1 flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = path === href || path.startsWith(href + "/");
        return (
          <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${active ? "bg-accent-soft font-semibold text-accent" : "text-muted hover:bg-surface-2 hover:text-text"}`}>
            <Icon className="size-5" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <ToastProvider>
      <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_1fr]">
        <aside className="sticky top-0 hidden h-dvh flex-col gap-6 border-l border-line bg-surface p-4 lg:flex">
          <Brand />
          {nav}
          <Footer onLogout={logout} />
        </aside>

        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface/90 px-4 py-3 backdrop-blur lg:hidden">
          <Brand compact />
          <button type="button" aria-label="باز کردن منو" aria-expanded={open} onClick={() => setOpen(true)} className="grid size-10 place-items-center rounded-lg border border-line"><Menu className="size-5" /></button>
        </header>
        {open && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button type="button" aria-label="بستن منو" className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
            <div className="absolute inset-y-0 right-0 flex w-72 flex-col gap-6 bg-surface p-4 animate-[pop_.18s_ease-out]">
              <div className="flex items-center justify-between"><Brand compact /><button type="button" aria-label="بستن منو" onClick={() => setOpen(false)}><X className="size-5" /></button></div>
              {nav}
              <Footer onLogout={logout} />
            </div>
          </div>
        )}

        <main className="mx-auto w-full max-w-6xl p-4 sm:p-8">{children}</main>
      </div>
    </ToastProvider>
  );
}

function Brand({ compact }: { compact?: boolean }) {
  return (
    <Link href="/admin/dashboard" className="flex items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.webp" alt="" width={compact ? 32 : 44} height={compact ? 34 : 47} />
      <span className="leading-tight"><span className="block font-bold">نور هشتم</span><span className="block text-xs text-muted">پنل مدیریت</span></span>
    </Link>
  );
}

function Footer({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="flex items-center justify-between border-t border-line pt-4">
      <ThemeToggle />
      <button type="button" onClick={onLogout} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface-2 hover:text-text"><LogOut className="size-4" aria-hidden />خروج</button>
    </div>
  );
}
