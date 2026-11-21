import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumb, OG_IMAGE, og } from "@/lib/seo";
import { DemoPage } from "@/views/DemoPage";

// Breadcrumb / sitelink name. The tab + SERP title is metaTitle: with the
// " | RegexSolver" template it should land at 50-60 chars.
const title = "Live Demo";
const metaTitle = "Live Demo: try regex set operations online";
const description =
  "Try RegexSolver in your browser: intersect, subtract and compare regex patterns, count matches, generate strings.";

export const metadata: Metadata = {
  title: metaTitle,
  description,
  alternates: { canonical: "/demo/" },
  openGraph: og({ title: metaTitle, description, url: "/demo/" }),
  twitter: { title: metaTitle, description, images: [OG_IMAGE] },
};

export default function Page() {
  return (
    <>
      <JsonLd
        data={breadcrumb([
          { name: "Home", path: "/" },
          { name: title, path: "/demo/" },
        ])}
      />
      <DemoPage />
    </>
  );
}
