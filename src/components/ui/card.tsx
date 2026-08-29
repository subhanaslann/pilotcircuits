import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * M-01 · Card shell
 *
 * The base container for project cards, findings, guidance and summaries.
 * Surfaces stay at 12–14px while controls are capsules, so shape alone tells
 * you what is pressable.
 *
 * Tone is a hairline, not a wash. A finding card sits next to coloured wires
 * and dense body copy; flooding it with amber would cost contrast on both.
 */

export type CardTone = "default" | "accent" | "warning" | "error" | "success";

const tones: Record<CardTone, string> = {
  default: "bg-surface border-border",
  accent: "bg-surface border-accent-border",
  warning: "bg-surface border-warning-border",
  error: "bg-surface border-error-border",
  success: "bg-surface border-success-border",
};

export function Card({
  tone = "default",
  interactive = false,
  padded = true,
  className,
  children,
}: {
  tone?: CardTone;
  /** Adds hover elevation. Use when the whole card is a link or button. */
  interactive?: boolean;
  padded?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "shadow-e1 rounded-lg border",
        tones[tone],
        padded && "p-4",
        interactive &&
          "hover:shadow-e2 hover:border-border-strong transition-all duration-instant ease-out-soft",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  meta,
  action,
  className,
}: {
  title: ReactNode;
  /** Small line under the title: metadata, evidence, timestamps. */
  meta?: ReactNode;
  /** Right-aligned control. */
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <h3 className="text-h3 text-ink">{title}</h3>
        {meta ? <div className="mt-0.5">{meta}</div> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function CardFooter({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("mt-4 flex flex-wrap items-center gap-4", className)}>
      {children}
    </div>
  );
}

/**
 * M-02 · Panel shell
 *
 * The workbench's left and right columns. A sticky header, one scrolling body,
 * and an optional pinned footer for the panel's primary action — so the action
 * never scrolls out of reach while the user is reading findings.
 */
export function Panel({
  header,
  footer,
  ariaLabel,
  className,
  headerClassName,
  bodyClassName,
  children,
}: {
  header?: ReactNode;
  footer?: ReactNode;
  /** Names the region. A panel the agent rewrites needs a landmark. */
  ariaLabel?: string;
  className?: string;
  /**
   * The header's own padding and rule. A header that ends in a tab bar already
   * carries a bottom border of its own — pass `pb-0 border-b-0` rather than
   * drawing the line twice.
   */
  headerClassName?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={ariaLabel}
      className={cn(
        "bg-surface border-border flex min-h-0 flex-col border",
        className,
      )}
    >
      {header ? (
        <header
          className={cn(
            "border-border bg-surface sticky top-0 z-10 shrink-0 border-b px-4 py-3",
            headerClassName,
          )}
        >
          {header}
        </header>
      ) : null}

      {/* `scroll-fade` masks the top and bottom 10px unconditionally, so the
          body needs at least that much vertical padding or the first row sits
          permanently half-faded. */}
      <div
        className={cn(
          "scroll-fade min-h-0 flex-1 overflow-y-auto",
          bodyClassName,
        )}
      >
        {children}
      </div>

      {footer ? (
        <footer className="border-border bg-surface shrink-0 border-t px-4 py-3.5">
          {footer}
        </footer>
      ) : null}
    </section>
  );
}

/**
 * M-13 · List row
 *
 * The shared skeleton behind the step rail and the component list — the same
 * shape as the kit checklist's row, so a build's lists all feel like one
 * family. A row is a surface, not a control, so it rounds to 12px rather than
 * becoming a capsule.
 */
export function ListRow({
  leading,
  trailing,
  active = false,
  as: Tag = "div",
  className,
  children,
  ...props
}: {
  leading?: ReactNode;
  trailing?: ReactNode;
  active?: boolean;
  as?: "div" | "li";
  className?: string;
  children: ReactNode;
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag
      className={cn(
        "flex items-start gap-2.5 rounded-xl px-3 py-2.5 transition-all duration-instant ease-out-soft",
        active
          ? "bg-accent-soft shadow-chip-selected"
          : "hover:bg-surface hover:shadow-badge",
        className,
      )}
      {...props}
    >
      {leading ? <span className="shrink-0 pt-px">{leading}</span> : null}
      <span className="min-w-0 flex-1">{children}</span>
      {trailing ? <span className="shrink-0">{trailing}</span> : null}
    </Tag>
  );
}

/**
 * M-14 · Key-value row
 *
 * `Board · Simulated UNO-compatible board`. Values render in mono so the
 * device dock reads like an instrument readout.
 */
export function KeyValueRow({
  label,
  value,
  mono = true,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-border/70 flex items-baseline justify-between gap-4 border-b py-1.5 last:border-0",
        className,
      )}
    >
      <dt className="text-body-sm text-ink-secondary shrink-0">{label}</dt>
      <dd
        className={cn(
          "min-w-0 text-right",
          mono
            ? "text-mono-sm tnum text-ink font-mono"
            : "text-body-sm text-ink",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
