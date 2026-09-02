import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  lampMarkDocument,
  lampMarkInk,
  lampMarkMarkup,
  lampMarkViewBox,
} from "@/components/ui/lamp-mark";
import { brand } from "@/content/brand";

/**
 * The tab icon and the header have to be the same drawing.
 *
 * `public/logo.svg` is a committed file and the PNGs beside it are rasterised
 * from that file once, by hand, with `scripts/make-icons.mjs`. Nothing in a
 * build regenerates them, so a change to `lamp-mark.ts` would move the mark in
 * the page and leave the browser tab showing last month's — the kind of drift
 * nobody notices until a judge opens the product in a second window.
 *
 * So: the committed asset must be exactly what the module produces today. When
 * this fails, the fix is not to edit the test — it is to run the script and
 * commit the four files it writes.
 */
describe("the lamp mark", () => {
  const root = join(process.cwd(), "public");

  /* Git may hand a working copy back with CRLF (this repo has both, see the
     mixed endings in `src/components/ui`), and that is not a drawing change. */
  const asWritten = (text: string) => text.replace(/\r\n/g, "\n");

  it("is what public/logo.svg holds", () => {
    const committed = asWritten(readFileSync(join(root, "logo.svg"), "utf8"));

    expect(committed).toBe(lampMarkDocument(lampMarkInk, brand.name));
  });

  it("paints every shape in the ink it is handed", () => {
    const markup = lampMarkMarkup({
      body: "BODY",
      edge: "EDGE",
      face: "FACE",
    });

    /* No literal colour may survive the substitution: one hard-coded fill is
       all it takes for the monochrome stamp to come out two-tone. */
    expect(markup).not.toMatch(/#[0-9a-f]{3,8}/i);
    expect(markup).toContain("BODY");
    expect(markup).toContain("EDGE");
    expect(markup).toContain("FACE");
  });

  it("stays inside its own square", () => {
    /* Every coordinate written as an attribute, against the view box — the
       path data is not parsed. A shape that wandered out would be cropped in
       the tab and nowhere else, because the page's `<svg>` is the only place
       with room to overflow. */
    const [, , width, height] = lampMarkViewBox.split(" ").map(Number);
    const numbers = lampMarkMarkup()
      .match(/(?:x|y|cx|cy)="(-?[\d.]+)"/g)
      ?.map((pair) => Number(pair.split('"')[1]));

    expect(numbers?.length).toBeGreaterThan(0);
    for (const value of numbers ?? []) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(Math.max(width, height));
    }
  });
});
