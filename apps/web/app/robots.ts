import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// Search engines may read the public pages. The app itself and the API sit
// behind a sign in, so there is nothing there for them to index.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { allow: "/", disallow: ["/api/", "/dashboard/"], userAgent: "*" },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
