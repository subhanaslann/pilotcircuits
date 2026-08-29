"use client";

import { useState, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { useCopy } from "@/content/copy-provider";
import { icon } from "@/lib/design/tokens";
import { cn } from "@/lib/utils/cn";

/**
 * M-09 · Disclosure
 *
 * Carries the product's teaching contract: the explanation is available but
 * never forced. `Why D7?` on the canvas and `Developer details` on every
 * activity entry are both this, and raw JSON stays collapsed by default.
 *
 * Uncontrolled by default. Pass `open` to drive it from outside — the agent
 * raising the coaching level has to be able to open the teaching ladder itself,
 * and a disclosure that only the user can open would silently swallow that
 * (design-language.md, rule 6: a change that isn't seen didn't happen).
 */
export function Disclosure({
  summary,
  defaultOpen = false,
  open: openProp,
  onOpenChange,
  tone = "default",
  className,
  children,
}: {
  summary: ReactNode;
  defaultOpen?: boolean;
  /** Controlled state. Omit for the uncontrolled behaviour. */
  open?: boolean;
  /** Fires on every toggle, controlled or not. */
  onOpenChange?: (next: boolean) => void;
  /** `quiet` is the developer-details variant: smaller and dimmer. */
  tone?: "default" | "quiet";
  className?: string;
  children: ReactNode;
}) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen);
  const controlled = openProp !== undefined;
  const open = controlled ? openProp : uncontrolled;

  const toggle = () => {
    const next = !open;
    if (!controlled) setUncontrolled(next);
    onOpenChange?.(next);
  };

  return (
    <div className={cn("min-w-0", className)}>
      <button
        type="button"
        aria-expanded={open}
        onClick={toggle}
        className={cn(
          "group flex w-full items-center gap-1.5 rounded-md py-1.5 text-left transition-colors duration-instant",
          tone === "quiet"
            ? "text-caption text-ink-tertiary hover:text-ink-secondary"
            : "text-body-sm text-accent hover:text-accent-hover font-medium",
        )}
      >
        <ChevronRight
          size={icon.xs}
          strokeWidth={icon.strokeWidth}
          aria-hidden="true"
          className={cn(
            "shrink-0 transition-transform duration-instant ease-out-soft",
            open && "rotate-90",
          )}
        />
        <span className="min-w-0">{summary}</span>
      </button>

      {open ? (
        <div
          className={cn(
            "motion-expand pt-1 pb-2 pl-[22px]",
            tone === "quiet"
              ? "text-caption text-ink-secondary"
              : "text-body-sm text-ink-secondary",
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Collapsed-by-default JSON viewer used inside developer details. Never the
 * first thing a user sees — the human-readable summary always comes first.
 */
export function RawJson({
  value,
  label,
}: {
  value: unknown;
  label?: string;
}) {
  const copy = useCopy();

  return (
    <Disclosure tone="quiet" summary={label ?? copy.agentPanel.rawResult}>
      <pre className="bg-surface-sunken text-mono-sm text-ink-secondary max-h-56 overflow-auto rounded-md p-2.5 font-mono">
        {JSON.stringify(value, null, 2)}
      </pre>
    </Disclosure>
  );
}
