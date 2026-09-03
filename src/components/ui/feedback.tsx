"use client";

import type { ReactNode } from "react";
import { Check, Loader2, Minus, TriangleAlert, X } from "lucide-react";
import { useCopy } from "@/content/copy-provider";
import { icon } from "@/lib/design/tokens";
import { cn } from "@/lib/utils/cn";

/**
 * A-15 · Progress bar
 *
 * Percentage-shaped progress only — how much of a kit is checked off, how far a
 * long action has got. Build progress is *not* this: it is seven named steps,
 * one of which can be blocked, and it has its own control in
 * `build-progress.tsx`.
 *
 * Two shapes, picked by whether the thing being measured is countable:
 *
 *   `segments` given → one tick per item, because five parts should be counted
 *   rather than estimated from a bar's length.
 *   `segments` omitted → a continuous track, for anything without discrete units.
 *
 * Completing swaps the tone to success and puts a tick beside the label, so the
 * finish is a state change rather than a bar that merely reaches its end.
 */
export function ProgressBar({
  value,
  max = 100,
  label,
  valueLabel,
  /** Number of discrete items. Renders one tick each. */
  segments,
  tone = "accent",
  className,
}: {
  value: number;
  max?: number;
  label?: ReactNode;
  /** Right-aligned readout, e.g. "3 of 5 parts". */
  valueLabel?: ReactNode;
  segments?: number;
  tone?: "accent" | "success";
  className?: string;
}) {
  const copy = useCopy();
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const complete = value >= max;
  const fill = complete || tone === "success" ? "bg-success" : "bg-accent";
  const lift =
    complete || tone === "success"
      ? "shadow-[0_1px_2px_rgba(22,163,106,0.35)]"
      : "shadow-[0_1px_2px_rgba(10,102,224,0.35)]";

  return (
    <div className={cn("w-full", className)}>
      {label || valueLabel ? (
        <div className="mb-2 flex items-baseline justify-between gap-3">
          {label ? (
            <span className="flex min-w-0 items-center gap-1.5">
              <span
                aria-hidden="true"
                className={cn(
                  "grid size-4 shrink-0 place-items-center rounded-full transition-all duration-settle ease-out-soft",
                  complete
                    ? "bg-success text-ink-inverse"
                    : "border-border-strong border-2 border-dashed",
                )}
              >
                {complete ? (
                  <Check size={10} strokeWidth={3.5} className="motion-pop" />
                ) : null}
              </span>
              <span className="text-body-sm text-ink truncate font-medium">
                {label}
              </span>
            </span>
          ) : null}
          {valueLabel ? (
            <span
              className={cn(
                "text-mono-sm tnum shrink-0 font-mono transition-colors duration-settle",
                complete ? "text-success" : "text-ink-tertiary",
              )}
            >
              {valueLabel}
            </span>
          ) : null}
        </div>
      ) : null}

      {segments ? (
        <div
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={typeof label === "string" ? label : copy.a11y.progress}
          className="flex gap-1"
        >
          {Array.from({ length: segments }).map((_, index) => (
            <span
              key={index}
              className={cn(
                "h-2 flex-1 rounded-full transition-all duration-settle ease-out-soft",
                index < value ? cn(fill, lift) : "bg-surface-sunken",
              )}
            />
          ))}
        </div>
      ) : (
        <div
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={typeof label === "string" ? label : copy.a11y.progress}
          className="bg-surface-sunken layer-sunken h-2 w-full overflow-hidden rounded-full"
        >
          <div
            className={cn(
              "h-full rounded-full transition-[width,background-color] duration-settle ease-out-soft",
              fill,
              lift,
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * A-16 · Activity pulse
 *
 * The only thing on screen that says the agent is alive, so it carries three
 * genuinely different states — and separates them by *shape*, not just colour:
 *
 *   idle     a filled dot, breathing slowly. Attached, listening, doing nothing.
 *   working  a 3×3 lattice with a trace running its perimeter, plus the tool's
 *            name shimmering. The lattice reads as breadboard holes and the
 *            trace as the agent walking the circuit — the product's own subject
 *            matter, not a generic spinner.
 *   offline  a hollow ring. Absence drawn as absence.
 *
 * The lattice is eight dots sharing one animation with staggered delays; that
 * is what turns them into a single moving signal rather than eight blinkers.
 */

export type PulseState = "idle" | "working" | "offline";

/** Clockwise walk of the lattice perimeter. */
const ORBIT: [number, number][] = [
  [0, 0],
  [1, 0],
  [2, 0],
  [2, 1],
  [2, 2],
  [1, 2],
  [0, 2],
  [0, 1],
];

const ORBIT_MS = 1500;

function Lattice({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("relative grid size-4 shrink-0", className)}
    >
      {ORBIT.map(([x, y], index) => (
        <span
          key={`${x}-${y}`}
          className="bg-accent absolute size-[3px] rounded-full"
          style={{
            left: `${x * 6}px`,
            top: `${y * 6}px`,
            animation: `cp-orbit ${ORBIT_MS}ms linear infinite`,
            animationDelay: `${-(index / ORBIT.length) * ORBIT_MS}ms`,
          }}
        />
      ))}
      <span
        className="bg-accent/25 absolute size-[3px] rounded-full"
        style={{ left: "6px", top: "6px" }}
      />
    </span>
  );
}

export function ActivityPulse({
  state = "idle",
  /** Tool name shown while working, e.g. `inspect_build`. */
  tool,
  /** Overrides the default wording. */
  label,
  /** Wraps the indicator in a raised capsule, matching the badge family. */
  chip = false,
  /**
   * Whether this indicator is its own live region.
   *
   * Turn it off wherever the pulse is mounted permanently — the agent panel
   * header, for one. Left on, it reads every raw tool name aloud as it runs
   * (`inspect_build`, `verify_current_step`), and the panel's whole promise is
   * that the agent's work is reported in human language. The sentence goes
   * through the panel's single `LiveRegion` instead.
   */
  announce = true,
  className,
}: {
  state?: PulseState;
  tool?: string;
  label?: ReactNode;
  chip?: boolean;
  announce?: boolean;
  className?: string;
}) {
  const copy = useCopy();
  const indicator =
    state === "working" ? (
      <Lattice />
    ) : state === "idle" ? (
      <span className="relative flex size-4 shrink-0 items-center justify-center">
        <span
          aria-hidden="true"
          className="bg-success size-2.5 rounded-full motion-safe:animate-[cp-attention_3s_var(--ease-in-out-soft)_infinite]"
        />
      </span>
    ) : (
      <span className="relative flex size-4 shrink-0 items-center justify-center">
        <span
          aria-hidden="true"
          className="border-ink-disabled size-2.5 rounded-full border-2"
        />
      </span>
    );

  const text =
    label ??
    (state === "working" ? (
      <span className="text-mono-sm motion-safe:text-shimmer text-ink font-mono">
        {tool ?? "working"}
      </span>
    ) : state === "idle" ? (
      copy.status.agentConnected
    ) : (
      copy.status.agentOffline
    ));

  return (
    <span
      role={announce ? "status" : undefined}
      aria-live={announce ? "polite" : undefined}
      className={cn(
        "inline-flex items-center gap-2",
        chip &&
          "bg-surface shadow-badge text-caption h-7 rounded-full pr-3 pl-2 font-medium",
        className,
      )}
    >
      {indicator}
      {text ? (
        <span
          className={cn(
            "text-caption",
            state === "offline" ? "text-ink-tertiary" : "text-ink-secondary",
          )}
        >
          {text}
        </span>
      ) : null}
    </span>
  );
}

/**
 * The marker on the agent's activity spine, and the rung mark on the teaching
 * ladder.
 *
 * A generic timeline draws a filled dot. This product has better vocabulary of
 * its own: the spine is a copper trace and each entry is a **plated
 * through-hole pad** — an annulus with a hole, not a dot. That is the same
 * motif as the pulse lattice and the canvas grid (rule 8),
 * and it carries a real distinction for free:
 *
 *   hollow pad  the agent only looked — nothing on the bench changed
 *   filled disc the agent altered the workbench
 *
 * Outcome marks step up to a small filled disc with a white glyph, so the shape
 * says found / passed / failed before the colour does (rule 7).
 */
export type TraceMark =
  | "read"
  | "change"
  /** A person did this — the half of the work the agent cannot do. */
  | "human"
  | "found"
  | "passed"
  | "failed"
  | "pending"
  | "running";

const outcomeMarks = {
  found: { Icon: TriangleAlert, disc: "bg-warning" },
  passed: { Icon: Check, disc: "bg-success" },
  failed: { Icon: X, disc: "bg-error" },
} as const;

export function TracePad({
  mark,
  className,
}: {
  mark: TraceMark;
  className?: string;
}) {
  const outcome = outcomeMarks[mark as keyof typeof outcomeMarks];

  if (outcome) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          "text-ink-inverse motion-safe:motion-pop grid size-4 shrink-0 place-items-center rounded-full",
          outcome.disc,
          className,
        )}
      >
        <outcome.Icon size={10} strokeWidth={3} />
      </span>
    );
  }

  /* The agent is working: the marker is the pulse lattice itself. There is no
     second "in progress" animation to invent and none to keep in sync — the
     indicator in the header and the cursor on the spine are visibly the same
     organism doing the same thing. */
  if (mark === "running") {
    return <Lattice className={cn("-m-[3px]", className)} />;
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "block size-2.5 shrink-0 rounded-full",
        mark === "change"
          ? "bg-accent motion-safe:motion-pop"
          : /* A person did this, not the agent. Accent is the agent's colour;
               lending it to a human action would misattribute the work. */
            mark === "human"
            ? "bg-ink-secondary motion-safe:motion-pop"
            : mark === "pending"
              ? "border-border-strong border-2 border-dashed"
              : "border-border-strong bg-surface border-[3px]",
        className,
      )}
    />
  );
}

