"use client";

import { useEffect, useState, type RefObject } from "react";
import type { CanvasHandle } from "@/components/canvas/canvas-viewport";
import { agent } from "@/lib/design/tokens";
import { CarriedPartArt, shelfArt } from "@/components/workbench/kit-strip";
import {
  CARRY_FROM,
  SEAT_AT,
  carryProgress,
  framesAt,
  getTick,
  reportDrawn,
  subscribe,
  type Carrying,
  type MascotFrame,
  type MascotTick,
  type Point,
  type Resolve,
  type Ring,
} from "@/lib/agent/mascot";

/**
 * C-24 · The agent, on the bench.
 *
 * The ring the entry screen's repair sequence settled on, and nothing else: no
 * body, no face, no callout. It arrives **wide** and closes onto the hole it is
 * working over — two sockets a tenth of an inch apart cannot announce
 * themselves, so the ring announces them on the way down and then gets out of
 * the way. The index dot running its circumference stops at the top and hands
 * over to the crosshair arms it turns into.
 *
 * Hollow, because anything filled would cover the very hole it came for.
 *
 * ## A layer over the well, not a child of the bench
 *
 * It was drawn as the last child of the viewport's transform, in scene units,
 * and that was measured to be wrong three ways at once. At 290% the reading
 * ring was 75 px across with a 9 px stroke and covered the LED it had come to
 * look at. It could not reach the kit shelf, which is HTML painted over the
 * top of the well, so a carry from the kit arrived empty and the part popped
 * in at `SEAT_AT`. And its fixed entry offset, at the opening fit, was behind
 * that shelf: the ring appeared as a clipped arc from under the furniture.
 *
 * So it is an `<svg>` with no `viewBox` covering the whole well — shelf
 * included — at `z-[15]`: above the furniture, below the overlay. User units
 * are CSS pixels, so `RING`'s radii and strokes are pixels by construction,
 * and a job's anchors are resolved into this space every frame: scene anchors
 * through the viewport's `fromScene`, screen anchors as given. The camera
 * pane in the inspection mounts a second layer with `screenFallback`, so a
 * job anchored to the bench shows there too while the shelf and the lamp,
 * which it has not got, resolve to its own corner.
 *
 * ## Why it subscribes in an effect and not with `useSyncExternalStore`
 *
 * The frame is a function of the store's tick *and of the camera*, and the
 * camera lives in a ref the viewport writes straight to the DOM. Resolving an
 * anchor means reading that ref, which a render may not do
 * (`react-hooks/refs`). So the layer computes each frame inside the store's
 * own callback — where a ref is fair to read — and keeps only the finished
 * pixels in state; the render below is a pure drawing of them. The cost is
 * the same as a snapshot subscription: one re-render of this component per
 * frame, and nothing else on the bench.
 */

/**
 * The agent's own colour, on this ground.
 *
 * `#1677FF` is the product's accent and the coach figure's body: the figure
 * on the shelf and the ring on the bench are one agent, and one agent has one
 * blue. The ring used to lift it to `#4D94FF` on the argument that the accent
 * vanishes over the board's own blue — which it does, and the halo underneath
 * is what answers that, not the tint. Legibility is the dark ring; the colour
 * is the identity.
 *
 * Deliberately not in the material palette: every colour in that file is a
 * thing you could hold, and the agent is not one of them.
 */
const MARK = agent.mark;

/** How far in from a fallback layer's top-right corner a screen anchor lands. */
const CORNER = 36;

/** What one tick came to, in this layer's pixels. */
interface Drawn {
  frame: MascotFrame;
  /** The part in the ring — where and how big — while there is one. */
  carried: { what: Carrying; at: Point; scale: number } | null;
}

export function AgentMascotLayer({
  canvas,
  primary = false,
  screenFallback,
}: {
  /** The viewport this layer lies over. Scene anchors resolve through it. */
  canvas: RefObject<CanvasHandle | null>;
  /**
   * Whether this is the layer the ring is *at*: the one whose last drawn ring
   * a job arriving mid-flight continues from. One per bench; the inspection's
   * camera pane is a view of the same flight and reports nothing.
   */
  primary?: boolean;
  /**
   * What a screen anchor means on a layer that has no shelf and no lamp.
   * `corner` sends every one to this layer's own top-right, so the flight
   * still reads as leaving and returning.
   */
  screenFallback?: "corner";
}) {
  const [drawn, setDrawn] = useState<Drawn | null>(null);

  useEffect(() => {
    const draw = () => {
      const next = drawFrom(getTick(), canvas.current, screenFallback);
      if (primary) reportDrawn(next?.frame.now ?? null);
      setDrawn(next);
    };
    /* No first draw here: nothing is flying when a bench mounts, and a layer
       mounted mid-flight — the inspection opening during a call — is caught
       up by the next tick, one frame later. */
    return subscribe(draw);
  }, [canvas, primary, screenFallback]);

  if (!drawn) return null;
  const { frame, carried } = drawn;

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[15] h-full w-full"
    >
      {frame.trail.map((ghost, index) => (
        <MascotRing
          key={index}
          ring={{ ...ghost, opacity: ghost.opacity * (0.26 - index * 0.07) }}
        />
      ))}
      {/* Under the ring, so the ring is seen to hold it. */}
      {carried ? (
        <CarriedPartArt
          component={carried.what.component}
          uid={carried.what.uid}
          mark={carried.what.mark}
          at={carried.at}
          scale={carried.scale}
        />
      ) : null}
      <MascotRing ring={frame.now} />
    </svg>
  );
}

