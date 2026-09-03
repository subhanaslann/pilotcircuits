/**
 * The share card — the one picture of this product that is seen away from it.
 *
 * A link to the site pasted into a chat, a submission page or a post renders
 * from `og:image`, and until this existed there was none: the card was a grey
 * box with a title under it. This is the drawing behind `public/og.png`.
 *
 * ## Why it is a page and not a component
 *
 * The same reason `lamp-mark.ts` is markup rather than JSX: its consumer is
 * `scripts/make-icons.mjs`, a Node script that renders with Playwright and
 * resolves no path aliases. So this module imports nothing — the mark's markup
 * and the brand's own words are passed in by the caller, which is what lets the
 * card be built from the very drawing the tab icon is built from instead of a
 * second copy of it.
 *
 * ## Why the words are here and not in the dictionary
 *
 * The card is one image in one language, as the icons are one drawing in one
 * colour: a crawler caches a single `og:image` per URL, and the product's
 * default is English. The sentences are still the dictionary's, copied here —
 * and `og-card.test.ts` is the tripwire that fails the moment `copy.brand`
 * stops saying what this card says.
 */

/** The card's pixel box. Facebook, X, Slack and Discord all read this ratio. */
export const ogCardSize = { width: 1200, height: 630 } as const;

/**
 * What the card says, in the words `content/locales/en.ts` uses.
 *
 * `headline` is the first sentence of `copy.brand.description` and `tagline` is
 * `copy.brand.tagline`, both without their final stop — the card sets them
 * large, and a full stop at the end of a display line reads as a smudge.
 */
export const ogCardWords = {
  headline: "Build real electronics with an agent beside you",
  tagline: "Build it. See it. Understand it.",
} as const;

export interface OgCardInput {
  /** `brand.name` — the nameplate, cased and cut as the workshop sets it. */
  name: string;
  /** `brand.protocol` — the chip in the top right corner. */
  protocol: string;
  /** `brand.origin` without its scheme: what a person would type. */
  host: string;
  /** `lampMarkMarkup()`'s output, dropped into an inline `<svg>`. */
  markMarkup: string;
  /** `lampMarkViewBox`. */
  markViewBox: string;
}

/**
 * The card as a standalone HTML document, ready for a 1200×630 viewport.
 *
 * Every colour is a literal from `design/tokens.ts`'s `hex` block and
 * `globals.css` — a rasteriser has no stylesheet to inherit from, which is the
 * same reason `lampMarkInk` is literal.
 *
 * The dot ground is `globals.css`'s `.grid-technical` at its own 16 px pitch,
 * so the card is laid on the paper the product is laid on.
 */
export function ogCardDocument(input: OgCardInput): string {
  const { name, protocol, host, markMarkup, markViewBox } = input;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Geist:wght@400;500&family=IBM+Plex+Mono:wght@500&display=block" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    width: ${ogCardSize.width}px;
    height: ${ogCardSize.height}px;
    background-color: #f5f7f8;
    background-image: radial-gradient(circle at 1px 1px, #dce3e8 1px, transparent 0);
    background-size: 16px 16px;
    font-family: "Geist", system-ui, sans-serif;
    color: #111827;
    display: flex;
    flex-direction: column;
    padding: 68px 76px;
    overflow: hidden;
  }

  /* The name as a kicker rather than as the hero. The mark is the hero on this
     card — once, and large — so setting it small beside the wordmark as well
     would be the two-marks mistake WorkshopWordmark already refused. (No
     back-ticks in this string: it is a template literal, and one would end it.) */
  .plate { display: flex; align-items: center; justify-content: space-between; }
  .plate-name {
    font-family: "Barlow Condensed", "Geist", sans-serif;
    font-weight: 700;
    font-size: 40px;
    line-height: 1;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #5b6576;
  }

  /* The protocol, set as the product sets a registered tool: mono, in the
     accent's soft tint, inside the border it uses for a chip. */
  .protocol {
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-weight: 500;
    font-size: 24px;
    line-height: 1;
    letter-spacing: 0.02em;
    color: #0e63e0;
    background: #eaf3ff;
    border: 2px solid #b9d8ff;
    border-radius: 999px;
    padding: 15px 26px 13px;
  }

  /* Two columns: the sentence, and the coach it is about. */
  .body {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 52px;
    padding: 30px 0 26px;
  }
  .say { flex: 1; min-width: 0; }
  .mark { flex: none; width: 250px; }
  .mark svg { display: block; width: 250px; height: 250px; }

  h1 {
    margin: 0;
    font-family: "Barlow Condensed", "Geist", sans-serif;
    font-weight: 700;
    font-size: 70px;
    line-height: 0.97;
    letter-spacing: 0.002em;
    text-transform: uppercase;
  }

  .rule {
    margin: 30px 0 26px;
    width: 120px;
    height: 8px;
    border-radius: 4px;
    background: #1677ff;
  }

  .tagline {
    margin: 0;
    font-size: 32px;
    line-height: 1.25;
    color: #5b6576;
  }

  .foot {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    border-top: 2px solid #e4e9ed;
    padding-top: 24px;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-weight: 500;
    font-size: 24px;
    letter-spacing: 0.01em;
    color: #626b80;
  }
  .foot .host { color: #111827; }
</style>
</head>
<body>
  <header class="plate">
    <span class="plate-name">${name}</span>
    <span class="protocol">${protocol}</span>
  </header>

  <div class="body">
    <div class="say">
      <h1>${ogCardWords.headline}</h1>
      <div class="rule"></div>
      <p class="tagline">${ogCardWords.tagline}</p>
    </div>
    <div class="mark">
      <svg viewBox="${markViewBox}" role="img" aria-label="${name}">${markMarkup}</svg>
    </div>
  </div>

  <footer class="foot">
    <span class="host">${host}</span>
    <span>Six Arduino chapters &middot; wired by hand</span>
  </footer>
</body>
</html>
`;
}
