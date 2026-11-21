import type { Metadata } from "next";
import { OG_IMAGE, og } from "@/lib/seo";
import { Privacy } from "@/views/Privacy";

const title = "Privacy policy";
const description =
  "How regexsolver.com and its live demo process personal data, under the Swiss FADP and the EU GDPR.";

// Not indexed, and left out of the sitemap (which IndexNow reads): a legal
// page, not one to land on from a search. Its links are still followed.
export const metadata: Metadata = {
  title,
  description,
  robots: { index: false, follow: true },
  alternates: { canonical: "/privacy/" },
  openGraph: og({ title, description, url: "/privacy/" }),
  twitter: { title, description, images: [OG_IMAGE] },
};

export default function Page() {
  return <Privacy />;
}