/**
 * A-17 · Step loader
 *
 * One row of the functional test: a status glyph, a label, and an optional
 * technical detail.
 *
 * `running` **sweeps rather than spins**. Batch 1 wrote that intent into this
 * comment and then shipped a spinning `Loader2`, which rule 8 forbids outright
 * — the product has no generic spinner — and which the device dock made
 * visible by putting three of these rows in at once: three competing cogs
 * where one calm signal belongs. Corrected the same way `Alert`'s severity
 * glyphs were.
 *
 * The sweep reuses `cp-sweep`, already defined in `globals.css`; no component
 * writes its own keyframes (rule 6). Under `prefers-reduced-motion` the bar is
 * hidden and the ring stays accent-bordered beside the word `Running`, so the
 * state is never carried by motion alone.
 */

export type StepState = "idle" | "running" | "passed" | "failed" | "skipped";

/* Colour only. The word comes from the dictionary at render time, so a row
   already on screen changes language with everything else. */
const stepMeta: Record<StepState, { cls: string; ring: string }> = {
  idle: { cls: "text-ink-tertiary", ring: "border-border-strong" },
  running: { cls: "text-accent", ring: "border-accent" },
  passed: { cls: "text-success", ring: "border-success bg-success" },
  failed: { cls: "text-error", ring: "border-error bg-error" },
  skipped: { cls: "text-ink-tertiary", ring: "border-border-strong" },
};

