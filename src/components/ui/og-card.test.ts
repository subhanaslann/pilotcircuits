import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ogCardDocument,
  ogCardSize,
  ogCardWords,
} from "@/components/ui/og-card";
import { en } from "@/content/locales/en";

/**
 * The share card is the one surface nobody looks at.
 *
 * It is rasterised once by `scripts/make-icons.mjs` and committed as
 * `public/og.png`; after that it is only ever seen by somebody who pasted a
 * link somewhere else. So the two ways it can quietly go wrong — the sentence
 * drifting away from the dictionary, and the committed PNG no longer being the
 * size the card was laid out at — are checked here instead.
 *
 * When the first fails, the card is repeating a sentence the product has since
 * rewritten: copy the new one into `ogCardWords` and re-run the script. When
 * the second fails, `public/og.png` was written at some other size and every
 * crawler will letterbox it.
 */
describe("the share card", () => {
  it("says what the dictionary says", () => {
    /* The headline is the description's first sentence, minus its stop; the
       tagline is the tagline, whole. Compared against English on purpose —
       there is one card and `defaultLocale` is `en`. */
    expect(en.brand.description).toMatch(
      new RegExp(
        `^${ogCardWords.headline.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\.`,
      ),
    );
    expect(ogCardWords.tagline).toBe(en.brand.tagline);
  });

  it("takes its name, protocol, host and mark from the caller", () => {
    const html = ogCardDocument({
      name: "NAME",
      protocol: "PROTOCOL",
      host: "HOST",
      markMarkup: '<circle id="MARK" />',
      markViewBox: "0 0 9 9",
    });

    /* Nothing about the brand may be written into the card by hand: the whole
       point of passing these in is that the card cannot disagree with
       `content/brand.ts` about what the product is called or where it lives. */
    expect(html).toContain("NAME");
    expect(html).toContain("PROTOCOL");
    expect(html).toContain("HOST");
    expect(html).toContain('id="MARK"');
    expect(html).toContain('viewBox="0 0 9 9"');
    expect(html).not.toContain("PilotCircuits");
    expect(html).not.toContain("pilotcircuits.com");
  });

  it("is committed at the size it was laid out at", () => {
    const png = readFileSync(join(process.cwd(), "public", "og.png"));

    /* A PNG's IHDR is the first chunk and its two dimensions are the four
       bytes at 16 and at 20, big-endian. Cheaper than a decoder, and the only
       thing worth asserting about a raster nobody can diff. */
    expect(png.subarray(1, 4).toString("ascii")).toBe("PNG");
    expect(png.readUInt32BE(16)).toBe(ogCardSize.width);
    expect(png.readUInt32BE(20)).toBe(ogCardSize.height);
  });
});
