#!/usr/bin/env node
/* IndexNow ping: submits a prod site's sitemap URLs to the IndexNow API, so
   participating engines (Bing, Yandex, Seznam, Naver — NOT Google, which does
   not implement the protocol) recrawl changed pages instead of waiting for
   their own schedule. Run as the last step of the rs-website / rs-docs deploy
   jobs on master only; see .github/workflows/rs-{website,docs}_test-and-deploy.yml.

     node apps/web-shared/scripts/indexnow.mjs https://regexsolver.com [--dry-run]

   It reads the LIVE sitemap.xml rather than a build directory, so it works from
   a bare checkout in the deploy job and only submits URLs the site is really
   serving. Nothing is submitted unless the origin's key file matches the key
   below, which is what turns a half-done key rotation into a loud failure
   instead of a silent 403 from the API. */

// Single source of truth for the key. Rotating it means editing this constant
// AND renaming both apps' committed public/<key>.txt (contents = the key):
//   apps/com.regexsolver/public/<key>.txt        -> https://regexsolver.com/<key>.txt
//   apps/com.regexsolver.docs/public/<key>.txt   -> https://docs.regexsolver.com/<key>.txt
// Both public/.gitignore files ignore `*`, so a new key file also needs its own
// `!<key>.txt` unignore line or it never reaches the image.
export const INDEXNOW_KEY = "7dfa2483f6057cb87aa0cbec916d71cb";

// Only the prod origins may be pinged. Dev builds with `noindex, nofollow` and
// an empty sitemap (NEXT_PUBLIC_SITE_URL / ZUDOKU_PUBLIC_DOCS_URL are the
// indexing switch), so submitting one would at best be a no-op and at worst
// push dev URLs at an engine.
const PROD_ORIGINS = ["https://regexsolver.com", "https://docs.regexsolver.com"];

const ENDPOINT = "https://api.indexnow.org/indexnow";
const TIMEOUT_MS = 15_000;

const fail = (msg) => {
  console.error(`indexnow: ${msg}`);
  process.exit(1);
};

/** GET with retries — the ping runs right after a rolling `docker service
    update`, so a single connection refused is expected, not fatal. */
const get = async (url, attempts = 3) => {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      if (i === attempts) fail(`GET ${url} failed after ${attempts} attempts: ${err.message}`);
      console.warn(`indexnow: GET ${url} attempt ${i} failed (${err.message}), retrying in 5s`);
      await new Promise((r) => setTimeout(r, 5_000));
    }
  }
};

const decodeEntities = (s) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");

const main = async () => {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const origin = args.find((a) => !a.startsWith("--"))?.replace(/\/$/, "");

  if (!origin) fail("usage: indexnow.mjs <origin> [--dry-run]");
  if (!PROD_ORIGINS.includes(origin)) {
    fail(`${origin} is not a prod origin (${PROD_ORIGINS.join(", ")}); refusing to submit`);
  }

  // The API answers 403 when the key file doesn't check out; do it ourselves
  // first so the failure names the actual problem.
  const served = (await get(`${origin}/${INDEXNOW_KEY}.txt`)).trim();
  if (served !== INDEXNOW_KEY) {
    fail(`${origin}/${INDEXNOW_KEY}.txt serves "${served}", expected "${INDEXNOW_KEY}"`);
  }

  const sitemap = await get(`${origin}/sitemap.xml`);
  const urlList = [...sitemap.matchAll(/<loc>([\s\S]*?)<\/loc>/g)]
    .map((m) => decodeEntities(m[1].trim()))
    .filter(Boolean);

  // An empty sitemap means a non-prod build is live on a prod hostname.
  if (urlList.length === 0) fail(`${origin}/sitemap.xml lists no URLs`);
  const foreign = urlList.filter((u) => !u.startsWith(`${origin}/`));
  if (foreign.length > 0) fail(`sitemap lists URLs outside ${origin}: ${foreign.join(", ")}`);

  const payload = {
    host: new URL(origin).host,
    key: INDEXNOW_KEY,
    keyLocation: `${origin}/${INDEXNOW_KEY}.txt`,
    urlList,
  };

  console.log(`indexnow: ${dryRun ? "would submit" : "submitting"} ${urlList.length} URL(s) for ${payload.host}`);
  for (const url of urlList) console.log(`  ${url}`);
  if (dryRun) return;

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  // 200 = accepted, 202 = accepted but the key is still being validated.
  if (res.status !== 200 && res.status !== 202) {
    fail(`${ENDPOINT} returned HTTP ${res.status}: ${(await res.text()).trim()}`);
  }
  console.log(`indexnow: accepted (HTTP ${res.status})`);
};

await main();