export function StepLoader({
  state,
  label,
  detail,
  className,
}: {
  state: StepState;
  label: ReactNode;
  /** Mono technical result: "18 cm", "0° → 90°". */
  detail?: ReactNode;
  className?: string;
}) {
  const copy = useCopy();
  const meta = stepMeta[state];

  return (
    <div className={cn("flex items-center gap-2.5 py-1.5", className)}>
      <span
        aria-hidden="true"
        className={cn(
          "relative grid size-[18px] shrink-0 place-items-center overflow-hidden rounded-full border-2 transition-colors duration-instant",
          meta.ring,
        )}
      >
        {state === "running" ? (
          /* A capsule crossing the ring, left to right: the same gesture as
             the skeleton's sweep, at the scale of a glyph. Rounded, and half
             the ring wide, so a still frame reads as something passing
             through rather than as a disc half filled — this is not a
             fraction, and rule 5 keeps fractions for things that can be
             counted. */
          <span className="bg-accent absolute inset-y-0 left-0 w-1/2 rounded-full motion-safe:animate-[cp-sweep_1.1s_var(--ease-in-out-soft)_infinite] motion-reduce:hidden" />
        ) : state === "passed" ? (
          <Check size={11} strokeWidth={3} className="text-ink-inverse" />
        ) : state === "failed" ? (
          <X size={11} strokeWidth={3} className="text-ink-inverse" />
        ) : state === "skipped" ? (
          <Minus size={11} strokeWidth={3} className="text-ink-tertiary" />
        ) : null}
      </span>

      <span className="text-body-sm text-ink min-w-0 flex-1">{label}</span>

      {detail ? (
        <span
          className={cn(
            "text-mono-sm tnum shrink-0 font-mono",
            state === "running" ? "text-ink-tertiary" : meta.cls,
          )}
        >
          {detail}
        </span>
      ) : (
        <span className={cn("text-caption shrink-0 font-medium", meta.cls)}>
          {copy.test.states[state]}
        </span>
      )}
    </div>
  );
}

/** Small inline spinner for buttons and inline loading text. */
export function Spinner({
  size = icon.sm,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Loader2
      size={size}
      strokeWidth={icon.strokeWidth}
      aria-hidden="true"
      className={cn("motion-safe:animate-spin", className)}
    />
  );
}
