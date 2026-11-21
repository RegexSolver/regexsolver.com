import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumb, OG_IMAGE, og } from "@/lib/seo";
import { sectionBySlug } from "@/lib/sections";
import { SectionPage } from "@/views/SectionPage";

const section = sectionBySlug("regex-analysis");
const url = `/${section.slug}/`;

export const metadata: Metadata = {
  title: section.metaTitle,
  description: section.description,
  alternates: { canonical: url },
  openGraph: og({
    title: section.metaTitle,
    description: section.description,
    url,
  }),
  twitter: {
    title: section.metaTitle,
    description: section.description,
    images: [OG_IMAGE],
  },
};

export default function Page() {
  return (
    <>
      <JsonLd
        data={breadcrumb([
          { name: "Home", path: "/" },
          { name: section.title, path: url },
        ])}
      />
      <SectionPage section={section} />
    </>
  );
}
