import { readFileSync, readdirSync } from "node:fs";
import { join, posix, sep } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The two ways a colour or a class can be *written down* and still not exist.
 *
 * Neither is a type error and neither crashes: Tailwind emits nothing for a
 * class it cannot resolve, the browser drops the declaration, and the element
 * renders looking almost right. Both of these were live in the product.
 *
 * 1. `.ring-focus` was declared inside `@layer utilities { … }` instead of with
 *    Tailwind 4's `@utility` directive. Tailwind emits the bare class from a
 *    `@layer` block and **no variant form of it**, so all fifteen
 *    `focus-visible:ring-focus` / `peer-focus-visible:ring-focus` call sites
 *    compiled to nothing. On a plain `<button>` the global `:focus-visible`
 *    rule hid the loss; on the knowledge check's radio group and on every
 *    checkbox — where the focusable element is `sr-only` or `opacity-0` and the
 *    ring was meant for a sibling — there was no focus indicator at all.
 *
 * 2. `text-inverse` was never a class. The theme defines `--color-ink-inverse`
 *    and no `--color-inverse`, so two `bg-accent text-inverse` capsules painted
 *    `body`'s near-black on accent blue at 4.32:1.
 *
 * Both are questions about the CSS *source*, so this is a source test. It needs
 * no DOM, no build and no browser, and it cannot be satisfied by a screenshot
 * that happens to look fine because a global rule caught the fall.
 *
 * The contrast half is the same kind of claim: §18 sets 4.5:1 for body text and
 * 3:1 for large text and UI, and nothing in the rest of the suite looks at a
 * colour pair.
 */

const ROOT = join(process.cwd(), "src");
const CSS = readFileSync(join(ROOT, "app", "globals.css"), "utf8");

/* --- The utilities -------------------------------------------------------- */

/** Class names declared the way Tailwind can build variants of. */
const utilities = new Set(
  [...CSS.matchAll(/@utility\s+([a-z0-9-]+)\s*\{/g)].map((m) => m[1]),
);

/**
 * Class names declared inside `@layer utilities { … }` — bare class only.
 *
 * The block is found by its opening brace and read to the matching close, so a
 * nested rule cannot end it early.
 */
const layered = (() => {
  const open = CSS.indexOf("@layer utilities {");
  if (open === -1) return new Set<string>();
  let depth = 0;
  let end = open;
  for (let i = CSS.indexOf("{", open); i < CSS.length; i += 1) {
    if (CSS[i] === "{") depth += 1;
    if (CSS[i] === "}") {
      depth -= 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  const block = CSS.slice(open, end);
  return new Set(
    [...block.matchAll(/^\s{2}\.([a-z0-9-]+)\s*\{/gm)].map((m) => m[1]),
  );
})();

function sources(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) sources(path, out);
    else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) {
      out.push(path);
    }
  }
  return out;
}

/**
 * Comments out, and it matters here more than usual: this file's own prose
 * names both of the dead classes it exists to keep out, and so does the comment
 * beside every one of the fixes. A scan that read them would fail on the
 * explanation of the bug.
 */
const code = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/[^\n]*/g, " ");

const files = sources(ROOT)
  .filter((path) => !path.endsWith(".test.ts") && !path.endsWith(".test.tsx"))
  .map((path) => ({
    id: path.slice(ROOT.length + 1).split(sep).join(posix.sep),
    source: code(readFileSync(path, "utf8")),
  }));

/**
 * A variant chain in front of a class: `focus-visible:x`, `peer-hover:x`.
 *
 * `(?<![-\w])` rather than `\b`, here and below: a word boundary happily starts
 * a match in the middle of a longer, perfectly good class name.
 */
const VARIANT_USE = /(?<![-\w])(?:[a-z0-9@[\]._-]+:)+([a-z][a-z0-9-]*)\b/g;

