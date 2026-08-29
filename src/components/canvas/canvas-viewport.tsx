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
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function CanvasViewport({
  ref,
  children,
  onScaleChange,
  initialView,
  className,
  ariaLabel,
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
  className?: string;
  ariaLabel: string;
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
      const fitted = Math.min(rect.width / box.width, rect.height / box.height);
      const k = clamp(scale ?? fitted, zoomLimits.min, zoomLimits.max);

      return {
        k,
        x: rect.width / 2 - (box.x + box.width / 2) * k,
        y: rect.height / 2 - (box.y + box.height / 2) * k,
      };
    },
    [],
  );

  const fitView = useCallback(
    (animate = true) => {
      apply(
        boxFor({ x: 0, y: 0, width: sceneBox.width, height: sceneBox.height }),
        animate,
      );
    },
    [apply, boxFor],
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
  }));

  /**
   * Fit once, when the element first has a size — and never again.
   *
   * Refitting on every resize looks tidy and is wrong: the agent focuses the
   * canvas on two pins, the panel beside it grows by one line, the observer
   * fires, and the focus the agent just asked for is thrown away. A change the
   * user did see, undone by a change they did not (rule 6). The view is theirs
   * from that point on; `Fit view` is one button away.
   */
  const fitted = useRef(false);
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const open = () =>
      initialView
        ? apply(boxFor(initialView), false)
        : fitView(false);

    if (typeof ResizeObserver === "undefined") {
      open();
      return;
    }

    const observer = new ResizeObserver(() => {
      if (fitted.current) return;
      const rect = svg.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      fitted.current = true;
      open();
    });
    observer.observe(svg);
    return () => observer.disconnect();
  }, [fitView, apply, boxFor, initialView]);

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
    (event.target as Element).setPointerCapture?.(event.pointerId);
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
      role="img"
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
