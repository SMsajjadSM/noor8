import type { Metadata, Viewport } from "next";
import "./globals.css";
import { themeScript } from "@/lib/utils/theme-script";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://noor8.shop.ir";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "نور هشتم", template: "%s | نور هشتم" },
  description: "معرفی و عرضه حرز و محصولات مذهبی و فرهنگی نور هشتم",
  openGraph: { locale: "fa_IR", type: "website", siteName: "نور هشتم" },
  ...(process.env.SITE_NOINDEX === "true" ? { robots: { index: false, follow: false } } : {}),
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f3" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1311" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