describe("a utility used with a variant is declared with @utility", () => {
  it("reads both halves of globals.css", () => {
    expect(utilities.size).toBeGreaterThan(8);
    expect(utilities.has("ring-focus")).toBe(true);
    /* The tripwire's own tripwire: a parser that found nothing in the layered
       block would make the assertion below pass for the wrong reason. */
    expect(layered.size).toBeGreaterThan(4);
    expect(layered.has("tnum")).toBe(true);
  });

  it("no @layer utilities class is used with a variant anywhere in src", () => {
    const found: string[] = [];
    for (const file of files) {
      for (const [whole, cls] of file.source.matchAll(VARIANT_USE)) {
        if (layered.has(cls)) found.push(`${file.id} · ${whole}`);
      }
    }
    expect(found).toEqual([]);
  });

  it("the focus ring is a utility, not a layer rule", () => {
    expect(layered.has("ring-focus")).toBe(false);
    expect(utilities.has("focus-on-dark")).toBe(true);
  });
});

/* --- The colour tokens ---------------------------------------------------- */

/** Every custom property the stylesheet defines, with its value. */
const tokens = new Map(
  [...CSS.matchAll(/^\s*(--[a-z0-9-]+):\s*([^;]+);/gm)].map((m) => [
    m[1],
    m[2].trim(),
  ]),
);

describe("a colour class names a token that exists", () => {
  it("defines the tokens the product asks for by name", () => {
    for (const name of [
      "--color-ink",
      "--color-ink-secondary",
      "--color-ink-tertiary",
      "--color-ink-inverse",
      "--color-accent",
      "--color-accent-hover",
      "--color-surface",
      "--color-surface-sunken",
      "--focus-ring-color",
      "--focus-ring-color-inverse",
    ]) {
      expect(tokens.has(name), name).toBe(true);
    }
  });

  it("no class asks for a `--color-` token the theme does not define", () => {
    /* The `text-inverse` shape: a Tailwind colour utility resolves `text-x`
       against `--color-x`, so a class whose token is missing emits nothing at
       all and the element quietly inherits.
       Two rules, because the class name alone cannot always be told from a
       font size or a border side without Tailwind's own resolver:
       · a MULTI-segment name whose first segment is itself a colour token —
         `ink-…`, `surface-…`, `wire-…` — must resolve exactly. This is what
         catches a typo'd `text-ink-inversed`.
       · a SINGLE-segment name that is a *suffix* somewhere in the palette —
         `inverse`, `sunken`, `hover` — must resolve too. This is the
         `text-inverse` bug itself: a real word from a real token, one segment
         short of a real class. `border-b` is not that word and is not a colour;
         nothing else in the palette makes a one-word class. */
    const colours = [...tokens.keys()].filter((t) => t.startsWith("--color-"));
    const suffixes = new Set(
      colours.flatMap((t) => t.slice("--color-".length).split("-").slice(1)),
    );
    /* `border-border-strong` contains the literal `border-strong`, which is
       why this cannot open on a word boundary. */
    const COLOUR_CLASS =
      /(?<![-\w])(?:text|bg|border|fill|stroke|ring|shadow)-([a-z][a-z0-9-]*)\b/g;
    const missing = new Set<string>();
    for (const file of files) {
      for (const [whole, name] of file.source.matchAll(COLOUR_CLASS)) {
        if (tokens.has(`--color-${name}`)) continue;
        /* `border-strong` is a token name in the design lab's own colour
           table, and the alternation above reads its `border-` as the utility
           prefix. If the whole match is a token, the split was the wrong one. */
        if (tokens.has(`--color-${whole}`)) continue;
        const segments = name.split("-");
        const suspect =
          segments.length > 1
            ? tokens.has(`--color-${segments[0]}`)
            : suffixes.has(name);
        if (suspect) missing.add(name);
      }
    }
    expect([...missing]).toEqual([]);
  });
});

/* --- The contrast pairs --------------------------------------------------- */

