"use client";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from "react";
import { scene as sceneBox, zoom as zoomLimits } from "@/lib/circuit/geometry";
import { cn } from "@/lib/utils/cn";

/**
 * C-01 · Canvas viewport
 *
 * Pan by dragging, zoom on the wheel around the cursor, and — the part that
 * matters for this product — `focusOn`, which the agent calls when it points at
 * something. That move is animated: a highlight that simply appears somewhere
 * else is a change the user can miss, and the agent's whole job here is to be
 * legible (design-language.md, rule 6).
 *
 * The transform lives in a ref and is written straight to the DOM. React state
 * would re-render the entire circuit on every pointer move.
 */

export interface Viewport {
  x: number;
  y: number;
  k: number;
}

export interface CanvasHandle {
  fitView: (animate?: boolean) => void;
  zoomBy: (factor: number) => void;
  focusOn: (
    box: { x: number; y: number; width: number; height: number },
    opts?: { scale?: number; animate?: boolean },
  ) => void;
  getScale: () => number;
  /**
   * A client point, in scene units.
   *
   * What a pointer gesture on a part needs and cannot work out for itself: the
   * transform lives in a ref in here and is written straight to the DOM, so
   * nothing outside this component knows the current pan or zoom.
   *
   * Read fresh on every move rather than snapshotted at the start of a drag —
   * the wheel is not locked while a part is in hand, and a scale captured on
   * pointer-down goes stale the moment somebody zooms mid-gesture.
   */
  toScene: (clientX: number, clientY: number) => { x: number; y: number };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function CanvasViewport({
  ref,
  children,
  onScaleChange,
  initialView,
  fitBox,
  insetTop = 0,
  className,
  ariaLabel,
  interactive = false,
}: {
  /** React 19 passes ref as a plain prop; no forwardRef wrapper needed. */
  ref?: Ref<CanvasHandle>;
  children: ReactNode;
  /** Notified when the scale changes, so labels can appear at a threshold. */
  onScaleChange?: (k: number) => void;
  /**
   * What the one-time opening fit frames. Defaults to the whole scene.
   *
   * The inspection's camera pane passes the cutting mat: a camera pointed at a
   * bench sees the bench, but a *vision result* that opens on half a metre of
   * empty oak has spent its one frame on the part of the desk nothing is
   * happening on. `Fit view` still means the whole scene — this is only where
   * the view starts.
   */
  initialView?: { x: number; y: number; width: number; height: number };
  /** What `fitView` frames. Defaults to the whole scene. */
  fitBox?: { x: number; y: number; width: number; height: number };
  /**
   * How much of this region's top edge something else is painted over.
   *
   * The kit shelf sits inside the same well rather than above it — it has to,
   * or a part dragged off it would leave one element and enter another
   * mid-gesture — so the canvas is as tall as the region and only part of it
   * can be looked at. Told rather than measured: the shelf exports its own
   * height, and a canvas that read it off the DOM would be a second opinion
   * about a number one file already owns.
   */
  insetTop?: number;
  className?: string;
  ariaLabel: string;
  /**
   * Whether the scene inside holds controls.
   *
   * `img` is defined with *children presentational: true*, so assistive
   * technology prunes the whole subtree and exposes nothing but the image's own
   * name. That is exactly right for the three views that are pictures — the
   * reference, the inspection camera, the briefing's film — and it silently ate
   * the live bench: the lead handles and the fifteen seat-picker candidates
   * kept their DOM focusability, so Tab and the roving tabindex still walked
   * them, while their roles, names and `aria-current` were gone from the tree.
   * A person walked fifteen indistinguishable stops and committed blind.
   */
  interactive?: boolean;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const layerRef = useRef<SVGGElement>(null);
  const view = useRef<Viewport>({ x: 0, y: 0, k: 1 });
  const drag = useRef<{ x: number; y: number; vx: number; vy: number } | null>(
    null,
  );
  const [grabbing, setGrabbing] = useState(false);

  /**
   * Writes the transform straight to the DOM. React state here would re-render
   * the whole circuit on every pointer move.
   *
   * Animation is a CSS transition rather than a requestAnimationFrame loop:
   * the loop competed with React's own render scheduling and its frames were
   * being dropped, and the browser can composite this transform off the main
   * thread anyway.
   */
  const apply = useCallback(
    (next: Viewport, animate = false) => {
      view.current = next;
      const layer = layerRef.current;
      if (!layer) return;

      const reduced =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      layer.style.transformOrigin = "0 0";
      layer.style.transition =
        animate && !reduced
          ? "transform var(--duration-deliberate) var(--ease-out-soft)"
          : "none";
      layer.style.transform = `translate(${next.x}px, ${next.y}px) scale(${next.k})`;
      onScaleChange?.(next.k);
    },
    [onScaleChange],
  );

  const boxFor = useCallback(
    (
      box: { x: number; y: number; width: number; height: number },
      scale?: number,
    ): Viewport => {
      const svg = svgRef.current;
      if (!svg) return view.current;

      const rect = svg.getBoundingClientRect();
      /* The kit shelf is painted OVER this element, not above it, so the
         region's own height is not the height anything can be seen in.
         Framing against the full rect centred chapter two's build under the
         shelf and hid the breadboard's `+` rail behind it on the frame the
         chapter opens on. Everything a camera does — the opening fit, `Fit
         view`, the agent's focus, the jump on picking a lead up — goes through
         here, so one inset covers all of them. */
      const top = Math.min(insetTop, rect.height / 2);
      const usable = rect.height - top;
      const fitted = Math.min(rect.width / box.width, usable / box.height);
      const k = clamp(scale ?? fitted, zoomLimits.min, zoomLimits.max);

      return {
        k,
        x: rect.width / 2 - (box.x + box.width / 2) * k,
        y: top + usable / 2 - (box.y + box.height / 2) * k,
      };
    },
    [insetTop],
  );

  /* Defaults to the whole desk. A build that uses less of it says so — see
     `lampFitBox` — so "fit" means the build rather than the bench. */
  const fitTarget = fitBox ?? {
    x: 0,
    y: 0,
    width: sceneBox.width,
    height: sceneBox.height,
  };

  const fitView = useCallback(
    (animate = true) => {
      apply(boxFor(fitTarget), animate);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [apply, boxFor, fitTarget.x, fitTarget.y, fitTarget.width, fitTarget.height],
  );

  useImperativeHandle(ref, () => ({
    fitView,
    zoomBy: (factor) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const { x, y, k } = view.current;
      const nextK = clamp(k * factor, zoomLimits.min, zoomLimits.max);
      apply(
        {
          k: nextK,
          x: cx - ((cx - x) / k) * nextK,
          y: cy - ((cy - y) / k) * nextK,
        },
        true,
      );
    },
    focusOn: (box, opts) =>
      apply(boxFor(box, opts?.scale), opts?.animate ?? true),
    getScale: () => view.current.k,
    toScene: (clientX, clientY) => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const rect = svg.getBoundingClientRect();
      const { x, y, k } = view.current;
      return {
        x: (clientX - rect.left - x) / k,
        y: (clientY - rect.top - y) / k,
      };
    },
  }));

  /**
   * Fit once per **box**, when the element first has a size.
   *
   * Refitting on every resize looks tidy and is wrong: the agent focuses the
   * canvas on two pins, the panel beside it grows by one line, the observer
   * fires, and the focus the agent just asked for is thrown away. A change the
   * user did see, undone by a change they did not (rule 6). The view is theirs
   * from that point on; `Fit view` is one button away.
   *
   * But "once, ever" was too strong, and it opened every assembled chapter at
   * the wrong size. `openBuild` runs in an effect, so the FIRST render of a
   * bench always carries the previous build's row — the capstone's, on a cold
   * load — and the capstone has no `fitBox`. The whole desk got framed, the
   * box arrived a tick later, and nothing was allowed to look at it again: a
   * chapter that uses a third of the scene opened at 82% with its build the
   * size of a stamp, exactly the fault `lampFitBox`'s own note was written
   * about. Walking from one bench to another without a reload had it too.
   *
   * So the memory is the box rather than a flag. A resize does not change it
   * and rule 6 holds; a different build does, and that is a different bench.
   */
  const fittedFor = useRef<string | null>(null);
  const fitKey = `${fitTarget.x}|${fitTarget.y}|${fitTarget.width}|${fitTarget.height}`;
  /**
   * Where this region's top-left was the last time anybody looked.
   *
   * The transform is written relative to the element, so a region that moves on
   * screen takes the whole bench with it — see the compensation below.
   */
  const anchored = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const open = () =>
      initialView
        ? apply(boxFor(initialView), false)
        : fitView(false);

    /* Take the box now if the element already has a size. The observer below
       fires on `observe`, but only ever after a paint — and a box that arrives
       without the region changing size (which is what a build's row landing a
       tick late looks like) would otherwise wait for a resize that never
       comes. */
    const openIfDue = (rect: DOMRect) => {
      if (!rect.width || !rect.height) return false;
      if (fittedFor.current === fitKey) return false;
      fittedFor.current = fitKey;
      anchored.current = { x: rect.left, y: rect.top };
      open();
      return true;
    };

    if (typeof ResizeObserver === "undefined") {
      openIfDue(svg.getBoundingClientRect());
      return;
    }

    openIfDue(svg.getBoundingClientRect());

    const observer = new ResizeObserver(() => {
      const rect = svg.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      if (openIfDue(rect)) return;

      /**
       * **The bench does not move because the words above it changed.**
       *
       * The pan lives in a transform on the layer, which is relative to this
       * element — so when the region itself is pushed down the page, everything
       * drawn in it slides down with it. Picking up a lead does exactly that:
       * the instruction above grows a row of buttons, this region loses 48px
       * off its top, and the board lurches half an inch under the hand that is
       * already reaching for a hole 9px wide.
       *
       * Undoing the shift in the transform keeps the scene where the person is
       * looking. What is lost is 48px off the bottom of the view, which is the
       * honest consequence of a smaller region and is not a thing anybody was
       * aiming at. Only the *offset* is compensated — the zoom is untouched, so
       * this can never become the re-fit rule 6 forbids.
       */
      const was = anchored.current;
      anchored.current = { x: rect.left, y: rect.top };
      if (!was) return;
      const dx = rect.left - was.x;
      const dy = rect.top - was.y;
      if (dx === 0 && dy === 0) return;
      apply(
        { ...view.current, x: view.current.x - dx, y: view.current.y - dy },
        false,
      );
    });
    observer.observe(svg);
    return () => observer.disconnect();
  }, [fitView, apply, boxFor, initialView, fitKey]);

  const onWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;
    const { x, y, k } = view.current;

    const nextK = clamp(
      k * Math.exp(-event.deltaY * 0.0015),
      zoomLimits.min,
      zoomLimits.max,
    );

    /* Keep the point under the cursor fixed. */
    apply({
      k: nextK,
      x: px - ((px - x) / k) * nextK,
      y: py - ((py - y) / k) * nextK,
    });
  };

  const onPointerDown = (event: React.PointerEvent) => {
    if (event.button !== 0) return;
    /* `setPointerCapture` THROWS when the id names no active pointer — an
       optional call guards the method's existence, not the throw, and the
       exception it left in the console came out of a press nobody could see.
       Captured on `currentTarget`, the same element the pan handlers are on:
       `event.target` is whatever child was under the cursor, and a child that
       re-renders mid-drag takes the capture with it. Same shape as
       `use-part-drag.ts`'s bind, for the same reason. */
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* A synthesised pointer has no active id; the moves still arrive. */
    }
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      vx: view.current.x,
      vy: view.current.y,
    };
    setGrabbing(true);
  };

  const onPointerMove = (event: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    apply({
      ...view.current,
      x: d.vx + (event.clientX - d.x),
      y: d.vy + (event.clientY - d.y),
    });
  };

  const endDrag = () => {
    drag.current = null;
    setGrabbing(false);
  };

  return (
    <svg
      ref={svgRef}
      role={interactive ? "group" : "img"}
      aria-label={ariaLabel}
      className={cn(
        "bg-surface-sunken layer-sunken h-full w-full touch-none select-none",
        grabbing ? "cursor-grabbing" : "cursor-grab",
        className,
      )}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={endDrag}
    >
      <g ref={layerRef}>{children}</g>
    </svg>
  );
}
