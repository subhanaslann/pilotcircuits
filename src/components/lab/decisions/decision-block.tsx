import type { ReactNode } from "react";
import { StatusChip } from "@/components/ui/badge";
import { TextLink } from "@/components/ui/text";
import { cn } from "@/lib/utils/cn";

/**
 * One settled question, both answers, and where the answer landed.
 *
 * The shape is the argument: the two directions get identical frames, identical
 * widths and identical ground, so the only thing that differs between them is
 * the thing under review. A desk that gave A more room than B would have
 * answered the question by laying it out — and that still holds now the answers
 * are in, because the losing direction has to stay legible enough to argue
 * with.
 *
 * The winner is marked with a chip and nothing else: no dimming, no border, no
 * shrinking. Colour lives in the glyph (rule 3), and a rejected direction that
 * has been visually punished is one nobody can re-read fairly.
 */
export function DecisionBlock({
  id,
  code,
  title,
  question,
  settled,
  chosen,
  chosenLabel,
  hint,
  href,
  hrefLabel,
  aLabel,
  aNote,
  bLabel,
  bNote,
  stacked = false,
  a,
  b,
}: {
  id: string;
  code: string;
  title: string;
  question: string;
  /** Where the answer landed, in one line. */
  settled: string;
  /** Which side won. */
  chosen: "a" | "b";
  chosenLabel: string;
  /** How to read the pair, when reading it wrong is easy. */
  hint?: string;
  href: string;
  hrefLabel: string;
  aLabel: string;
  aNote: string;
  bLabel: string;
  bNote: string;
  /** Directions that need the full column width, one above the other. */
  stacked?: boolean;
  a: ReactNode;
  b: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <header className="border-border border-b pb-4">
        <div className="flex items-baseline gap-2.5">
          <span className="text-mono-sm text-warning bg-warning-soft border-warning-border rounded-sm border px-1.5 py-0.5 font-mono">
            {code}
          </span>
          <h2 className="text-h2 text-ink">{title}</h2>
        </div>
        <p className="text-body text-ink-secondary mt-1.5 max-w-prose">
          {question}
        </p>
        <p className="text-caption text-ink-tertiary mt-2 max-w-prose">
          {settled}
        </p>
      </header>

      <div
        className={cn(
          "grid gap-5 pt-6",
          stacked ? "grid-cols-1" : "md:grid-cols-2",
        )}
      >
        {[
          { side: "a" as const, label: aLabel, note: aNote, body: a },
          { side: "b" as const, label: bLabel, note: bNote, body: b },
        ].map((side) => (
          <div key={side.label} className="flex min-w-0 flex-col">
            <p className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-overline text-ink-tertiary uppercase">
                {side.label}
              </span>
              {side.side === chosen ? (
                <StatusChip status="ready">{chosenLabel}</StatusChip>
              ) : null}
            </p>
            {side.body}
            <p className="text-caption text-ink-tertiary mt-3 max-w-prose">
              {side.note}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <TextLink href={href} variant="standalone">
          {hrefLabel}
        </TextLink>
        {hint ? (
          <span className="text-caption text-ink-tertiary">{hint}</span>
        ) : null}
      </div>
    </section>
  );
}
