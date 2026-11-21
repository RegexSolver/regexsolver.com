import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumb, OG_IMAGE, og } from "@/lib/seo";
import { Pricing } from "@/views/Pricing";

// Breadcrumb / sitelink name. The tab + SERP title is metaTitle: with the
// " | RegexSolver" template it should land at 50-60 chars.
const title = "Pricing";
const metaTitle = "Pricing and plans for the regex operations API";
const description =
  "RegexSolver pricing: the Free plan and its limits, 10,000 requests per month.";

export const metadata: Metadata = {
  title: metaTitle,
  description,
  alternates: { canonical: "/pricing/" },
  openGraph: og({ title: metaTitle, description, url: "/pricing/" }),
  twitter: { title: metaTitle, description, images: [OG_IMAGE] },
};

export default function Page() {
  return (
    <>
      <JsonLd
        data={breadcrumb([
          { name: "Home", path: "/" },
          { name: title, path: "/pricing/" },
        ])}
      />
      <Pricing />
    </>
  );
}
