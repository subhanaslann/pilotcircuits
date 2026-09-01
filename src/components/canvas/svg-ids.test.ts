import { readFileSync, readdirSync } from "node:fs";
import { join, posix, sep } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The rule `useSvgPrefix` exists to keep: no drawing names an id it cannot own.
 *
 * An SVG `id` is document-global and `url(#…)` is resolved against the page, so
 * a name written into a component at authoring time is shared by every copy of
 * that component on screen. This was live, not theoretical: chapter two's bench
 * drew three resistors, so `res-a`, `res-body` and `res-g` were each defined
 * three times and all 23 references on the page resolved to the first
 * resistor's definitions. Chapter one's briefing draws the same part at two
 * scales in two `<svg>` roots, and there the shared `clipPath` did not merely
 * pick the wrong copy — it dropped two of the four colour bands, so a 220 Ω
 * resistor was drawn red · brown.
 *
 * Nothing in TypeScript can express "this string must be unique per render",
 * so the guard is a source scan: a drawing may not write a literal `id`, a
 * literal `url(#…)`, or a literal `href="#…"`. Every one of them has to be
 * built from the copy's own prefix, which makes them template literals.
 *
 * This is a text test on purpose. Rendering two copies and diffing their ids
 * would prove the same thing for the components the test remembered to render;
 * the file scan cannot forget one.
 */

const ROOT = join(process.cwd(), "src");

/** The `<defs>` elements whose whole job is to be referenced by id. */
const DEF_TAG =
  /<(pattern|linearGradient|radialGradient|clipPath|filter|mask|marker|symbol)\b[^>]*?\bid="([^"]+)"/g;

/**
 * A reference written as a plain string can only point at a literal id.
 *
 * `href` is deliberately narrowed to the four SVG elements that take a
 * fragment: a plain `href="#f-10"` elsewhere is a link to a heading on the
 * page, which is a different thing entirely and perfectly fine.
 */
const LITERAL_URL = /="url\(#([^)"]+)\)"/g;
const LITERAL_HREF =
  /(?:\bxlinkHref="#|<(?:use|textPath|mpath|feImage)\b[^>]*?\bhref="#)([^"]+)"/g;

/**
 * Drawings outside `canvas/` that still name their ids, and why they are here
 * rather than fixed: `/workspace` draws exactly one kit case, so `cp-case-bb`
 * and `cp-case-shadow` have no second copy to collide with today. They are the
 * same latent fault — a second case on that page, or a second case anywhere in
 * the same document, resolves both to the first — and they are not this
 * agent's files. Remove a line the day its file scopes its ids; the test does
 * not check that these are still broken, only that no new one appears.
 */
const TOLERATED = new Set([
  "components/workspace/case-parts.tsx",
  "components/workspace/kit-case.tsx",
]);

function tsxFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) tsxFiles(path, out);
    else if (entry.name.endsWith(".tsx")) out.push(path);
  }
  return out;
}

const files = tsxFiles(ROOT)
  .map((path) => ({
    id: path.slice(ROOT.length + 1).split(sep).join(posix.sep),
    source: readFileSync(path, "utf8"),
  }))
  .filter((file) => !TOLERATED.has(file.id));

function matches(source: string, pattern: RegExp): string[] {
  return [...source.matchAll(new RegExp(pattern))].map((m) => m[0]);
}

describe("SVG ids belong to the copy that drew them", () => {
  it("finds the drawings at all", () => {
    /* A walker that returned nothing would make every assertion below pass. */
    expect(files.length).toBeGreaterThan(100);
    expect(files.map((f) => f.id)).toContain(
      "components/canvas/parts/wokwi/resistor-artwork.tsx",
    );
  });

  it("no <defs> element is given a fixed name", () => {
    const found = files.flatMap((file) =>
      matches(file.source, DEF_TAG).map((m) => `${file.id} · ${m}`),
    );
    expect(found).toEqual([]);
  });

  it("no url(#…) is written as a plain string", () => {
    const found = files.flatMap((file) =>
      matches(file.source, LITERAL_URL).map((m) => `${file.id} · ${m}`),
    );
    expect(found).toEqual([]);
  });

  it("no href points at a fixed fragment", () => {
    const found = files.flatMap((file) =>
      matches(file.source, LITERAL_HREF).map((m) => `${file.id} · ${m}`),
    );
    expect(found).toEqual([]);
  });

  /**
   * And the other half of the rule: a drawing that builds an id has to build it
   * from `useSvgPrefix`. Without this one a drawing could satisfy every check
   * above with `` id={`res-a`} `` and be exactly as broken.
   *
   * Only `canvas/` — an interpolated `id` on a panel or a tab is a DOM id built
   * from a prop, which is how `aria-labelledby` is supposed to work.
   */
  it("every drawing that builds an id builds it from the hook", () => {
    const builders = files.filter(
      (file) =>
        file.id.startsWith("components/canvas/") && file.source.includes("id={`"),
    );
    expect(builders.length).toBeGreaterThanOrEqual(8);
    for (const file of builders) {
      expect(file.source, file.id).toContain("useSvgPrefix(");
    }
  });
});
