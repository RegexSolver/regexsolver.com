import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumb, OG_IMAGE, og } from "@/lib/seo";
import { Privacy } from "@/views/Privacy";

const title = "Privacy policy";
const description =
  "How regexsolver.com and its live demo process personal data, under the Swiss FADP and the EU GDPR.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/privacy/" },
  openGraph: og({ title, description, url: "/privacy/" }),
  twitter: { title, description, images: [OG_IMAGE] },
};

export default function Page() {
  return (
    <>
      <JsonLd
        data={breadcrumb([
          { name: "Home", path: "/" },
          { name: title, path: "/privacy/" },
        ])}
      />
      <Privacy />
    </>
  );
}
