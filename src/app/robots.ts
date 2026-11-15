import type { MetadataRoute } from "next";
import { abs } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  // Staging/test deployments set SITE_NOINDEX=true so they never compete with the real domain.
  if (process.env.SITE_NOINDEX === "true") return { rules: [{ userAgent: "*", disallow: "/" }] };
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api"] }], sitemap: abs("/sitemap.xml"), host: abs("") };
}
