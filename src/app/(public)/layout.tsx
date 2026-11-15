import { JsonLd } from "@/components/layout/json-ld";
import { SiteShell } from "@/components/layout/site-shell";
import { getSettings } from "@/lib/content/public";
import { organizationLd, websiteLd } from "@/lib/seo/schema";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <SiteShell>
      <JsonLd data={[organizationLd(getSettings()), websiteLd()]} />
      {children}
    </SiteShell>
  );
}
