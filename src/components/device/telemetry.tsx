"use client";

import { useCopy } from "@/content/copy-provider";
import { cn } from "@/lib/utils/cn";

/**
 * D-04 · Telemetry readout — **direction A chosen**, B kept.
 *
 * A is what the device dock now shows, above the board's static particulars
 * (`device-info.tsx`). B stays built and live at `/lab/device#d-serial` as the
 * direction it was chosen over.
 *
 * The question this material asks: **is a live distance a number or a shape?**
 *
 * Rule 5 wants countable things counted, and a distance is not countable — it
 * is a continuous value, so neither direction can be a row of ticks. Rule 12
 * allows exactly two gradients in the product, and neither is a chart, so a
 * *filled* sparkline is out. A hairline stroke is not a gradient, which is why
 * direction B is admissible at all — but it sits close enough to the line that
 * it is worth saying out loud.
 *
 * Teal, not accent: the canvas already prints `18 cm` in teal beside the
 * sensor (C-23's `Readout`). Accent is the agent's colour, and this reading is
 * the board's.
 */

/**
 * Direction A · the number, large. **Chosen.**
 *
 * Borrows A-15's big-mono recipe verbatim — the same 34px semibold mono the
 * build fraction uses — rather than inventing a size for it. The cost was
 * named when it was built and is accepted: at this weight a continuous reading
 * starts to look like a gauge, and this build is not an instrument panel.
 */
export function TelemetryReadout({
  value,
  className,
}: {
  /** Centimetres, or `null` before anything has been read. */
  value: number | null;
  className?: string;
}) {
  const copy = useCopy();

  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-caption text-ink-tertiary">{copy.device.distance}</p>
      <p className="text-ink tnum mt-1 font-mono text-[34px] leading-none font-semibold tracking-tight">
        {value === null ? (
          <>
            <span aria-hidden="true" className="text-border-strong">
              —
            </span>
            <span className="sr-only">{copy.device.noReading}</span>
          </>
        ) : (
          <>
            {value}
            <span className="text-mono-lg text-ink-tertiary ml-1 font-normal">
              cm
            </span>
          </>
        )}
      </p>
    </div>
  );
}

/**
 * Direction B · the reading in the dock's own rhythm, with where it has been.
 * **Rejected, and still built** — see `/lab/device#d-serial`.
 *
 * Same shape as `KeyValueRow`, so it belongs to the Device tab's family rather
 * than arriving as a widget. The trace is stroke only — no fill, no gradient,
 * no axis, no grid — and it is decorative: every fact it carries is also in
 * the number beside it, which is what lets it be hidden from assistive tech
 * without losing anything.
 */
export function TelemetryTrace({
  value,
  readings,
  className,
}: {
  value: number | null;
  /** Oldest first. Fewer than two and the trace is left blank. */
  readings: number[];
  className?: string;
}) {
  const copy = useCopy();

  return (
    <div
      className={cn(
        "border-border/70 flex items-center justify-between gap-4 border-b py-1.5 last:border-0",
        className,
      )}
    >
      <span className="text-body-sm text-ink-secondary shrink-0">
        {copy.device.distance}
      </span>
      <span className="flex min-w-0 items-center gap-3">
        <Trace readings={readings} />
        <span className="text-mono-lg tnum text-ink shrink-0 font-mono">
          {value === null ? (
            <span className="text-ink-tertiary">{copy.device.noReading}</span>
          ) : (
            `${value} cm`
          )}
        </span>
      </span>
    </div>
  );
}

const TRACE_W = 96;
const TRACE_H = 24;

function Trace({ readings }: { readings: number[] }) {
  if (readings.length < 2) {
    /* Hold the width so the number does not slide left on the first reading
       and back again on the second (rule 6). */
    return <span aria-hidden="true" style={{ width: TRACE_W }} />;
  }

  const max = Math.max(...readings);
  const min = Math.min(...readings);
  const span = max - min || 1;

  /* Inset vertically so a 1.5px stroke at either extreme is not half clipped. */
  const points = readings
    .map((reading, index) => {
      const x = (index / (readings.length - 1)) * 100;
      const y = 8 + (1 - (reading - min) / span) * 84;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      aria-hidden="true"
      width={TRACE_W}
      height={TRACE_H}
      viewBox="0 0 100 100"
      /* Stretched to the box, so `non-scaling-stroke` is what keeps the line
         an even hairline rather than a wedge. */
      preserveAspectRatio="none"
      className="shrink-0 overflow-visible"
    >
      <polyline
        points={points}
        fill="none"
        stroke="var(--color-teal)"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
