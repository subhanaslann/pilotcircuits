"use client";

import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { useSvgPrefix } from "@/components/canvas/svg-ids";
import { PART_SPECS } from "@/components/workspace/case-parts";
import {
  INK,
  benchShadow,
  buildCase,
  type Slab,
} from "@/components/workspace/case-geometry";
import {
  VIEWBOX,
  edgePathOf,
  pathOf,
} from "@/components/workspace/case-render";
import type { ComponentId } from "@/lib/projects/catalog";
import { cn } from "@/lib/utils/cn";

/**
 * W-01 · The kit case.
 *
 * A charcoal tool case standing on the bench, shut until you press it and then
 * hinged open at the back so you can see the parts lying in it.
 *
 * This file is the *screen* half of the case: the frame loop that moves it and
 * the SVG it is painted into. The case itself — its section, its hinge line, its
 * latch, the order its faces are laid down in — is `case-geometry.ts`, and the
 * projection and lighting are `case-render.ts`. The note at the top of that file
 * is where the reasoning for the whole approach is: this used to be a CSS 3D
 * scene and had to stop being one, because CSS 3D has no depth buffer and the
 * closed case rendered see-through on any screen with a device pixel ratio above
 * one.
 *
 * ## One case, one number
 *
 * Everything visible is `buildCase(slabs, p)` where `p` runs 0 to 1. There is no
 * open model and no shut model, no conditional anything: the latch letting go,
 * the lid breaking its seal, the hinge swinging and the lid settling onto its
 * stop are four windows of one parameter, and the geometry is rebuilt from it
 * every frame. Press the case again half way through and `p` simply turns round
 * and travels back from exactly where it is.
 *
 * The two things that are *not* functions of `p` are the ones that genuinely
 * belong to time rather than to the object: the couple of degrees the lid
 * overshoots before it settles, and the small knock as it comes home. Those ride
 * on top as `extraDeg`, which keeps `lidAngle` monotone — and a monotone angle
 * is what makes reversing mid-swing continuous instead of a jump.
 */

/* --- The drive ------------------------------------------------------------- */

const OPEN_MS = 1060;
const CLOSE_MS = 940;
/** Degrees past the resting angle, on the way open. */
const OVERSHOOT = 2.4;
/** Degrees of rebound as the lid meets the body. Barely there, on purpose. */
const KNOCK = 0.9;

const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
const ramp = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
/** Away quickly, home slowly — how a lid with weight in it shuts. */
const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);

/* --- The scene ------------------------------------------------------------- */

const BENCH = benchShadow();

const SLABS: Slab[] = Object.entries(PART_SPECS).map(([id, part]) => ({
  key: id,
  x: part.x,
  z: part.z,
  w: part.w,
  d: part.d,
  h: part.h,
  side: part.side,
  flat: part.flat,
  artW: part.artW,
  artH: part.artH,
}));

const slabsFor = (ids: readonly ComponentId[]): Slab[] =>
  SLABS.filter((s) => ids.includes(s.key as ComponentId));

/** The drawings, reachable by the key each slab carries. */
const PART_ART: Record<string, ReactElement> = Object.fromEntries(
  Object.entries(PART_SPECS).map(([id, part]) => [id, part.art]),
);

