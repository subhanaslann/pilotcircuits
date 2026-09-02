"use client";

import { useMemo, type RefObject } from "react";
import type { CanvasHandle } from "@/components/canvas/canvas-viewport";
import { FRAME } from "@/components/landing/scene/bench-layout";

/**
 * S-01 · The bench drawing, wearing the viewport's handle.
 *
 * The agent's ring lives in a screen-space layer that asks its host three
 * things: where the host is on the screen, how big a scene unit is right now,
 * and where a scene point falls in the host's own pixels. The workbench
 * answers from a pan-and-zoom transform. This bench has no camera — it is one
 * `<svg viewBox>` scaled to its column — so the same three answers come off
 * the drawing's box: the scale is the box over the frame, and a scene point is
 * that scale and the box's offset inside the wrapper.
 *
 * Measured on every call rather than once, because the box changes with the
 * column and the ring is resolved per frame. `xMidYMid meet` is honoured —
 * the drawing is letterboxed inside its box only if the box's ratio ever
 * differs from the frame's, but the arithmetic is the same either way and
 * cheaper than an assumption.
 *
 * The three methods a ring never calls — fit, zoom, focus — are no-ops: there
 * is nothing to move. `toScene` is kept true anyway, as the inverse, so the
 * handle is a `CanvasHandle` rather than most of one.
 */
export function useBenchHandle(
  frame: RefObject<HTMLElement | null>,
  art: RefObject<SVGSVGElement | null>,
): RefObject<CanvasHandle | null> {
  return useMemo(
    () => ({ current: handleFor(frame, art) }),
    [frame, art],
  );
}

interface Fit {
  /** CSS pixels per scene unit. */
  scale: number;
  /** Where scene (0, 0) falls, in pixels from the wrapper's top-left. */
  dx: number;
  dy: number;
  bounds: DOMRect;
}

function fitOf(
  frame: RefObject<HTMLElement | null>,
  art: RefObject<SVGSVGElement | null>,
): Fit | null {
  const host = frame.current;
  const svg = art.current;
  if (!host || !svg) return null;
  const bounds = host.getBoundingClientRect();
  const box = svg.getBoundingClientRect();
  if (box.width === 0 || box.height === 0) return null;
  const scale = Math.min(box.width / FRAME.width, box.height / FRAME.height);
  return {
    scale,
    dx: box.left - bounds.left + (box.width - FRAME.width * scale) / 2,
    dy: box.top - bounds.top + (box.height - FRAME.height * scale) / 2,
    bounds,
  };
}

function handleFor(
  frame: RefObject<HTMLElement | null>,
  art: RefObject<SVGSVGElement | null>,
): CanvasHandle {
  return {
    fitView() {},
    zoomBy() {},
    focusOn() {},
    getScale: () => fitOf(frame, art)?.scale ?? 1,
    toScene: (clientX, clientY) => {
      const fit = fitOf(frame, art);
      if (!fit) return { x: clientX, y: clientY };
      return {
        x: (clientX - fit.bounds.left - fit.dx) / fit.scale,
        y: (clientY - fit.bounds.top - fit.dy) / fit.scale,
      };
    },
    fromScene: (x, y) => {
      const fit = fitOf(frame, art);
      if (!fit) return { x, y };
      return { x: fit.dx + x * fit.scale, y: fit.dy + y * fit.scale };
    },
    getBounds: () => frame.current?.getBoundingClientRect() ?? null,
  };
}
