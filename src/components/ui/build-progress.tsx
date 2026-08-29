"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, TriangleAlert } from "lucide-react";
import { useCopy } from "@/content/copy-provider";
import { cn } from "@/lib/utils/cn";

/**
 * A-15 · Build progress
 *
 * Progress in this product is not a percentage — it is seven named steps, one
 * of which can be blocked by a finding. So the headline is the fraction, read
 * as an instrument reading, and the ticks beside it let you count what is left
 * without reading a number at all.
 *
 * Collapsed it answers "how far am I"; expanded it answers "which step, and
 * what happened". The agent drives both: `verify_current_step` advances the
 * fraction, `inspect_build` turns a tick amber. Every change is animated,
 * because a change the user cannot see is a change the agent made in secret.
 */

export type StepStatus = "completed" | "active" | "issue" | "upcoming";

export interface BuildStep {
  id: string;
  name: string;
  /** Estimated minutes, shown in the expanded list. */
  minutes?: number;
  status: StepStatus;
}

const tickTone: Record<StepStatus, string> = {
  completed: "bg-accent",
  active: "bg-accent",
  issue: "bg-warning",
  upcoming: "bg-surface-sunken",
};

/** The active tick stands taller so the eye lands on it first. */
const tickHeight: Record<StepStatus, string> = {
  completed: "h-6",
  active: "h-8",
  issue: "h-8",
  upcoming: "h-5",
};