export function KitCase({
  components,
  open,
  onToggle,
  label,
  className,
}: {
  /** The selected build's kit, straight from the catalogue. */
  components: readonly ComponentId[];
  open: boolean;
  onToggle: () => void;
  /** What pressing the case does, in words, for assistive technology. */
  label: string;
  className?: string;
}) {
  const [motion, setMotion] = useState({ p: 0, extra: 0 });
  const held = useRef({ p: 0, extra: 0 });

  /**
   * The hinge, animated as a number.
   *
   * A frame loop rather than a CSS transition, because the thing being
   * interpolated is not a style — it is the parameter the whole case is rebuilt
   * from, and every frame is a fresh projection. The span is scaled by how far
   * there is left to travel, so an interrupted swing carries on at the speed it
   * was already going instead of restarting. Reduced motion runs the same loop
   * with no duration: the movement is the point of the control, but nobody has
   * to be shown it travelling.
   */
  useEffect(() => {
    const target = open ? 1 : 0;
    const from = held.current.p;
    /* Whatever bounce was in flight when the direction changed. It is decayed
       rather than dropped: reversing during the overshoot would otherwise take
       a couple of degrees out of the lid in a single frame, which is the one
       kind of jump this whole arrangement exists to avoid. */
    const carried = held.current.extra;
    if (from === target && carried === 0) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const span = reduced ? 0 : (open ? OPEN_MS : CLOSE_MS) * Math.abs(target - from);

    let frame = 0;
    const started = performance.now();
    const step = (now: number) => {
      const t = span === 0 ? 1 : clamp01((now - started) / span);
      /* Opening runs to the clock and lets the choreography inside `lidAngle`
         do the shaping; closing is warped so the lid comes away fast and takes
         its last few degrees slowly. */
      const shaped = open ? t : easeOutQuint(t);
      const p = from + (target - from) * shaped;

      const u = ramp(t, open ? 0.78 : 0.88, 1);
      const swell = Math.sin(Math.PI * u);
      const extra =
        carried * (1 - clamp01(t * 4)) +
        (open
          ? OVERSHOOT * swell * (1 - 0.4 * u)
          : KNOCK * swell * (1 - 0.5 * u));

      held.current = { p, extra };
      setMotion({ p, extra });
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [open]);

  /* Every gradient, pattern and clip path this case defines, under this copy's
     own name. SVG ids are document-global and `url(#…)` resolves against the
     page, so `cp-case-shadow`, `cp-face-N`, `cp-art-N` and the two clip names
     `case-geometry.ts` exports were the same for every case ever drawn: a
     second one in the same document would have taken the first's shadow, its
     face gradients and — through the cavity clip — the shape of its inside.
     `/workspace` draws one, so this was latent. It is the last of the fixed
     ids in `src/`, and `svg-ids.test.ts` can stop tolerating this file. */
  const uid = useSvgPrefix();

  const slabs = useMemo(() => slabsFor(components), [components]);
  const { facets, clips } = useMemo(
    () => buildCase(slabs, motion.p, motion.extra),
    [slabs, motion],
  );

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls="ws-inventory"
      aria-label={label}
      className={cn(
        "focus-visible:ring-focus group block w-full cursor-pointer rounded-xl",
        className,
      )}
    >
      <svg
        viewBox={`0 0 ${VIEWBOX.w} ${VIEWBOX.h}`}
        /* `meet`, the default, is what makes the case fit its box rather than
           fill it: handed a short box it shrinks and stays centred, which is
           how the inventory can appear underneath without the case moving. */
        className="block h-full max-h-full w-full"
        aria-hidden="true"
      >
        <defs>
          {/* The shadow the case throws on the bench. */}
          <radialGradient id={`${uid}-shadow`}>
            <stop offset="0" stopColor="#0C141C" stopOpacity="0.44" />
            <stop offset="0.5" stopColor="#0C141C" stopOpacity="0.2" />
            <stop offset="1" stopColor="#0C141C" stopOpacity="0" />
          </radialGradient>
          {facets.map((f, i) => {
            if (!f.grad) return null;
            const [x1, y1, x2, y2] = f.grad.dir ?? [0.1, 0, 0.7, 1];
            return (
              <linearGradient
                key={i}
                id={`${uid}-face-${i}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
              >
                <stop
                  offset="0"
                  stopColor={f.grad.from}
                  stopOpacity={f.grad.fromOpacity}
                />
                <stop
                  offset="1"
                  stopColor={f.grad.to}
                  stopOpacity={f.grad.toOpacity}
                />
              </linearGradient>
            );
          })}
          {Object.entries(clips).map(([id, d]) => (
            <clipPath key={id} id={`${uid}-${id}`}>
              <path d={d} />
            </clipPath>
          ))}
        </defs>

        {/* The bench under the case. Placed where the box's own footprint
            projects to rather than at the middle of the frame. */}
        <ellipse
          cx={BENCH.cx}
          cy={BENCH.cy}
          rx={BENCH.rx}
          ry={BENCH.ry}
          fill={`url(#${uid}-shadow)`}
          className="duration-deliberate ease-out-soft transition-opacity"
          style={{ opacity: open ? 1 : 0.82 }}
        />

        {facets.map((f, i) => {
          const d = pathOf(f.points);
          /* `inkEdges` is how a fillet gets outlined without its tessellation
             being outlined with it: an empty list means this face is interior
             to a smooth surface and carries no contour of its own. */
          const stroke = f.line
            ? d
            : f.inkEdges
              ? f.inkEdges.length
                ? edgePathOf(f.points, f.inkEdges)
                : ""
              : d;
          const width = f.inkWidth ?? 1.6;
          return (
            <g key={i} clipPath={f.clip ? `url(#${uid}-${f.clip})` : undefined}>
              {f.line ? null : (
                <path
                  d={d}
                  fill={f.grad ? `url(#${uid}-face-${i})` : f.fill}
                  opacity={f.opacity}
                  shapeRendering="geometricPrecision"
                />
              )}
              {f.halo && stroke ? (
                <path
                  d={stroke}
                  fill="none"
                  stroke={INK}
                  strokeWidth={width * 5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  opacity={0.09}
                />
              ) : null}
              {f.ink && stroke ? (
                <path
                  d={stroke}
                  fill="none"
                  stroke={INK}
                  strokeWidth={width}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  shapeRendering="geometricPrecision"
                />
              ) : null}
              {f.art ? (
                <>
                  <clipPath id={`${uid}-art-${i}`}>
                    <path d={d} />
                  </clipPath>
                  <g clipPath={`url(#${uid}-art-${i})`}>
                    <g transform={f.art.matrix}>{PART_ART[f.art.key] ?? null}</g>
                    {/* The one light, reaching the drawing. Artwork cannot be
                        tinted without a filter, and a filter would flatten this
                        group out of the picture it is part of. */}
                    <path
                      d={d}
                      fill="#0A1016"
                      opacity={Math.max(0, Math.min(0.4, 1 - (f.lit ?? 1)))}
                    />
                  </g>
                </>
              ) : null}
            </g>
          );
        })}
      </svg>
    </button>
  );
}
