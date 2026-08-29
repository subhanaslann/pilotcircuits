"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useCopy } from "@/content/copy-provider";
import { icon } from "@/lib/design/tokens";
import { cn } from "@/lib/utils/cn";

/**
 * M-15 · Back header
 *
 * The workbench control bar is built on this: one clear way back, the build's
 * identity, and the session's status badges pushed to the right. Fixed at 64px
 * so the canvas below always starts at the same place.
 */
export function BackHeader({
  backHref,
  backLabel,
  title,
  meta,
  actions,
  className,
}: {
  backHref: string;
  /** Announced to assistive tech; shown as a tooltip. */
  backLabel: string;
  title: ReactNode;
  /** Sits under or beside the title: step count, progress, mode. */
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "bg-surface border-border flex h-topbar items-center gap-4 border-b px-4",
        className,
      )}
    >
      <Link
        href={backHref}
        aria-label={backLabel}
        title={backLabel}
        className="text-ink-secondary hover:bg-surface-hover hover:text-ink grid size-10 shrink-0 place-items-center rounded-full transition-colors duration-instant"
      >
        <ArrowLeft
          size={icon.md}
          strokeWidth={icon.strokeWidth}
          aria-hidden="true"
        />
      </Link>

      <div className="flex min-w-0 items-center gap-3">
        <h1 className="text-h3 text-ink truncate">{title}</h1>
        {meta}
      </div>

      {actions ? (
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {actions}
        </div>
      ) : null}
    </header>
  );
}

/**
 * Breadcrumb for the library and project detail screens, where the path back
 * is more than one level deep.
 */
export function Breadcrumb({
  items,
  className,
}: {
  items: { label: string; href?: string }[];
  className?: string;
}) {
  const copy = useCopy();

  return (
    <nav aria-label={copy.a11y.breadcrumb} className={cn("min-w-0", className)}>
      <ol className="text-body-sm flex flex-wrap items-center gap-1">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={item.label} className="flex items-center gap-1">
              {index > 0 ? (
                <ChevronRight
                  size={icon.xs}
                  strokeWidth={icon.strokeWidth}
                  aria-hidden="true"
                  className="text-ink-disabled"
                />
              ) : null}
              {item.href && !last ? (
                <Link
                  href={item.href}
                  className="text-ink-secondary hover:text-ink rounded-xs transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={last ? "page" : undefined}
                  className={
                    last ? "text-ink font-medium" : "text-ink-secondary"
                  }
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
