import { brand } from "@/content/brand";
import { cn } from "@/lib/utils/cn";

/**
 * A-21 · Logo
 *
 * A signal path that turns a corner and lands on a pad — the product's whole
 * argument in one glyph: a route, a destination, and a decision point on the
 * way. Drawn on a 24-unit grid so it stays crisp at 20px in the topbar.
 *
 * The wordmark reads from `brand.name`, so renaming the product renames the
 * logo too.
 */
export function LogoMark({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      {/* Signal path: enters low-left, turns, exits toward the pad. */}
      <path
        d="M3 18.5 H 8.5 A 2 2 0 0 0 10.5 16.5 V 8 A 2 2 0 0 1 12.5 6 H 17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Junction the path passes through. */}
      <circle
        cx="10.5"
        cy="12.25"
        r="1.75"
        fill="var(--color-surface)"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      {/* Destination pad. */}
      <circle cx="19" cy="6" r="2.5" fill="currentColor" />
    </svg>
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
      <LogoMark size={size} className="text-accent" />
      <span className="text-h3 tracking-[-0.01em]">{brand.name}</span>
    </span>
  );
}

/**
 * A-22 · Agent mark
 *
 * Deliberately not a face, an orb, or a sparkle. The agent's job here is to
 * read the build's context graph, so its mark is a node with three live
 * connections — the same visual family as the circuit canvas.
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
