"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * M-03 · Tab bar
 *
 * Two homes: `Guidance / Findings / Activity` in the agent panel, and
 * `Device / Serial monitor / Test output` in the dock. Counts sit inside the
 * tab so a finding arriving while you are on another tab is visible without
 * stealing focus.
 *
 * An underline rather than a capsule, deliberately: these switch a view, they
 * do not perform an action, and the product reserves capsules for actions.
 *
 * The underline slides. The agent switches these tabs through WebMCP — moving
 * the user to Findings when it discovers something — and a marker that jumps
 * is a change the user can miss.
 */

export interface TabItem<T extends string> {
  value: T;
  label: string;
  /** Rendered as a small pill after the label; 0 hides it. */
  count?: number;
  icon?: ReactNode;
}

export function Tabs<T extends string>({
  items,
  value,
  onValueChange,
  label,
  size = "md",
  id: idProp,
  className,
}: {
  items: TabItem<T>[];
  value: T;
  onValueChange: (next: T) => void;
  /** Accessible name for the tablist. */
  label: string;
  size?: "sm" | "md";
  /**
   * Shared prefix for the tab and panel ids. Pass the same value to `TabPanel`
   * so each panel is announced with the tab that opened it; omit it and the
   * ids stay internal, which is fine when the panel is purely decorative.
   */
  id?: string;
  className?: string;
}) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const inkRef = useRef<HTMLSpanElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const activeIndex = items.findIndex((i) => i.value === value);

  useEffect(() => {
    const item = itemRefs.current[activeIndex];
    const ink = inkRef.current;
    if (!item || !ink) return;
    ink.style.width = `${item.offsetWidth}px`;
    ink.style.transform = `translateX(${item.offsetLeft}px)`;
    ink.dataset.ready = "true";
  }, [activeIndex, items, size]);

  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn("border-border relative flex gap-1 border-b", className)}
    >
      <span
        ref={inkRef}
        aria-hidden="true"
        className="bg-accent absolute bottom-0 left-0 h-0.5 rounded-full opacity-0 transition-[transform,width] duration-settle ease-out-soft data-[ready=true]:opacity-100"
      />
      {items.map((item, index) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            ref={(node) => {
              itemRefs.current[index] = node;
            }}
            type="button"
            role="tab"
            id={`${id}-${item.value}`}
            aria-selected={active}
            aria-controls={`${id}-${item.value}-panel`}
            tabIndex={active ? 0 : -1}
            onClick={() => onValueChange(item.value)}
            /* An automatic tablist: the arrow selects, and **the caret goes
               with it**. The roving tabindex flips to the newly selected tab
               the moment `onValueChange` lands, so a walk that left
               `document.activeElement` behind put the accent underline on one
               tab and the focus ring on another — the one that had just become
               `tabIndex={-1}`, so the next Tab left the strip entirely. This is
               the agent panel's main navigation and the mismatch showed on
               every arrow press. */
            onKeyDown={(event) => {
              const index = items.findIndex((i) => i.value === value);
              const to =
                event.key === "ArrowRight"
                  ? (index + 1) % items.length
                  : event.key === "ArrowLeft"
                    ? (index - 1 + items.length) % items.length
                    : undefined;
              if (to === undefined) return;
              event.preventDefault();
              onValueChange(items[to].value);
              itemRefs.current[to]?.focus();
            }}
            className={cn(
              "relative inline-flex items-center gap-1.5 font-medium transition-colors duration-quick ease-out-soft",
              size === "sm"
                ? "text-body-sm h-9 px-2.5"
                : "text-body-sm h-10 px-3",
              active ? "text-accent" : "text-ink-secondary hover:text-ink",
            )}
          >
            {item.icon}
            {item.label}
            {item.count ? (
              <span
                className={cn(
                  "text-mono-sm tnum inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 font-mono transition-colors duration-quick",
                  active
                    ? "bg-accent text-ink-inverse"
                    : "bg-surface-sunken text-ink-secondary",
                )}
              >
                {item.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/**
 * The panel a tab opens. `Tabs` and `TabPanel` are siblings rather than nested,
 * so the link between them is made by hand: pass the same `tabsId` to both and
 * give the panel its tab's `value`.
 *
 * `tabIndex={0}` is deliberate — a panel whose content is not focusable would
 * otherwise be unreachable by keyboard, and the agent switches these tabs.
 */
export function TabPanel({
  active,
  tabsId,
  value,
  className,
  children,
}: {
  active: boolean;
  /** The `id` given to `Tabs`. */
  tabsId?: string;
  /** The tab value this panel belongs to. */
  value?: string;
  className?: string;
  children: ReactNode;
}) {
  if (!active) return null;

  const wired = tabsId && value;

  return (
    <div
      role="tabpanel"
      id={wired ? `${tabsId}-${value}-panel` : undefined}
      aria-labelledby={wired ? `${tabsId}-${value}` : undefined}
      tabIndex={0}
      className={cn("motion-expand outline-none", className)}
    >
      {children}
    </div>
  );
}

/**
 * M-04 · Toolbar
 *
 * One rhythm for the library filter bar and the canvas control cluster: a
 * surface, hairline edge, 8px inner padding, and capsule controls inside.
 */
export function Toolbar({
  floating = false,
  className,
  children,
}: {
  /** Elevated variant used over the canvas. */
  floating?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "border-border bg-surface flex flex-wrap items-center gap-2 rounded-xl border p-2",
        floating ? "shadow-e2" : "shadow-e1",
        className,
      )}
    >
      {children}
    </div>
  );
}
