/**
 * A-21 · The lamp mark — the product's logo, drawn once.
 *
 * The mark used to be a signal path turning a corner onto a pad: an argument
 * about routes and destinations, and a glyph nobody could name. The product
 * already has a figure people name in the first second — the coach in
 * `agent/coach-figure.tsx`, a 5 mm LED with a face, the part chapter one is
 * about — so the mark is that figure now, in the browser tab and on the
 * nameplate as well as beside the bench.
 *
 * ## Why the drawing lives here as markup and not as JSX
 *
 * It has two consumers that cannot share a component. `ui/brand-marks.tsx`
 * renders it in the page, and `scripts/make-icons.mjs` writes it to
 * `public/logo.svg` and rasterises that into the tab icon and the app icons —
 * a Node script cannot render JSX, and a favicon cannot be a React component.
 * Keeping one markup builder is what stops the tab from drifting away from the
 * header. `lamp-mark.test.ts` is the tripwire: it fails the moment the
 * committed `logo.svg` stops being this function's output.
 *
 * The string is built from the numbers in this file and takes nothing from
 * outside it, which is why the component is allowed to set it as inner HTML.
 *
 * ## The geometry
 *
 * The coach is drawn on a 64×76 grid with room for arms, feet and a shadow. A
 * mark has none of those and has to survive 16 px, so this is the same LED —
 * dome, straight sides, flange, and one leg longer than the other, which is how
 * a real LED says which way round it goes — scaled to a 32-unit square at
 * 0.6875 and with its legs cut to a third. Every proportion the coach fixes is
 * kept: the dome's radius is half the body's width, the eyes sit 28 % in from
 * the sides and 53 % down the body, the mouth 78 % down.
 *
 * Two deliberate departures, both optical. The eyes are `2.4` where the scale
 * says `1.9`, and the mouth's stroke `1.7` where it says `1.5`: at a 16 px tab
 * icon a faithful eye is a grey pixel, and a face that cannot be read is not a
 * face. Everything else is the coach's own arithmetic.
 */

/** The mark's square. Nothing drawn here leaves it. */
export const lampMarkViewBox = "0 0 32 32";

export interface LampMarkInk {
  /** The bulb — the agent's one blue (`design/tokens.ts` `agent.mark`). */
  body: string;
  /** The moulding's edge, the flange's outline, and the two legs. */
  edge: string;
  /** Eyes, mouth, and the catch of light. */
  face: string;
}

/**
 * The mascot's own ink, as literals.
 *
 * The page could read these from CSS variables and the exported icons could
 * not, so they are literals in both places — the same reason `tokens.ts` keeps
 * a `hex` block for "the few places a CSS variable cannot be used". These are
 * `--color-accent` and the coach's own edge, and a tab icon that disagreed with
 * the header would be worse than one that cannot follow a theme.
 */
export const lampMarkInk: LampMarkInk = {
  body: "#1677FF",
  edge: "#0F5FD1",
  face: "#FFFFFF",
};

/**
 * The mark's shapes, in paint order: legs behind the flange, flange over the
 * body's hem, face last.
 */
export function lampMarkMarkup(ink: LampMarkInk = lampMarkInk): string {
  return [
    /* The anode is the long one. */
    `<rect x="12.25" y="24" width="2.3" height="7.5" rx="1.15" fill="${ink.edge}" />`,
    `<rect x="17.45" y="24" width="2.3" height="5.9" rx="1.15" fill="${ink.edge}" />`,
    /* Dome on straight sides — an LED is taller than it is wide. */
    `<path d="M5 23V12a11 11 0 0 1 22 0v11z" fill="${ink.body}" stroke="${ink.edge}" stroke-width="1.1" stroke-linejoin="round" />`,
    /* The flange, wider than the body on both sides. */
    `<rect x="3.5" y="21.4" width="25" height="4.4" rx="1.6" fill="${ink.body}" stroke="${ink.edge}" stroke-width="1.1" />`,
    /* One soft catch of light, top left — what makes a moulding a moulding. */
    `<ellipse cx="10.6" cy="7.2" rx="3.8" ry="2.3" transform="rotate(-28 10.6 7.2)" fill="${ink.face}" opacity="0.2" />`,
    /* The face at rest: the coach's `idle` — round eyes and a small smile. */
    `<circle cx="11.2" cy="12.7" r="2.4" fill="${ink.face}" />`,
    `<circle cx="20.8" cy="12.7" r="2.4" fill="${ink.face}" />`,
    `<path d="M13.6 18.2Q16 20.6 18.4 18.2" fill="none" stroke="${ink.face}" stroke-width="1.7" stroke-linecap="round" />`,
  ].join("\n");
}

/**
 * The same drawing as a standalone file: what `public/logo.svg` holds and what
 * the PNGs are rasterised from.
 *
 * No `width` or `height` — an asset that carries only a view box scales to
 * whatever asks for it, and the icon script sets the pixel size itself. The
 * name is passed in rather than read from `content/brand.ts`, because this
 * module is imported by a Node script that resolves no path aliases; the
 * caller on either side reads the brand.
 */
export function lampMarkDocument(
  ink: LampMarkInk = lampMarkInk,
  label = "",
): string {
  const body = lampMarkMarkup(ink)
    .split("\n")
    .map((line) => `  ${line}`)
    .join("\n");

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${lampMarkViewBox}" role="img">`,
    `  <title>${label}</title>`,
    body,
    `</svg>`,
    ``,
  ].join("\n");
}
