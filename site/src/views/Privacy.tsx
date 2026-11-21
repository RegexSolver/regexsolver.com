import { Page } from "../components/Page";
import { Link } from "../components/ui/Link";

/* The privacy policy. It used to live on the docs site, with the API and
   console in scope; this one covers the static site only. Keep it in step
   with what the site actually does: the hosts it is served from and downloads
   from, and what lib/posthog.ts and the cookie banner do. */

const External = ({ to, children }: { to: string; children: string }) => (
  <Link
    to={to}
    className="text-set-a underline underline-offset-2 hover:opacity-80"
  >
    {children}
  </Link>
);

type Section = { title: string; body: React.ReactNode };

const SECTIONS: Section[] = [
  {
    title: "Introduction",
    body: (
      <>
        <p>
          This policy explains what personal data is processed when you visit
          regexsolver.com (the &ldquo;Website&rdquo;), including its live
          demo. The Website has no accounts and no server of its own: it is a
          set of static pages, and the demo runs in your browser.
        </p>
        <p>
          It is written to comply with the Swiss Federal Act on Data
          Protection (&ldquo;FADP&rdquo;) and the EU General Data Protection
          Regulation (&ldquo;GDPR&rdquo;).
        </p>
      </>
    ),
  },
  {
    title: "Who we are",
    body: (
      <>
        <p>
          The data controller is Alexandre van Beurden, a sole proprietor
          (<em>raison individuelle</em> / <em>Einzelfirma</em>) established in
          Switzerland. For any question about this policy or your data,
          contact the controller through the{" "}
          <External to="https://github.com/RegexSolver">
            RegexSolver organization on GitHub
          </External>
          .
        </p>
      </>
    ),
  },
  {
    title: "Your patterns stay in your browser",
    body: (
      <p>
        The live demo computes every result on your device, with the regexsolver engine compiled to WebAssembly. The
        patterns and parameters you enter are not sent to us or to anyone
        else, and are not stored beyond the page you are on.
      </p>
    ),
  },
  {
    title: "What is processed, and by whom",
    body: (
      <ul>
        <li>
          <strong>Hosting.</strong> The Website is served by GitHub Pages
          (GitHub, Inc., United States). To deliver and secure it, GitHub
          processes the data of each request, including your IP address and
          browser details, and may log it. See the{" "}
          <External to="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">
            GitHub privacy statement
          </External>
          .
        </li>
        <li>
          <strong>Model download.</strong> When you choose a neural synthesis
          model in the demo, it is downloaded (20 to 37 MB) from the Hugging
          Face Hub (Hugging Face, Inc., United States) and its content delivery
          network. That request reveals your IP address and browser details to
          Hugging Face. See the{" "}
          <External to="https://huggingface.co/privacy">
            Hugging Face privacy policy
          </External>
          .
        </li>
        <li>
          <strong>Analytics.</strong> We use PostHog, on its European Union
          infrastructure, to understand how the Website is used: pages viewed,
          links and buttons clicked, demo operations run (which operation, the
          kind of result or error, and the generation options, never the
          patterns), approximate location derived from your IP address, and
          technical information about your device and browser. By default
          this is <strong>cookieless and anonymous</strong>: no identifier is
          stored on your device. Session and screen recording are off. See
          the{" "}
          <External to="https://posthog.com/privacy">
            PostHog privacy policy
          </External>
          .
        </li>
      </ul>
    ),
  },
  {
    title: "Cookies and browser storage",
    body: (
      <>
        <p>
          A cookie stores your cookie-consent choice and your light or dark
          theme. Your browser&rsquo;s local storage keeps the theme and the
          code tab you last picked. The models you download in the demo are
          kept in your browser&rsquo;s cache, so each is downloaded once. These
          are strictly necessary or functional, stay on your device, and can be
          cleared from your browser&rsquo;s settings.
        </p>
        <p>
          Analytics cookies are set only if you <strong>accept</strong> them
          in the cookie banner: they let PostHog recognize you across visits.
          Declining keeps analytics cookieless and anonymous. You can change
          your choice at any time by clearing the consent cookie, which brings
          the banner back. We do not use cookies for advertising.
        </p>
      </>
    ),
  },
  {
    title: "Legal bases",
    body: (
      <ul>
        <li>
          <strong>Legitimate interests</strong>: delivering and securing the
          Website, and understanding how it is used through cookieless,
          anonymous analytics.
        </li>
        <li>
          <strong>Consent</strong>: analytics cookies, which you may withdraw
          at any time.
        </li>
      </ul>
    ),
  },
  {
    title: "International transfers",
    body: (
      <p>
        GitHub and Hugging Face process data in the United States. Where
        personal data leaves Switzerland or the European Economic Area, it is
        protected by appropriate safeguards, such as an adequacy decision
        (including the EU-U.S. and Swiss-U.S. Data Privacy Frameworks, for
        certified companies) or the European Commission&rsquo;s Standard
        Contractual Clauses.
      </p>
    ),
  },
  {
    title: "Retention",
    body: (
      <p>
        Analytics data is kept by PostHog for a limited period sufficient to
        analyze trends, then deleted or aggregated. Request logs are kept by
        GitHub and Hugging Face under their own policies. We keep no other
        personal data.
      </p>
    ),
  },
  {
    title: "Your rights",
    body: (
      <>
        <p>
          Subject to the GDPR and the FADP, you have the right to access,
          rectify and erase your personal data, to restrict or object to its
          processing, to data portability, and to withdraw consent at any time
          without affecting earlier processing. To exercise them, contact the
          controller as described in section 2.
        </p>
        <p>
          You may lodge a complaint with a supervisory authority: in
          Switzerland, the Federal Data Protection and Information
          Commissioner (FDPIC); in the EEA, your local data protection
          authority.
        </p>
      </>
    ),
  },
  {
    title: "Changes",
    body: (
      <p>
        We may update this policy. The current version is on this page,
        with the date of its last update at the top.
      </p>
    ),
  },
];

export const Privacy = () => (
  <Page>
    <h1 className="display text-(length:--t-h2)">Privacy policy</h1>
    <p className="mt-4 font-mono text-[0.6875rem] font-medium tracking-[0.14em] text-muted-foreground">
      LAST UPDATED: 21 NOVEMBER 2026
    </p>

    {SECTIONS.map((section, i) => (
      <div key={section.title} className="mt-10">
        <h2 className="display text-(length:--t-h3)">
          {i + 1}. {section.title}
        </h2>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground [&_strong]:text-foreground [&_strong]:font-medium [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2">
          {section.body}
        </div>
      </div>
    ))}
  </Page>
);
