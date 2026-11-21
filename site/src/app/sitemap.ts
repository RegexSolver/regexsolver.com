import type { MetadataRoute } from "next";
import { IS_PROD_SITE, SITE_URL } from "@/lib/seo";

export const dynamic = "force-static";

const ROUTES: { path: string; priority: number }[] = [
  { path: "", priority: 1 },
  { path: "/demo", priority: 0.8 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  if (!IS_PROD_SITE) return [];

  return ROUTES.map(({ path, priority }) => ({
    url: `${SITE_URL}${path}/`,
    changeFrequency: "monthly",
    priority,
  }));
}
