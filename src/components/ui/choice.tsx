"use client";

import type { ReactNode } from "react";
import { useEffect, useId, useRef } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { useCopy } from "@/content/copy-provider";
import { cn } from "@/lib/utils/cn";

/**
 * A-11 · Check row
 *
 * The kit checklist, and anything else shaped like it. This is not a consent
 * box and not a settings toggle — it is an inventory mark on a list the user
 * runs down once before starting a build. Nothing is blocked by leaving one
 * unticked, so it reads as counting stock rather than agreeing to terms.
 *
 * Unticked is a slot waiting to be filled: sunken surface, dashed ring, a plus,
 * and the word "Add". Ticked turns green and says "Have it". The whole row is
 * the target, and the state word means a glance down the list is enough to see
 * what is missing — no reading required.
 */

export type CheckState = "unchecked" | "checked" | "partial";

export function CheckRow({
  checked,
  indeterminate = false,
  onCheckedChange,
  label,
  description,
  disabled,
  labels,
  className,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onCheckedChange: (next: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  /** Overrides the default `Have it` / `Add` / `Some` wording. */
  labels?: { checked: string; unchecked: string; partial: string };
  className?: string;
}) {
  const copy = useCopy();
  const partial = indeterminate && !checked;
  const words = labels ?? {
    checked: copy.projectDetail.haveIt,
    unchecked: copy.projectDetail.addIt,
    partial: copy.projectDetail.someOf,
  };

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={partial ? "mixed" : checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-instant ease-out-soft",
        disabled && "pointer-events-none opacity-50",
        checked
          ? "bg-success-soft/70 shadow-badge"
          : "bg-surface-sunken hover:bg-surface hover:shadow-badge",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "grid size-6 shrink-0 place-items-center rounded-full transition-all duration-instant ease-out-soft",
          checked
            ? "bg-success text-ink-inverse"
            : partial
              ? "bg-warning text-ink-inverse"
              : "border-border-strong text-ink-tertiary border-2 border-dashed",
        )}
      >
        {checked ? (
          <Check size={14} strokeWidth={3} className="motion-pop" />
        ) : partial ? (
          <Minus size={14} strokeWidth={3} className="motion-pop" />
        ) : (
          <Plus size={13} strokeWidth={2.5} />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="text-body-sm text-ink block font-medium">{label}</span>
        {description ? (
          <span className="text-caption text-ink-tertiary block leading-snug">
            {description}
          </span>
        ) : null}
      </span>

      <span
        className={cn(
          "text-caption shrink-0 font-medium transition-colors duration-instant",
          checked
            ? "text-success"
            : partial
              ? "text-warning-hover"
              : "text-ink-tertiary",
        )}
      >
        {checked ? words.checked : partial ? words.partial : words.unchecked}
      </span>
    </button>
  );
}

/**
 * Compact checkbox for places a full row will not fit — filter popovers,
 * inline options. Same round mark as the row, minus the surface and the word.
 */
export function Checkbox({
  checked,
  indeterminate = false,
  onCheckedChange,
  label,
  description,
  disabled,
  className,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onCheckedChange: (next: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  const id = useId();
  const partial = indeterminate && !checked;

  return (
    <div className={cn("flex gap-2.5", className)}>
      <span className="relative flex size-5 shrink-0 items-center pt-px">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          ref={(node) => {
            if (node) node.indeterminate = indeterminate;
          }}
          onChange={(event) => onCheckedChange(event.target.checked)}
          className="peer absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        />
        <span
          aria-hidden="true"
          className={cn(
            "peer-focus-visible:ring-focus pointer-events-none grid size-5 place-items-center rounded-full border-2 transition-all duration-instant ease-out-soft",
            checked || partial
              ? "bg-accent border-accent text-ink-inverse"
              : "bg-surface border-border-strong peer-hover:border-accent",
            disabled && "opacity-45",
          )}
        >
          {partial ? (
            <Minus size={12} strokeWidth={3.5} className="motion-pop" />
          ) : checked ? (
            <Check size={12} strokeWidth={3.5} className="motion-pop" />
          ) : null}
        </span>
      </span>
      <label
        htmlFor={id}
        className={cn(
          "text-body-sm min-w-0 cursor-pointer select-none",
          disabled ? "text-ink-tertiary" : "text-ink",
        )}
      >
        {label}
        {description ? (
          <span className="text-caption text-ink-tertiary mt-0.5 block leading-snug">
            {description}
          </span>
        ) : null}
      </label>
    </div>
  );
}

/**
 * A-12 · Radio option
 *
 * Built for the knowledge check after a correction, so it has a card body and
 * an answered state — correct, incorrect, or the unpicked-but-correct answer
 * that gets revealed once the user has committed.
 */

export type AnswerState = "idle" | "correct" | "incorrect" | "revealed";

export function RadioOption({
  name,
  value,
  checked,
  onSelect,
  state = "idle",
  disabled,
  children,
  className,
}: {
  name: string;
  value: string;
  checked: boolean;
  onSelect: (value: string) => void;
  state?: AnswerState;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const id = useId();

  const frame: Record<AnswerState, string> = {
    idle: checked
      ? "border-accent bg-accent-soft layer-active"
      : "border-border bg-surface hover:border-border-strong hover:bg-surface-hover",
    correct: "border-success-border bg-success-soft",
    incorrect: "border-error-border bg-error-soft",
    revealed: "border-success-border bg-surface",
  };

  const mark: Record<AnswerState, string> = {
    idle: checked ? "border-accent" : "border-border-strong",
    correct: "border-success",
    incorrect: "border-error",
    revealed: "border-success",
  };

  const dot: Record<AnswerState, string> = {
    idle: "bg-accent",
    correct: "bg-success",
    incorrect: "bg-error",
    revealed: "bg-success",
  };

  return (
    <div className={cn("relative", className)}>
      <input
        id={id}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onSelect(value)}
        className="peer sr-only"
      />
      <label
        htmlFor={id}
        className={cn(
          "text-body-sm text-ink flex cursor-pointer items-start gap-2.5 rounded-xl border px-4 py-3 transition-colors duration-instant ease-out-soft",
          "peer-focus-visible:ring-focus",
          frame[state],
          disabled && "cursor-default",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-full border-2 transition-colors",
            mark[state],
          )}
        >
          {checked || state === "correct" || state === "revealed" ? (
            <span
              className={cn("motion-pop size-2 rounded-full", dot[state])}
            />
          ) : null}
        </span>
        <span className="min-w-0">{children}</span>
      </label>
    </div>
  );
}

/**
 * A-13 · Segmented control
 *
 * `Reference / Current / Compare` on the canvas and the coaching level in the
 * agent panel. A sunken track with one raised thumb that **slides** between
 * segments rather than blinking from one to the next.
 *
 * The sliding matters beyond polish: the agent changes these controls through
 * WebMCP, and a segment that simply appears somewhere else is a change the
 * user can miss entirely. Movement is what makes an agent's action legible.
 *
 * The thumb is positioned by writing straight to the DOM rather than through
 * state — segments are label-width, so the offset has to be measured, and a
 * measure-then-setState round trip would render twice on every switch.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onValueChange,
  size = "md",
  label,
  className,
}: {
  options: { value: T; label: string; icon?: ReactNode }[];
  value: T;
  onValueChange: (next: T) => void;
  size?: "sm" | "md";
  /** Accessible name for the group. */
  label: string;
  className?: string;
}) {
  const thumbRef = useRef<HTMLSpanElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const activeIndex = options.findIndex((o) => o.value === value);

  useEffect(() => {
    const item = itemRefs.current[activeIndex];
    const thumb = thumbRef.current;
    if (!item || !thumb) return;

    thumb.style.width = `${item.offsetWidth}px`;
    thumb.style.transform = `translateX(${item.offsetLeft}px)`;
    /* Skip the transition on first placement so the thumb does not fly in
       from the left edge on mount. */
    if (thumb.dataset.ready !== "true") {
      thumb.getBoundingClientRect();
      thumb.dataset.ready = "true";
    }
  }, [activeIndex, options, size]);

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "bg-surface-sunken layer-sunken relative inline-flex rounded-full p-1",
        className,
      )}
    >
      <span
        ref={thumbRef}
        aria-hidden="true"
        className={cn(
          "bg-surface shadow-e1 absolute top-1 left-0 rounded-full opacity-0",
          "transition-[transform,width] duration-settle ease-out-soft",
          "data-[ready=true]:opacity-100",
          size === "sm" ? "h-8" : "h-9",
        )}
      />
      {options.map((option, index) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            ref={(node) => {
              itemRefs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onValueChange(option.value)}
            className={cn(
              "relative z-10 inline-flex items-center justify-center gap-1.5 rounded-full font-medium transition-colors duration-quick ease-out-soft",
              size === "sm" ? "text-caption h-8 px-3" : "text-body-sm h-9 px-4",
              active ? "text-ink" : "text-ink-secondary hover:text-ink",
            )}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * A-14 · Switch
 *
 * Only used for canvas layer toggles, where the change is instant and
 * reversible. Anything that needs confirmation is a button, not a switch.
 */
export function Switch({
  checked,
  onCheckedChange,
  label,
  disabled,
  className,
}: {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  label: ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "text-body-sm group flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 transition-colors duration-instant",
        disabled ? "text-ink-tertiary" : "text-ink hover:bg-surface-hover",
        className,
      )}
    >
      <span className="min-w-0 text-left">{label}</span>
      <span
        aria-hidden="true"
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors duration-instant ease-out-soft",
          checked ? "bg-accent" : "bg-border-strong",
          disabled && "opacity-45",
        )}
      >
        <span
          className={cn(
            "bg-surface absolute top-0.5 size-4 rounded-full shadow-e1 transition-[left] duration-instant ease-out-soft",
            checked ? "left-[18px]" : "left-0.5",
          )}
        />
      </span>
    </button>
  );
}
