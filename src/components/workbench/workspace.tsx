"use client";

import { Maximize, Redo2, Undo2, ZoomIn, ZoomOut } from "lucide-react";
import type { ReactNode, Ref, RefObject } from "react";
import {
  CanvasViewport,
  type CanvasHandle,
} from "@/components/canvas/canvas-viewport";
import { Button, IconButton } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/choice";
import { Disclosure } from "@/components/ui/disclosure";
import { Sentence } from "@/components/ui/text";
import { Toolbar } from "@/components/ui/tabs";
import { useCopy } from "@/content/copy-provider";
import { icon, type MonoTone } from "@/lib/design/tokens";
import { KIT_STRIP_HEIGHT } from "@/components/workbench/kit-strip";
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
  actions,
  history,
  mono,
  view,
  onViewChange,
  scale,
  onScaleChange,
  ariaLabel,
  interactive,
  fitBox,
  overlay,
  kit,
  instructionRef,
  className,
  children,
}: {
  /** The same handle the agent focuses through — one view, one controller. */
  canvas: RefObject<CanvasHandle | null>;
  instruction: string;
  rationale?: string;
  /** The step's `Why…?` disclosure, when it has one. */
  aside?: { summary: string; body: ReactNode };
  /**
   * What can be done to the thing currently in hand.
   *
   * Empty at rest. This is the visible half of a contract that until now
   * existed only for the keyboard.
   */
  actions?: { label: string; onClick: () => void }[];
  /**
   * Taking a gesture back, when the build is one the person assembles.
   *
   * Absent on an author-laid-out build, where there is nothing to undo — an
   * always-visible pair of dead controls is worse than none, and rule 6 asks a
   * control that cannot do anything not to be there.
   */
  history?: {
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
  };
  /** Hardware values inside the instruction, rendered in mono (rule 13). */
  mono?: Record<string, MonoTone>;
  view: CanvasView;
  onViewChange: (next: CanvasView) => void;
  /** Current zoom, for the readout and for the label threshold upstream. */
  scale: number;
  onScaleChange?: (next: number) => void;
  ariaLabel: string;
  /**
   * Whether the scene in here holds controls rather than being a picture.
   *
   * Passed on to the viewport, which otherwise claims `role="img"` and takes
   * every lead handle and every seat-picker candidate out of the accessibility
   * tree with it.
   */
  interactive?: boolean;
  /** What the fit control frames. Defaults to the whole scene. */
  fitBox?: { x: number; y: number; width: number; height: number };
  /**
   * Something standing in front of this region for a while — the chapter
   * briefing.
   *
   * It covers the instruction as well as the canvas, and that is the point:
   * the header prints the *step's* imperative, and a sentence telling you to
   * bridge a gap with a resistor has no business hanging over a window that
   * says you have not started. Both children go `inert` under it, because
   * covered content is still tabbable — the same trap `dock.tsx` closes when
   * it folds.
   *
   * The canvas stays **mounted**. Swapping it out would null the handle the
   * agent focuses through, and `show_correction` would land on the floor for
   * as long as this was up.
   */
  overlay?: ReactNode;
  /**
   * The kit shelf, stuck to the top edge of the well.
   *
   * A slot rather than something this component builds, because what is in the
   * box is the *session's* answer and this is a frame. It sits inside the
   * region's own furniture layer, so it goes when an overlay does — a shelf of
   * draggable parts hanging over a briefing would offer a gesture the bench
   * behind it is not ready for.
   */
  kit?: ReactNode;
  /** The instruction heading, so whatever was covering this can hand focus back. */
  instructionRef?: Ref<HTMLHeadingElement>;
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
      className={cn("relative flex h-full min-h-0 min-w-0 flex-col", className)}
    >
      {/* Hidden, not just inert, while something stands in front of this
          region. The overlay is inset, so a visible header would show above it
          — and what shows is the *step's* imperative, sliced off mid-sentence
          by the panel's top edge. It keeps its box either way, so the canvas
          below does not jump when the briefing goes. */}
      <header
        inert={Boolean(overlay)}
        className={cn(
          "shrink-0 px-5 pt-3.5 pb-3",
          overlay && "invisible",
        )}
      >
        <h2
          ref={instructionRef}
          tabIndex={-1}
          className="text-h2 text-ink outline-none"
        >
          <Sentence text={instruction} mono={mono} />
        </h2>
        {rationale ? (
          <p className="text-body-sm text-ink-secondary mt-1">{rationale}</p>
        ) : null}
        {/* What you can do with the thing in your hand, said where the sentence
            about it is.

            Putting a lead down and putting a part away were both real gestures
            and neither had a name anywhere on screen: the release rode in a
            `<desc>` and an `aria-keyshortcuts`, so it was announced to a screen
            reader and invisible to everybody else, and taking a part off the
            bench was "drag it far enough away and hope". A gesture whose only
            documentation is discovering it by accident is one people report as
            missing. */}
        {actions?.length ? (
          <div className="mt-2 flex flex-wrap gap-3">
            {actions.map((action) => (
              <Button
                key={action.label}
                variant="tertiary"
                size="sm"
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
          </div>
        ) : null}
        {aside ? (
          <Disclosure className="mt-0.5" summary={aside.summary}>
            {aside.body}
          </Disclosure>
        ) : null}
      </header>

      <div inert={Boolean(overlay)} className="relative min-h-0 flex-1">
        <CanvasViewport
          ref={canvas}
          ariaLabel={ariaLabel}
          interactive={interactive}
          fitBox={fitBox}
          /* The shelf is drawn over this canvas, so the part of it a build can
             be framed in starts below the shelf. Same constant the toolbar
             below is offset by. */
          insetTop={kit ? KIT_STRIP_HEIGHT : 0}
          onScaleChange={onScaleChange}
          className="h-full"
        >
          {children}
        </CanvasViewport>

        {/* The region's own controls, hidden under an overlay for the same
            reason the instruction is: the panel is inset, so a zoom button and
            a view switch would show along its edges as slivers of furniture
            belonging to a canvas nobody can reach. The bench itself stays
            visible behind, dimmed — that is what the overlay is standing on.
            Not positioned, so the three keep the same containing block. */}
        <div className={cn(overlay && "invisible")}>
          {kit}

          {/* Below the shelf when there is one. The offset is the shelf's own
              exported height, so the two cannot drift apart. */}
          <div
            className="absolute left-3"
            style={{ top: kit ? KIT_STRIP_HEIGHT + 12 : 12 }}
          >
            <Toolbar floating className="gap-1 p-1.5">
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
              {/* Beside the view controls, because taking back a gesture is a
                  thing you do to the bench and this is the bench's own strip of
                  furniture. Absent entirely on a build the person does not
                  assemble — there is nothing there to undo. */}
              {history ? (
                <>
                  <span
                    aria-hidden
                    className="bg-hairline mx-0.5 h-5 w-px self-center"
                  />
                  <IconButton
                    label={copy.workbench.undo}
                    size="sm"
                    disabled={!history.canUndo}
                    onClick={history.onUndo}
                  >
                    <Undo2 {...g} />
                  </IconButton>
                  <IconButton
                    label={copy.workbench.redo}
                    size="sm"
                    disabled={!history.canRedo}
                    onClick={history.onRedo}
                  >
                    <Redo2 {...g} />
                  </IconButton>
                </>
              ) : null}
            </Toolbar>
          </div>

          <div
            className="absolute right-3"
            style={{ top: kit ? KIT_STRIP_HEIGHT + 12 : 12 }}
          >
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
      </div>

      {/* Above the floating toolbar and the view switch — `SegmentedControl`'s
          items carry `relative z-10` and nothing between here and there opens
          a stacking context — and below the toast viewport and the inspection
          modal, which both sit at `z-50`. A toast the agent raises has to stay
          visible even while this is up. */}
      {overlay ? (
        <div className="absolute inset-0 z-20">{overlay}</div>
      ) : null}
    </section>
  );
}
