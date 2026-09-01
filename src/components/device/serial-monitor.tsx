"use client";

import { useEffect, useRef } from "react";
import { EmptyState } from "@/components/ui/status";
import { useCopy } from "@/content/copy-provider";
import { cn } from "@/lib/utils/cn";

/**
 * D-03 · Serial monitor
 *
 * **Nothing in this list is ever translated.** Rule 13 says mono is what the
 * hardware said, and a serial log is that rule at its purest: the words on
 * screen are the sketch's output, not the product's. `Distance: 18 cm` reads
 * the same in every language.
 *
 * This is also the one legitimate exception to the rule Batch 4 settled — that
 * no sentence is ever kept in state. A serial line is not a sentence the
 * interface composed; it is a reading, and a reading has no translation to go
 * stale. Everything *around* the log — the region's name, the empty state, the
 * tab it sits behind — comes from the dictionary as usual.
 *
 * The log scrolls itself. A monitor that made you chase the newest line would
 * be showing you the past while the board is talking about the present.
 *
 * **Batch 8 · two grounds, one monitor.** The entry screen shows the same log
 * on a dark panel, the way a serial monitor has looked since serial monitors
 * existed. It is a `tone`, not a second component: the day a line changes shape
 * there must be one place that draws it. On dark, a distance reading takes the
 * teal that already means *measured* everywhere else in this product, so the
 * colour is doing its own job rather than borrowing a terminal green.
 */
export type SerialTone = "dock" | "panel";

export function SerialMonitor({
  lines,
  tone = "dock",
  className,
}: {
  lines: string[];
  tone?: SerialTone;
  className?: string;
}) {
  const copy = useCopy();
  const viewport = useRef<HTMLDivElement>(null);

  /* A DOM write, not a state update — the React Compiler forbids the latter
     here, and this was never state: it is where a scroll container happens to
     be looking. */
  useEffect(() => {
    const node = viewport.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [lines]);

  if (!lines.length) {
    return (
      <EmptyState
        title={copy.device.serialEmpty}
        description={copy.device.serialEmptyHint}
        className={cn("py-6", className)}
      />
    );
  }

  return (
    <div
      ref={viewport}
      role="log"
      aria-label={copy.device.serialRegion}
      /* The lines are the board's, not the agent's: announcing each one would
         read raw hardware output aloud, which the panel's own `LiveRegion`
         exists to avoid. */
      aria-live="off"
      className={cn("scroll-fade h-full overflow-y-auto py-1", className)}
    >
      {lines.map((line, index) => (
        <p
          key={`${index}-${line}`}
          className={cn(
            "text-mono-sm tnum font-mono",
            /* The panel packs its lines the way a real monitor does; the dock
               has room to breathe and keeps the looser rhythm. */
            tone === "dock" ? "leading-5" : "leading-[17px]",
            tone === "dock"
              ? "text-ink-secondary"
              : /* A reading is teal; what the gate reports about itself is not
                   a measurement, so it stays in the panel's plain ink. */
                line.startsWith("Distance")
                ? "text-teal"
                : "text-ink-inverse/80",
          )}
        >
          {line}
        </p>
      ))}
    </div>
  );
}
