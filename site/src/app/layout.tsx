import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ui/ThemeContext";
import { CookieBanner } from "@/components/CookieBanner";
import { IS_PROD_SITE, OG_IMAGE, SITE_URL, og } from "@/lib/seo";
import ReactDOM from "react-dom";
import { FONT_PRELOAD } from "@regexsolver/web-shared/fonts/preload";
import "@regexsolver/web-shared/fonts/fonts.css";
import "../index.css";

const title = "RegexSolver - Patterns as sets of strings";
// Used for <meta name="description"> AND og:/twitter:description — social
// previews truncate around 125 chars, so keep it under that.
const metaDescription =
  "A Rust library that treats regex patterns as sets of strings: intersect, subtract, compare, complement and enumerate them.";
// JSON-LD only: structured data has no preview-truncation limit.
const jsonLdDescription =
  "RegexSolver is a Rust library that treats patterns as the sets of strings they match, so you can intersect, subtract, compare, complement and enumerate them, and get the result back as a regex.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: title,
    template: "%s | RegexSolver",
  },
  description: metaDescription,
  applicationName: "RegexSolver",
  alternates: { canonical: "/" },
  robots: IS_PROD_SITE
    ? { index: true, follow: true }
    : { index: false, follow: false },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  openGraph: og({ title, description: metaDescription, url: "/" }),
  twitter: {
    card: "summary_large_image",
    title,
    description: metaDescription,
    images: [OG_IMAGE],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "RegexSolver",
      url: SITE_URL,
      logo: `${SITE_URL}/logo-light.png`,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "RegexSolver",
      url: SITE_URL,
      description: jsonLdDescription,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en",
    },
    {
      "@type": "SoftwareApplication",
      name: "RegexSolver",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Any",
      url: SITE_URL,
      description: jsonLdDescription,
      publisher: { "@id": `${SITE_URL}/#organization` },
      license: "https://opensource.org/licenses/MIT",
      codeRepository: "https://github.com/RegexSolver/regexsolver",
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /* ReactDOM.preload, not a <link> in the JSX below: React 19 hoists preload
     links into <head> itself, so a literal element gets emitted twice.
     `crossOrigin` is required even same-origin — fonts are fetched in CORS
     mode, and a preload without it is discarded and the font re-fetched. */
  for (const href of FONT_PRELOAD) {
    ReactDOM.preload(href, {
      as: "font",
      type: "font/woff2",
      crossOrigin: "anonymous",
    });
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Sets .dark before first paint so dark-mode visitors get no white
            flash. Mirrors ThemeProvider's resolution exactly: the shared
            `theme` cookie wins ("system" resolves via prefers-color-scheme),
            then this site's localStorage, then the OS preference. The provider
            still re-resolves post-mount and owns the state from there. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=document.cookie.match(/(?:^|;\\s*)theme=(light|dark|system)/);var c=m&&m[1];var t=c==="system"?null:c||localStorage.getItem("theme");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.classList.add(t)}catch(e){}})()`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
          <ThemeProvider>
            {children}
            <CookieBanner />
          </ThemeProvider>
      </body>
    </html>
  );
}
