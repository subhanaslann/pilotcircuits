import {
  lampMarkInk,
  lampMarkMarkup,
  lampMarkViewBox,
  type LampMarkInk,
} from "@/components/ui/lamp-mark";
import { brand } from "@/content/brand";
import { cn } from "@/lib/utils/cn";

/**
 * The mark drawn in one colour: a stamp, for the places a two-tone mascot has
 * no business being. The moulding's edge collapses into the body, so what is
 * left is the LED's silhouette with the face knocked out of it.
 */
const stampInk: LampMarkInk = {
  body: "currentColor",
  edge: "currentColor",
  face: "var(--color-surface)",
};

/**
 * A-21 · Logo
 *
 * The coach, as the product's mark: a 5 mm LED with a face — dome, flange, and
 * one leg longer than the other. It was a signal path turning onto a pad until
 * the product grew a figure people could name, and a mark you can name beats a
 * mark that argues. The drawing itself is `ui/lamp-mark.ts`, which is also what
 * `public/logo.svg` and the tab icon are built from, so the header and the tab
 * cannot drift apart.
 *
 * Two-tone by default, because the mascot is: `tone="current"` gives the
 * one-colour stamp for a specimen sheet or a monochrome surface.
 *
 * The wordmark reads from `brand.name`, so renaming the product renames the
 * logo too.
 */
export function LogoMark({
  size = 24,
  tone = "brand",
  className,
}: {
  size?: number;
  /** `brand` is the mascot's own blue; `current` inherits the text colour. */
  tone?: "brand" | "current";
  className?: string;
}) {
  return (
    <svg
      viewBox={lampMarkViewBox}
      width={size}
      height={size}
      aria-hidden="true"
      className={cn("shrink-0", className)}
      /* A constant, built by `lampMarkMarkup` out of the numbers in its own
         file. Nothing from outside that module reaches this string — it is the
         same one the committed `public/logo.svg` holds, which is the point:
         one drawing for the page and for the rasterised icons. */
      dangerouslySetInnerHTML={{
        __html: lampMarkMarkup(tone === "brand" ? lampMarkInk : stampInk),
      }}
    />
  );
}

export function Wordmark({
  size = 20,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span className={cn("text-ink inline-flex items-center gap-2", className)}>
      <LogoMark size={size} />
      <span className="text-h3 tracking-[-0.01em]">{brand.name}</span>
    </span>
  );
}

/**
 * S-01 · The nameplate.
 *
 * `PILOTCIRCUITS` set solid in the condensed face, because on this surface the
 * product name is stencilled on the bench rather than typeset in a header.
 *
 * The mark beside it used to be a second glyph — a wide signal trace with
 * junctions on it, drawn for the proportion a workshop nameplate wants. It is
 * gone: two marks for one product is how a small brand goes quietly wrong, and
 * the lamp reads from across a bench at 34 px as well as it reads at 20 in a
 * dense bar. Same string as `Wordmark` — both read `brand.name`, so the two
 * cannot drift — only cased and cut differently.
 */
export function WorkshopWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("text-ink inline-flex items-center gap-3.5", className)}>
      <LogoMark size={34} />
      {/* Below 640 the plate has room for the mark, the nav and the status
          light but not for the name as well. The mark is the half that
          survives; the link keeps its accessible name either way. */}
      <span className="font-condensed hidden text-[28px] leading-none font-bold tracking-[0.005em] uppercase sm:inline">
        {brand.name}
      </span>
    </span>
  );
}

/**
 * A-22 · Agent mark
 *
 * Deliberately not a face, an orb, or a sparkle. The agent's job here is to
 * read the build's context graph, so its mark is a node with three live
 * connections — the same visual family as the circuit canvas.
 *
 * It is not the logo and it never was: the logo is the coach the person talks
 * to, and this is the little instrument in the panel header that says whether a
 * call is running. They sit two centimetres apart on the bench and mean
 * different things.
 */
export function AgentMark({
  size = 28,
  active = false,
  className,
}: {
  size?: number;
  /** Brightens the links while a tool call is running. */
  active?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "border-border bg-surface grid shrink-0 place-items-center rounded-md border",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 20 20"
        width={size - 8}
        height={size - 8}
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M10 10 L 10 3 M10 10 L 16 14 M10 10 L 4 14"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          className={active ? "text-accent" : "text-ink-tertiary"}
        />
        <circle cx="10" cy="3" r="1.7" className="fill-accent" />
        <circle
          cx="16"
          cy="14"
          r="1.7"
          className={active ? "fill-accent" : "fill-ink-tertiary"}
        />
        <circle
          cx="4"
          cy="14"
          r="1.7"
          className={active ? "fill-accent" : "fill-ink-tertiary"}
        />
        <circle
          cx="10"
          cy="10"
          r="2.6"
          className="fill-surface stroke-ink"
          strokeWidth="1.6"
        />
      </svg>
    </span>
  );
}
