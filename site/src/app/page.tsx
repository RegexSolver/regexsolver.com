import { JsonLd } from "@/components/JsonLd";
import { faqJsonLd } from "@/lib/faqs";
import { LandingPage } from "@/views/LandingPage";

export default function Page() {
  return (
    <>
      {/* FAQPage rich-result data, built from the same FAQS the visible
          accordion renders (lib/faqs.tsx). */}
      <JsonLd data={faqJsonLd()} />
      <LandingPage />
    </>
  );
}
