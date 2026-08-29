"use client";

import type { ReactNode } from "react";
import {
  AudioLines,
  CircleAlert,
  CircleCheck,
  CircuitBoard,
  Cpu,
  Eye,
  Info,
  LoaderCircle,
  TriangleAlert,
  Unplug,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { icon } from "@/lib/design/tokens";
import { useCopy } from "@/content/copy-provider";
import { cn } from "@/lib/utils/cn";

/**
 * A-03 · Status badge
 *
 * A raised white capsule with a coloured glyph and dark text. Colour lives in
 * the icon, never in the label, so every badge keeps full text contrast while
 * staying scannable by hue — and a row of seven reads as one calm system
 * instead of seven competing highlights.
 *
 * `Demo feed` and `Board simulated` sit in the workbench topbar for the entire
 * session. They are the product's promise that nothing here is pretending to
 * be real hardware, so they have to stay legible without shouting.
 */

export type BadgeTone =
  "neutral" | "accent" | "success" | "warning" | "teal" | "error";

const glyphTones: Record<BadgeTone, string> = {
  neutral: "text-ink-tertiary",
  accent: "text-accent",
  success: "text-success",
  warning: "text-warning",
  teal: "text-teal",
  error: "text-error",
};

export interface StatusBadgeProps {
  tone?: BadgeTone;
  /** The coloured glyph. */
  glyph?: ReactNode;
  /** Spins the glyph — used by `In progress`. */
  spin?: boolean;
  className?: string;
  children: ReactNode;
}

export function StatusBadge({
  tone = "neutral",
  glyph,
  spin = false,
  className,
  children,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "bg-surface shadow-badge text-caption text-ink inline-flex h-7 items-center gap-1.5 rounded-full pr-3 pl-2.5 font-medium whitespace-nowrap",
        className,
      )}
    >
      {glyph ? (
        <span
          aria-hidden="true"
          className={cn(
            "grid shrink-0 place-items-center",
            glyphTones[tone],
            spin && "motion-safe:animate-spin",
          )}
        >
          {glyph}
        </span>
      ) : null}
      {children}
    </span>
  );
}

const g = { size: icon.sm, strokeWidth: 2 } as const;

/**
 * The product's known states, defined once so a badge never drifts between the
 * dashboard, a project card and the workbench topbar.
 */
export const statusPresets = {
  ready: { tone: "success", glyph: <CircleCheck {...g} /> },
  preview: { tone: "neutral", glyph: <Eye {...g} /> },
  inProgress: { tone: "accent", glyph: <LoaderCircle {...g} />, spin: true },
  webMcpReady: { tone: "accent", glyph: <Cpu {...g} /> },
  /* Batch 8 · the other half of the same claim. `WebMCP ready` printed on a
     browser without the API is the interface asserting something it has not
     checked, which is the one thing §18 names outright. The nav probes and says
     which it found; absence gets its own glyph rather than a greyed `Cpu`
     (rule 7). */
  webMcpUnavailable: { tone: "neutral", glyph: <Unplug {...g} /> },
  demoFeed: { tone: "warning", glyph: <AudioLines {...g} /> },
  boardSimulated: { tone: "neutral", glyph: <CircuitBoard {...g} /> },
  agentConnected: { tone: "success", glyph: <Wifi {...g} /> },
  /* Absence gets its own glyph, not the same one greyed out: rule 7 wants the
     shape to carry the state before the colour does. The workbench topbar is
     where this shows, and it is the one badge of the three that can change. */
  agentOffline: { tone: "neutral", glyph: <WifiOff {...g} /> },
} satisfies Record<string, Omit<StatusBadgeProps, "children">>;

export type StatusPreset = keyof typeof statusPresets;

/** Convenience wrapper: `<StatusChip status="demoFeed">Demo feed</StatusChip>` */
export function StatusChip({
  status,
  className,
  children,
}: {
  status: StatusPreset;
  className?: string;
  children: ReactNode;
}) {
  return (
    <StatusBadge {...statusPresets[status]} className={className}>
      {children}
    </StatusBadge>
  );
}

/**
 * A-04 · Severity pill
 *
 * The same shell, because severity is a status. Icon plus word, always — a
 * finding card sits next to coloured wires, so its severity cannot rely on a
 * colour swatch to be read.
 */