function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const channel = (at: number) => {
    const c = parseInt(h.slice(at, at + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return (
    0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4)
  );
}

/** WCAG 2.x relative-contrast ratio, to two decimals. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
}

/** One colour laid over another at `alpha`, which is what `/95` means. */
function over(top: string, ground: string, alpha: number): string {
  const mix = (at: number) =>
    Math.round(
      parseInt(top.replace("#", "").slice(at, at + 2), 16) * alpha +
        parseInt(ground.replace("#", "").slice(at, at + 2), 16) * (1 - alpha),
    );
  return `#${[0, 2, 4].map((at) => mix(at).toString(16).padStart(2, "0")).join("")}`;
}

/** What a token resolves to, following one level of `var(…)`. */
function value(name: string): string {
  const raw = tokens.get(name);
  if (!raw) throw new Error(`no such token: ${name}`);
  const ref = raw.match(/^var\((--[a-z0-9-]+)\)$/);
  return ref ? value(ref[1]) : raw;
}

/** §18: body text 4.5:1, large text and UI 3:1. */
const BODY = 4.5;
const UI = 3;

describe("§18's contrast thresholds, on the pairs the product actually paints", () => {
  it("sanity-checks the formula against WCAG's own extremes", () => {
    expect(contrast("#000000", "#ffffff")).toBe(21);
    expect(contrast("#ffffff", "#ffffff")).toBe(1);
  });

  /** The kit shelf's ground: `bg-[#333E46]/95` over the sunken well. */
  const shelf = over("#333E46", value("--color-surface-sunken"), 0.95);

  it("the focus ring reads on both of the product's dark grounds", () => {
    /* The mat is `illustration/spec.ts`'s bench body; the shelf is above. The
       app's own ring is tuned for `--color-app` and is 2.2:1 and 2.3:1 here,
       which is why `focus-on-dark` exists at all. */
    const mat = "#3E4A53";
    const ring = value("--focus-ring-color-inverse");
    expect(contrast(ring, mat)).toBeGreaterThanOrEqual(UI);
    expect(contrast(ring, shelf)).toBeGreaterThanOrEqual(UI);
    /* And the reason it is a second token rather than a new default: the same
       ring on the app's paper would be invisible. */
    expect(contrast(ring, value("--color-app"))).toBeLessThan(UI);
  });

  it("the kit shelf's caption is readable on the shelf", () => {
    /* 11px uppercase is normal-size text as far as WCAG is concerned. */
    expect(contrast("#B4C0C9", shelf)).toBeGreaterThanOrEqual(BODY);
  });

  it("the active chip and the active step number are readable on their ground", () => {
    /* `bg-accent-hover text-ink-inverse`, 12px. White on `--color-accent`
       itself is 4.10:1, which is why the ground moved with the ink. */
    expect(
      contrast(value("--color-ink-inverse"), value("--color-accent-hover")),
    ).toBeGreaterThanOrEqual(BODY);
  });

  it("the tertiary ink clears 4.5:1 on every surface it is printed on", () => {
    for (const ground of [
      "--color-surface",
      "--color-surface-sunken",
      "--color-app",
    ]) {
      expect(
        contrast(value("--color-ink-tertiary"), value(ground)),
        ground,
      ).toBeGreaterThanOrEqual(BODY);
    }
  });

  it("the seat picker's mark reads on plastic and on the board", () => {
    /* `bench.label` alone is 1.42:1 on the breadboard's plastic and 1.05:1 on
       its holes, and no single colour can clear 3:1 on both that and the Uno's
       PCB — hence the dark halo under the light ring. The pair is legible
       because at least one of the two contrasts with whatever is behind it. */
    const label = "#C6D0D8";
    const halo = "#10161C";
    for (const ground of ["#F2F4F6", "#C4CBD2", "#1B4F9C", "#3E4A53"]) {
      expect(
        Math.max(contrast(label, ground), contrast(halo, ground)),
        ground,
      ).toBeGreaterThanOrEqual(UI);
    }
    /* And the two are legible against each other, or the halo would just be a
       fatter version of the mark. */
    expect(contrast(label, halo)).toBeGreaterThanOrEqual(UI);
  });
});
