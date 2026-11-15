import { AdminShell } from "@/components/admin/shell";

// Never cache admin HTML at the CDN: the proxy and session checks must run on every request.
export const dynamic = "force-dynamic";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
