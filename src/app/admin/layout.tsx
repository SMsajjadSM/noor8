import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "پنل مدیریت", template: "%s | پنل نور هشتم" },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return children;
}