export type Severity = "critical" | "warning" | "info";

/* Shape and tone only — the word is looked up, like every other word. */
const severityMeta = {
  critical: { Icon: TriangleAlert, tone: "error" as BadgeTone },
  warning: { Icon: CircleAlert, tone: "warning" as BadgeTone },
  info: { Icon: Info, tone: "accent" as BadgeTone },
} as const;

/**
 * One severity, one tone, one shape — wherever it is drawn. The pill and the
 * editorial disc read from the same map, so a finding cannot change shape by
 * moving between the agent panel and the inspection modal.
 */
export const severityToTone = {
  critical: "error",
  warning: "warning",
  info: "info",
} as const satisfies Record<Severity, "error" | "warning" | "info">;

export function SeverityPill({
  severity,
  label,
  className,
}: {
  severity: Severity;
  /** Overrides the default word. */
  label?: string;
  className?: string;
}) {
  const copy = useCopy();
  const meta = severityMeta[severity];

  return (
    <StatusBadge
      tone={meta.tone}
      glyph={<meta.Icon {...g} />}
      className={className}
    >
      {label ?? copy.findings.severity[severity]}
    </StatusBadge>
  );
}

/**
 * A-05 · Chip
 *
 * Same family as the status badge — raised white capsule, soft shadow — but
 * three things keep them apart at a glance:
 *
 *   1. A badge always carries a coloured glyph; a chip never does.
 *   2. A chip is 32px to the badge's 28px, so the row it sits in reads as
 *      slightly heavier and clickable.
 *   3. Only a chip has states. It lifts on hover, turns blue when selected,
 *      and can carry a remove control.
 *
 * The result: a badge tells you something, a chip lets you do something, and
 * you can tell which is which without reading either.
 */

export interface ChipProps {
  children: ReactNode;
  /** Renders as a button and reflects pressed state. */
  selected?: boolean;
  onToggle?: () => void;
  /**
   * Renders as a button that *goes somewhere* rather than switching on and off
   * — the agent panel's affected-node chips take the canvas to a pin. A toggle
   * would report `aria-pressed`, which for navigation is simply untrue.
   */
  onActivate?: () => void;
  /** Overrides the accessible name; the arrow in `Board → D7` is not spoken. */
  label?: string;
  /** Adds a remove affordance; implies the chip is an applied filter. */
  onRemove?: () => void;
  iconLeft?: ReactNode;
  className?: string;
}

export function Chip({
  children,
  selected,
  onToggle,
  onActivate,
  label,
  onRemove,
  iconLeft,
  className,
}: ChipProps) {
  const copy = useCopy();
  const shell =
    "text-caption inline-flex h-8 items-center gap-1.5 rounded-full px-3 font-medium whitespace-nowrap transition-all duration-instant ease-out-soft";

  if (onActivate) {
    return (
      <button
        type="button"
        onClick={onActivate}
        aria-label={label}
        className={cn(
          shell,
          "bg-surface text-ink-secondary shadow-badge hover:text-ink hover:shadow-btn-surface-lift active:shadow-badge",
          className,
        )}
      >
        {iconLeft}
        {children}
      </button>
    );
  }

  if (onToggle) {
    return (
      <button
        type="button"
        aria-pressed={selected}
        onClick={onToggle}
        className={cn(
          shell,
          selected
            ? "bg-accent-soft text-accent-active shadow-chip-selected"
            : "bg-surface text-ink-secondary shadow-badge hover:text-ink hover:shadow-btn-surface-lift active:shadow-badge",
          className,
        )}
      >
        {iconLeft}
        {children}
      </button>
    );
  }

  return (
    <span
      className={cn(
        shell,
        "bg-surface text-ink-secondary shadow-badge",
        onRemove && "pr-1.5",
        className,
      )}
    >
      {iconLeft}
      {children}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={copy.a11y.removeFilter(
            typeof children === "string" ? children : "",
          )}
          className="text-ink-tertiary hover:bg-surface-active hover:text-ink -mr-0.5 grid size-5 place-items-center rounded-full transition-colors"
        >
          <X size={12} strokeWidth={2.25} aria-hidden="true" />
        </button>
      ) : null}
    </span>
  );
}
