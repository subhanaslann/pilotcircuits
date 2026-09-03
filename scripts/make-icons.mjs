/**
 * Writes the brand's raster assets from the one drawing in
 * `src/components/ui/lamp-mark.ts`.
 *
 * Outputs, the icons all transparent:
 *
 *   public/logo.svg        the drawing itself, the source of every PNG below
 *   src/app/icon.png       32 px — Next's app-icon convention, the browser tab
 *   src/app/apple-icon.png 180 px — iOS home screen
 *   public/logo.png        1024 px — README, Devpost, anywhere a raster is asked for
 *   public/og.png          1200×630 — the share card, laid out by `ui/og-card.ts`
 *
 * Run it after changing the mark; `lamp-mark.test.ts` fails until you do.
 *
 *   node scripts/make-icons.mjs
 *
 * Node 23.6+ runs the TypeScript modules above without a build step, so the
 * script and the page draw the same shapes by construction rather than by
 * discipline. Rasterising is Playwright's job — it is the one renderer this
 * project already trusts to tell it what a page really looks like, and
 * `omitBackground` is what makes the icon PNGs transparent rather than white.
 * It is not a dependency of the product: point `PLAYWRIGHT_MODULE` at an
 * install, or have one resolvable from here.
 *
 *   PLAYWRIGHT_MODULE=file:///c:/path/to/node_modules/playwright/index.js \
 *     node scripts/make-icons.mjs
 *
 * The card is the one output that needs the network: it sets its three faces in
 * the product's own typefaces, which are Google's. `display=block` plus a wait
 * on `document.fonts.ready` is what stops the card being rasterised mid-swap,
 * in the fallback face.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { brand } from "../src/content/brand.ts";
import {
  lampMarkDocument,
  lampMarkInk,
  lampMarkMarkup,
  lampMarkViewBox,
} from "../src/components/ui/lamp-mark.ts";
import { ogCardDocument, ogCardSize } from "../src/components/ui/og-card.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Where each size lands, and what it is for. */
const targets = [
  { path: "src/app/icon.png", size: 32 },
  { path: "src/app/apple-icon.png", size: 180 },
  { path: "public/logo.png", size: 1024 },
];

const svg = lampMarkDocument(lampMarkInk, brand.name);

await mkdir(join(root, "public"), { recursive: true });
await writeFile(join(root, "public/logo.svg"), svg, "utf8");
console.log("public/logo.svg");

const specifier = process.env.PLAYWRIGHT_MODULE ?? "playwright";
const playwright = await import(specifier).catch(() => {
  throw new Error(
    `Playwright did not resolve from "${specifier}". Install it here, or set ` +
      `PLAYWRIGHT_MODULE to the file: URL of an install's index.js.`,
  );
});

/* Playwright's entry is CommonJS, so a dynamic import may hand it back under
   `default` depending on how it was resolved. */
const chromium = playwright.chromium ?? playwright.default?.chromium;

/* `channel: "chrome"` uses the Chrome already on the machine, so the script
   does not need Playwright's own browser download to have been run. */
const browser = await chromium
  .launch({ channel: "chrome" })
  .catch(() => chromium.launch());

for (const { path, size } of targets) {
  const page = await browser.newPage({
    viewport: { width: size, height: size },
    deviceScaleFactor: 1,
  });

  /* The mark is placed at exactly its pixel size and screenshotted as an
     element, so the PNG is the drawing's box and nothing else — no padding to
     trim, no scaling to guess at. */
  await page.setContent(
    `<!doctype html><meta charset="utf-8">
     <style>html,body{margin:0;background:transparent}
            svg{display:block;width:${size}px;height:${size}px}</style>
     ${svg}`,
  );

  const shot = await page
    .locator("svg")
    .screenshot({ omitBackground: true, scale: "css" });

  await mkdir(dirname(join(root, path)), { recursive: true });
  await writeFile(join(root, path), shot);
  await page.close();

  console.log(`${path} · ${size}×${size} · ${shot.length} bytes`);
}

/* The share card. A full page rather than an element: it has a ground, and a
   crawler that gets a transparent PNG renders it on whatever colour its own
   surface happens to be. */
{
  const page = await browser.newPage({
    viewport: { width: ogCardSize.width, height: ogCardSize.height },
    deviceScaleFactor: 1,
  });

  await page.setContent(
    ogCardDocument({
      name: brand.name,
      protocol: brand.protocol,
      host: new URL(brand.origin).host,
      markMarkup: lampMarkMarkup(lampMarkInk),
      markViewBox: lampMarkViewBox,
    }),
    { waitUntil: "networkidle" },
  );
  await page.evaluate(() => document.fonts.ready);

  const shot = await page.screenshot({ scale: "css" });

  await writeFile(join(root, "public/og.png"), shot);
  await page.close();

  console.log(
    `public/og.png · ${ogCardSize.width}×${ogCardSize.height} · ${shot.length} bytes`,
  );
}

await browser.close();