function Ticks({
  steps,
  onSelect,
  compact = false,
}: {
  steps: BuildStep[];
  onSelect?: (id: string) => void;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex items-center", compact ? "gap-1" : "gap-1.5")}>
      {steps.map((step, index) => {
        const current = step.status === "active" || step.status === "issue";
        return (
          <span
            key={step.id}
            title={`${index + 1}. ${step.name}`}
            onClick={onSelect ? () => onSelect(step.id) : undefined}
            className={cn(
              "grid place-items-center rounded-full transition-all duration-settle ease-out-soft",
              compact ? "w-1.5" : "w-2.5",
              compact ? (current ? "h-5" : "h-3.5") : tickHeight[step.status],
              tickTone[step.status],
              step.status === "upcoming" && "opacity-90",
              onSelect && "cursor-pointer",
            )}
          >
            {!compact && current ? (
              <span className="text-ink-inverse text-[9px] leading-none font-semibold">
                {index + 1}
              </span>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}

function Fraction({
  current,
  total,
  compact = false,
}: {
  current: number;
  total: number;
  compact?: boolean;
}) {
  return (
    <span
      className={cn(
        "text-ink tnum inline-flex items-baseline font-mono leading-none font-semibold tracking-tight",
        compact ? "text-mono-lg" : "text-[34px]",
      )}
    >
      {current}
      <span
        aria-hidden="true"
        className={cn(
          "text-border-strong mx-0.5 font-normal",
          compact ? "" : "text-[30px]",
        )}
      >
        /
      </span>
      {total}
    </span>
  );
}

/**
 * The step's state as one 20px disc: a tick, a triangle, or its number.
 *
 * Exported because Batch 7's step rail (W-02) shows the same seven steps in a
 * column beside the canvas. Two drawings of one state is how the rail and the
 * topbar end up disagreeing about which step is blocked — so there is one, and
 * both read from it. Colour is never alone on it: completed carries a tick,
 * blocked a triangle, and everything else its own number (rule 7).
 */
export function StepMark({
  status,
  index,
  className,
}: {
  status: StepStatus;
  /** Zero-based; the disc prints `index + 1`. */
  index: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-5 shrink-0 place-items-center rounded-full transition-colors duration-settle",
        status === "completed" && "bg-accent text-ink-inverse",
        status === "active" && "bg-accent text-ink-inverse",
        status === "issue" && "bg-warning text-ink-inverse",
        status === "upcoming" && "bg-surface-sunken text-ink-tertiary",
        className,
      )}
    >
      {status === "completed" ? (
        <Check size={12} strokeWidth={3} className="motion-pop" />
      ) : status === "issue" ? (
        <TriangleAlert size={11} strokeWidth={2.5} className="motion-pop" />
      ) : (
        <span className="text-mono-sm font-mono text-[10px] leading-none">
          {index + 1}
        </span>
      )}
    </span>
  );
}

function ExpandedList({
  steps,
  onSelect,
}: {
  steps: BuildStep[];
  onSelect?: (id: string) => void;
}) {
  return (
    <ol className="space-y-0.5">
      {steps.map((step, index) => {
        const interactive = !!onSelect && step.status !== "upcoming";
        const Row = interactive ? "button" : "div";
        return (
          <li key={step.id}>
            <Row
              {...(interactive
                ? { type: "button" as const, onClick: () => onSelect(step.id) }
                : {})}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors duration-instant",
                interactive && "hover:bg-surface-hover",
                step.status === "active" && "bg-accent-soft",
                step.status === "issue" && "bg-warning-soft/70",
              )}
            >
              <StepMark status={step.status} index={index} />

              <span
                className={cn(
                  "text-body-sm min-w-0 flex-1 truncate",
                  step.status === "upcoming" ? "text-ink-tertiary" : "text-ink",
                  (step.status === "active" || step.status === "issue") &&
                    "font-medium",
                )}
              >
                {step.name}
              </span>

              {step.minutes ? (
                <span className="text-mono-sm text-ink-tertiary tnum shrink-0 font-mono">
                  {step.minutes}m
                </span>
              ) : null}
            </Row>
          </li>
        );
      })}
    </ol>
  );
}

export interface BuildProgressProps {
  steps: BuildStep[];
  /** Renders the topbar single-line variant. */
  compact?: boolean;
  /** Jump to a step. Omit to make the control read-only. */
  onSelectStep?: (id: string) => void;
  /** Short label under the fraction; defaults to the current step's name. */
  caption?: string;
  className?: string;
}

export function BuildProgress({
  steps,
  compact = false,
  onSelectStep,
  caption,
  className,
}: BuildProgressProps) {
  const copy = useCopy();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const activeIndex = steps.findIndex(
    (s) => s.status === "active" || s.status === "issue",
  );
  const current = activeIndex >= 0 ? activeIndex + 1 : steps.length;
  const activeStep = steps[activeIndex];
  const blocked = activeStep?.status === "issue";

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) close();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const select = (id: string) => {
    onSelectStep?.(id);
    close();
  };

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-label={
          blocked
            ? copy.a11y.buildProgressBlocked(current, steps.length)
            : copy.a11y.buildProgress(current, steps.length)
        }
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "bg-surface text-left transition-all duration-instant ease-out-soft",
          compact
            ? "shadow-badge hover:shadow-btn-surface-lift flex h-10 items-center gap-2.5 rounded-full px-3"
            : "shadow-btn-surface hover:shadow-btn-surface-lift block rounded-2xl px-4 py-3",
        )}
      >
        {compact ? (
          <>
            <Fraction current={current} total={steps.length} compact />
            <Ticks steps={steps} compact />
            {blocked ? (
              <span
                aria-hidden="true"
                className="bg-warning size-1.5 shrink-0 rounded-full"
              />
            ) : null}
          </>
        ) : (
          <>
            <span className="flex items-center gap-4">
              <Fraction current={current} total={steps.length} />
              <Ticks steps={steps} />
            </span>
            <span className="mt-2.5 flex items-center justify-between gap-4">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-4 w-0.5 shrink-0 rounded-full transition-colors duration-settle",
                    blocked ? "bg-warning" : "bg-accent",
                  )}
                />
                <span className="text-body-sm text-ink truncate">
                  {caption ?? activeStep?.name}
                </span>
              </span>
              {blocked ? (
                <span className="bg-warning-soft text-warning-hover text-overline inline-flex h-5 shrink-0 items-center gap-1 rounded-full px-2 uppercase">
                  <TriangleAlert
                    size={10}
                    strokeWidth={2.5}
                    aria-hidden="true"
                  />
                  {copy.agentPanel.context.blocked}
                </span>
              ) : null}
            </span>
          </>
        )}
      </button>

      {open ? (
        <div
          className="bg-surface border-border shadow-e3 motion-pop absolute top-[calc(100%+8px)] left-0 z-40 w-72 origin-top rounded-xl border p-2"
          role="group"
          aria-label={copy.a11y.buildSteps}
        >
          <p className="text-overline text-ink-tertiary px-2 pt-1 pb-2 uppercase">
            {copy.projectDetail.stepPreview}
          </p>
          <ExpandedList
            steps={steps}
            onSelect={onSelectStep ? select : undefined}
          />
        </div>
      ) : null}
    </div>
  );
}
