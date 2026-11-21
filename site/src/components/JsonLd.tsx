/* Server component: keeps structured data out of the client bundle. */
export const JsonLd = ({ data }: { data: Record<string, unknown> }) => (
  <script
    type="application/ld+json"
    // Build-time constant; no user input reaches this string.
    dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
  />
);
