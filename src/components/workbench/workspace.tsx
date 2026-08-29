"use client";

import { Maximize, ZoomIn, ZoomOut } from "lucide-react";
import type { ReactNode, RefObject } from "react";
import {
  CanvasViewport,
  type CanvasHandle,
} from "@/components/canvas/canvas-viewport";
import { IconButton } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/choice";
import { Disclosure } from "@/components/ui/disclosure";
import { Sentence } from "@/components/ui/text";
import { Toolbar } from "@/components/ui/tabs";
import { useCopy } from "@/content/copy-provider";
import { icon, type MonoTone } from "@/lib/design/tokens";
import { cn } from "@/lib/utils/cn";

/**
 * W-04 · The middle region.
 *
 * The instruction, then the canvas. Nothing here is a new control: the buttons
 * are A-02 inside M-04, the view switch is A-13, and the instruction is the
 * plain sentence the canvas appendix settled in Batch 3 — no card, no frame, no
 * fill (rule 4).
 *
 * **The toolbar floats over the canvas rather than sitting in a bar above it.**
 * `Toolbar`'s `floating` variant exists for this, and the reason to use it here
 * is arithmetic: at the 1280 × 900 the product promises, the canvas is left
 * 900 − 64 topbar − 224 open dock = 612px, and the instruction takes another
 * 70 of it. A control bar of its own would cost 56 more from the one region
 * that has none to give. Horizontally there is room to spare, which is why the
 * controls take their space there instead.
 */

export type CanvasView = "reference" | "current" | "compare";

export function CanvasWorkspace({
  canvas,
  instruction,
  rationale,
  aside,
  mono,
  view,
  onViewChange,
  scale,
  onScaleChange,
  ariaLabel,
  className,
  children,
}: {
  /** The same handle the agent focuses through — one view, one controller. */
  canvas: RefObject<CanvasHandle | null>;
  instruction: string;
  rationale?: string;
  /** The step's `Why…?` disclosure, when it has one. */
  aside?: { summary: string; body: ReactNode };
  /** Hardware values inside the instruction, rendered in mono (rule 13). */
  mono?: Record<string, MonoTone>;
  view: CanvasView;
  onViewChange: (next: CanvasView) => void;
  /** Current zoom, for the readout and for the label threshold upstream. */
  scale: number;
  onScaleChange?: (next: number) => void;
  ariaLabel: string;
  className?: string;
  /** The scene. */
  children: ReactNode;
}) {
  const copy = useCopy();
  const g = { size: icon.sm, strokeWidth: icon.strokeWidth } as const;

  return (
    <section
      aria-label={copy.workbench.region.workspace}
      /* h-full rather than flex-1 alone: the frame hands this a track to
         fill, and without it the section collapses to its content — which
         leaves the canvas, the one thing here with no intrinsic height, 80px
         tall under a screen of empty space. */
      className={cn("flex h-full min-h-0 min-w-0 flex-col", className)}
    >
      <header className="shrink-0 px-5 pt-3.5 pb-3">
        <h2 className="text-h2 text-ink">
          <Sentence text={instruction} mono={mono} />
        </h2>
        {rationale ? (
          <p className="text-body-sm text-ink-secondary mt-1">{rationale}</p>
        ) : null}
        {aside ? (
          <Disclosure className="mt-0.5" summary={aside.summary}>
            {aside.body}
          </Disclosure>
        ) : null}
      </header>

      <div className="relative min-h-0 flex-1">
        <CanvasViewport
          ref={canvas}
          ariaLabel={ariaLabel}
          onScaleChange={onScaleChange}
          className="h-full"
        >
          {children}
        </CanvasViewport>

        <Toolbar floating className="absolute top-3 left-3 gap-1 p-1.5">
          <IconButton
            label={copy.workbench.canvas.zoomIn}
            size="sm"
            onClick={() => canvas.current?.zoomBy(1.35)}
          >
            <ZoomIn {...g} />
          </IconButton>
          <IconButton
            label={copy.workbench.canvas.zoomOut}
            size="sm"
            onClick={() => canvas.current?.zoomBy(1 / 1.35)}
          >
            <ZoomOut {...g} />
          </IconButton>
          <IconButton
            label={copy.workbench.canvas.fitView}
            size="sm"
            onClick={() => canvas.current?.fitView()}
          >
            <Maximize {...g} />
          </IconButton>
        </Toolbar>

        <div className="absolute top-3 right-3">
          <SegmentedControl<CanvasView>
            size="sm"
            label={copy.workbench.views.label}
            value={view}
            onValueChange={onViewChange}
            className="shadow-e2"
            options={[
              { value: "reference", label: copy.workbench.views.reference },
              { value: "current", label: copy.workbench.views.current },
              { value: "compare", label: copy.workbench.views.compare },
            ]}
          />
        </div>

        <span className="text-mono-sm text-ink-tertiary tnum bg-surface/80 absolute right-3 bottom-3 rounded-full px-2 py-0.5 font-mono">
          {Math.round(scale * 100)}%
        </span>
      </div>
    </section>
  );
}
