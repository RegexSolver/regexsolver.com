import { Page } from "../components/Page";
import { Link } from "../components/ui/Link";

/* The privacy policy. Keep it in step with what the site does: the hosts it is
   served from and downloads from, and what web-shared/src/analytics.ts
   collects. */

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
    title: "Who we are",
    body: (
      <p>
        This policy covers regexsolver.com and its live demo. The data
        controller is Alexandre van Beurden, a sole proprietor (
        <em>raison individuelle</em> / <em>Einzelfirma</em>) established in
        Switzerland. For any question about this policy or your data, contact
        the controller on GitHub:{" "}
        <External to="https://github.com/alexvbrdn">
          github.com/alexvbrdn
        </External>
        . It follows the Swiss Federal Act on Data Protection (FADP) and the EU
        General Data Protection Regulation (GDPR).
      </p>
    ),
  },
  {
    title: "What this site collects",
    body: (
      <>
        <p>
          <strong>Your patterns stay in your browser.</strong> The demo
          computes every result on your device, with the regexsolver engine
          compiled to WebAssembly. What you type is not sent to us or to anyone
          else.
        </p>
        <p>
          <strong>Anonymous analytics.</strong> PostHog records how the site is
          used: pages viewed, links clicked, demo operations run (the
          operation, the kind of result or error and the options, never the
          patterns), approximate location derived from your IP address, and
          your device and browser. Nothing is stored on your device for it, no
          profile of you is kept, and there is no screen recording. This rests
          on our legitimate interest in understanding how the site is used.
        </p>
        <p>
          <strong>Your browser keeps your settings.</strong> The light or dark
          theme and the code tab you pick, and the models you download in the
          demo, stay in your browser&rsquo;s storage, on your device. Clear them
          from your browser&rsquo;s settings.
        </p>
      </>
    ),
  },
  {
    title: "Who else sees data",
    body: (
      <>
        <ul>
          <li>
            <strong>GitHub Pages</strong> (GitHub, Inc., United States) serves
            the site, and processes each request, including your IP address,
            to deliver and secure it.{" "}
            <External to="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">
              Privacy statement
            </External>
            .
          </li>
          <li>
            <strong>Hugging Face</strong> (Hugging Face, Inc., United States)
            serves the neural synthesis models, and sees your IP address when
            you download one in the demo.{" "}
            <External to="https://huggingface.co/privacy">
              Privacy policy
            </External>
            .
          </li>
          <li>
            <strong>PostHog</strong> processes the analytics on its European
            Union infrastructure, and keeps them for a limited period.{" "}
            <External to="https://posthog.com/privacy">Privacy policy</External>.
          </li>
        </ul>
        <p>
          Each keeps request logs under its own policy. Where data leaves
          Switzerland or the European Economic Area, it is protected by an
          adequacy decision (such as the EU-U.S. and Swiss-U.S. Data Privacy
          Frameworks, for certified companies) or the European
          Commission&rsquo;s Standard Contractual Clauses. We keep no other
          personal data.
        </p>
      </>
    ),
  },
  {
    title: "Your rights",
    body: (
      <p>
        Under the GDPR and the FADP, you can ask to access, correct or erase
        your personal data, and object to its processing: contact the
        controller as described in section 1. You can also lodge a complaint
        with a supervisory authority: in Switzerland, the Federal Data
        Protection and Information Commissioner (FDPIC); in the European
        Economic Area, your local data protection authority.
      </p>
    ),
  },
  {
    title: "Changes",
    body: (
      <p>
        We may update this policy. The current version is on this page, with
        the date of its last update at the top.
      </p>
    ),
  },
];

export const Privacy = () => (
  <Page>
    <h1 className="display text-(length:--t-h2)">Privacy policy</h1>
    <p className="mt-4 font-mono text-[0.6875rem] font-medium tracking-[0.14em] text-muted-foreground">
      LAST UPDATED: 22 NOVEMBER 2026
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
