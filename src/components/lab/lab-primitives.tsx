import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Presentation shells for the design lab itself. These are review scaffolding,
 * not product components — the product ships from `src/components/ui`.
 */

export function LabSection({
  id,
  code,
  title,
  description,
  children,
}: {
  id: string;
  code: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <header className="border-border border-b pb-4">
        <div className="flex items-baseline gap-2.5">
          <span className="text-mono-sm text-accent bg-accent-soft border-accent-border rounded-sm border px-1.5 py-0.5 font-mono">
            {code}
          </span>
          <h2 className="text-h2 text-ink">{title}</h2>
        </div>
        <p className="text-body-sm text-ink-secondary mt-1.5 max-w-prose">
          {description}
        </p>
      </header>
      <div className="pt-6">{children}</div>
    </section>
  );
}

export function LabBlock({
  title,
  note,
  className,
  children,
}: {
  title?: string;
  note?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("mb-8 last:mb-0", className)}>
      {title ? (
        <h3 className="text-overline text-ink-tertiary mb-3 uppercase">
          {title}
        </h3>
      ) : null}
      {children}
      {note ? (
        <p className="text-caption text-ink-tertiary mt-3 max-w-prose">
          {note}
        </p>
      ) : null}
    </div>
  );
}

/** Neutral stage for specimens that need a surface to sit on. */
export function LabStage({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "bg-surface border-border shadow-e1 rounded-lg border p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function TokenName({ children }: { children: ReactNode }) {
  return (
    <code className="text-mono-sm text-ink-secondary font-mono">
      {children}
    </code>
  );
}