const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/**
 * The centre of the coach figure standing inside `bounds`, in pixels from the
 * box's top-left — or `null` when none does.
 *
 * Inside, not nearest: the figure belongs to a bench by standing on it, and
 * the lab has figures on every mood card of the agent batch. Found by
 * `data-coach-figure`, which `CoachCorner` puts on the figure and not on the
 * words beside it.
 */
export function coachCentreIn(bounds: DOMRect): Point | null {
  if (typeof document === "undefined") return null;
  for (const figure of document.querySelectorAll<HTMLElement>(
    "[data-coach-figure]",
  )) {
    const rect = figure.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    if (
      cx >= bounds.left &&
      cx <= bounds.right &&
      cy >= bounds.top &&
      cy <= bounds.bottom
    ) {
      return { x: cx - bounds.left, y: cy - bounds.top };
    }
  }
  return null;
}

/**
 * One tick, resolved into this layer's pixels — or nothing, when there is no
 * tick, no viewport yet, or the ring is between jobs.
 */
function drawFrom(
  tick: MascotTick | null,
  view: CanvasHandle | null,
  fallback?: "corner",
): Drawn | null {
  if (!tick || !view) return null;
  const bounds = view.getBounds();
  if (!bounds) return null;

  const corner = { x: bounds.width - CORNER, y: CORNER };
  const resolve: Resolve = (anchor) => {
    if (anchor.kind === "scene") return view.fromScene(anchor.x, anchor.y);
    if (fallback === "corner") return corner;
    if (anchor.kind === "screen") return { x: anchor.x, y: anchor.y };
    /* Measured on every frame, because the figure moves while the ring is
       out — see `Anchor`. Gone altogether (the shelf unmounting as the last
       part leaves the box, before the mat plate mounts) it is the corner it
       would have stood in. */
    return coachCentreIn(bounds) ?? corner;
  };

  const frame = framesAt(tick.job, tick.now, tick.opts, resolve);
  if (!frame) return null;

  /* The part rides from the moment the ring closes on its tile until the
     seat lands — at which point the handler's commit has landed too and the
     bench draws the seated part, so the drawing is never on screen twice. It
     grows from the tile's scale to the bench's along the ring's own travel
     curve, so it arrives the size it will be standing in the hole. */
  const what = tick.job.kind === "carry" ? tick.job.carrying : undefined;
  const shelf =
    what && tick.now >= CARRY_FROM && tick.now < SEAT_AT
      ? shelfArt(what.component)
      : undefined;
  const carried =
    what && shelf
      ? {
          what,
          at: { x: frame.now.x, y: frame.now.y },
          scale: lerp(shelf.scale, view.getScale(), carryProgress(tick.now)),
        }
      : null;

  return { frame, carried };
}

export function MascotRing({ ring }: { ring: Ring }) {
  const { x, y, r, dock, spin, opacity } = ring;
  const arms = Math.max(0, Math.min(1, (dock - 0.3) / 0.7));
  const dot = Math.max(0, Math.min(1, 1 - dock * 1.7));
  const reach = 4.5 * arms;

  return (
    <g
      transform={`translate(${x.toFixed(2)} ${y.toFixed(2)})`}
      opacity={opacity}
    >
      {/* A dark halo under the ring, not a deeper blue. The agent's accent over
          the board's own blue is one blue on another, and the ring vanished
          exactly where it matters most — on the header it came to work on. */}
      <circle r={r} fill="none" stroke="#08131F" strokeWidth={7} opacity={0.5} />
      <circle r={r} fill="none" stroke={MARK} strokeWidth={3} />

      {arms > 0.02
        ? [
            [0, -1],
            [0, 1],
            [-1, 0],
            [1, 0],
          ].map(([ux, uy]) => (
            <line
              key={`${ux}-${uy}`}
              x1={ux * (r + 2)}
              y1={uy * (r + 2)}
              x2={ux * (r + 2 + reach)}
              y2={uy * (r + 2 + reach)}
              stroke={MARK}
              strokeWidth={3}
              strokeLinecap="round"
              opacity={arms}
            />
          ))
        : null}

      {dot > 0.02 ? (
        <circle
          cx={Math.cos(spin) * r}
          cy={Math.sin(spin) * r}
          r={3}
          fill={MARK}
          opacity={dot}
        />
      ) : null}
    </g>
  );
}
