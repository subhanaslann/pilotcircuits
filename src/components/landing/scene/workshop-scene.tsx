"use client";

import type React from "react";
import { useEffect, useRef } from "react";
import { BenchView } from "@/components/landing/scene/bench-view";
import { NextStepControl } from "@/components/landing/scene/next-step-control";
import { arrive } from "@/components/landing/scene/repair-demo";
import { bench } from "@/components/illustration/spec";
import { useCopy } from "@/content/copy-provider";
import { cn } from "@/lib/utils/cn";

/**
 * S-01 · The bench.
 *
 * This wrapper owns three things and nothing else: the printed label, when the
 * run starts, and the control screwed to the bench. The drawing itself is
 * `BenchView`, which is `CircuitSceneView` — the workbench's own parts, wires
 * and pins, framed for this screen.
 *
 * The still life that used to live here is gone. It was a second drawing of one
 * build, and the argument for it (a photograph rather than a diagram) stopped
 * being worth its price the moment the price was a board drawn at forty per
 * cent of the size of the one in the reader's hand.
 *
 * `container-type: inline-size` is what makes the whole thing scale as one
 * object: the label and the control size themselves in `cqw` against this box,
 * so nothing has to be re-measured when the scene narrows.
 */
export function WorkshopScene({ className }: { className?: string }) {
  const copy = useCopy();
  const frame = useRef<HTMLDivElement>(null);

  /**
   * The car rolls up when the bench is actually on screen.
   *
   * Only the car: the repair is not played, it is *asked for*. The bench sits
   * there not working until somebody — or something — calls the tool, which is
   * the whole reason the ring is finally visible when it comes.
   */
  useEffect(() => {
    const node = frame.current;
    if (!node) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (typeof IntersectionObserver === "undefined") {
      arrive(reduced);
      return;
    }
    const watch = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          arrive(reduced);
          watch.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    watch.observe(node);
    return () => watch.disconnect();
  }, []);

  return (
    <div
      ref={frame}
      className={cn("relative mx-auto w-full max-w-[860px] @container", className)}
    >
      {/* Printed on the bench above the mat's back edge, not inside a badge —
          it names what you are looking at and then gets out of the way. Below
          the breakpoint it becomes a caption above the drawing instead. */}
      {/* Printed on the mat, so it takes the mat's ink rather than the app's:
          `--color-ink-secondary` is tuned to read on white paper and goes to
          mud on a cutting mat (`illustration/spec.ts`, the same exception the
          pin labels take). Below the breakpoint it leaves the drawing and
          becomes a caption, where the app's ink is the right one again. */}
      <p
        className="font-condensed text-ink-secondary mb-2 text-[clamp(11px,1.52cqw,14px)] leading-none font-semibold tracking-[0.09em] whitespace-nowrap uppercase md:absolute md:top-[3%] md:left-[3.5%] md:z-10 md:mb-0 md:text-[color:var(--mat-label)]"
        style={{ "--mat-label": bench.label } as React.CSSProperties}
      >
        {copy.landing.sceneLabel}
      </p>

      <BenchView />

      <NextStepControl />
    </div>
  );
}

