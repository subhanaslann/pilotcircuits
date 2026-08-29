"use client";

import { useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * A-18 · Tooltip
 *
 * Opens on hover and on keyboard focus, closes on Escape. Purely
 * supplementary: nothing in the product is only explained in a tooltip, so
 * losing it costs the user nothing.
 */
export function Tooltip({
  content,
  side = "top",
  delay = 350,
  className,
  children,
}: {
  content: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  /** Hover delay in ms. Focus opens immediately. */
  delay?: number;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openLater = () => {
    timer.current = setTimeout(() => setOpen(true), delay);
  };

  const closeNow = () => {
    if (timer.current) clearTimeout(timer.current);
    setOpen(false);
  };

  const position = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-1.5",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-1.5",
    left: "right-full top-1/2 -translate-y-1/2 mr-1.5",
    right: "left-full top-1/2 -translate-y-1/2 ml-1.5",
  }[side];

  return (
    <span
      className={cn("relative inline-flex", className)}
      onMouseEnter={openLater}
      onMouseLeave={closeNow}
      onFocus={() => setOpen(true)}
      onBlur={closeNow}
      onKeyDown={(event) => {
        if (event.key === "Escape") closeNow();
      }}
    >
      {children}
      <span
        role="tooltip"
        hidden={!open}
        className={cn(
          "bg-surface-inverse text-ink-inverse text-caption pointer-events-none absolute z-50 w-max max-w-56 rounded-sm px-2 py-1 shadow-e3",
          position,
        )}
      >
        {content}
      </span>
    </span>
  );
}
