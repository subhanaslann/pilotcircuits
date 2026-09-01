import { mat, scene } from "@/lib/circuit/geometry";
import { useSvgPrefix } from "@/components/canvas/svg-ids";
import { bench } from "@/components/illustration/spec";

/**
 * C-02 · Desk surface
 *
 * An oak bench with a dark cutting mat on it, drawn — never photographed. Two
 * jobs, and the mat does both: it gives the components a calm dark ground so
 * they stay the most readable thing on screen, and its printed grid *is* the
 * product's technical grid, so the ruler is part of the scene rather than an
 * overlay on top of it.
 *
 * The wood extends well past the scene so zooming out never reveals an edge.
 */

/**
 * The mat, plus the one thing only the drawing needs.
 *
 * The box itself is `geometry.mat`, because the briefing film frames against it
 * and this file used to be the only place the number existed. It was copied
 * here for a while and the copies agreed, which is exactly how a later change
 * to one of them gets half-applied — so there is one number now and a corner
 * radius on top of it.
 */
const MAT = { ...mat, radius: 22 };

/** Mat grid spacing — 40 units ≈ 1 cm, the pitch a real cutting mat prints. */
const MAT_GRID = 40;

/** How far the wood runs past the scene, so zoom-out finds no edge. */
const BLEED = 900;

export function DeskSurface() {
  /* Two benches can stand in one document — the workbench canvas and the
     inspection camera's, side by side — and a pattern id is document-global, so
     the second desk's grid would be drawn with the first desk's definitions. */
  const uid = useSvgPrefix();

  return (
    <g aria-hidden="true">
      <defs>
        {/* Oak: warm base, plank seams, and a few long grain lines. Kept low
            contrast on purpose — the desk is context, not the subject. */}
        <pattern
          id={`${uid}-cp-oak`}
          width={520}
          height={210}
          patternUnits="userSpaceOnUse"
        >
          <rect width={520} height={210} fill={bench.oak} />
          <rect y={0} width={520} height={70} fill={bench.plankMid} />
          <rect y={70} width={520} height={70} fill={bench.plankLow} />
          <rect y={140} width={520} height={70} fill={bench.plankHigh} />

          {/* Plank seams. */}
          <line x1={0} y1={70} x2={520} y2={70} stroke={bench.seam} strokeWidth={1.4} opacity={0.5} />
          <line x1={0} y1={140} x2={520} y2={140} stroke={bench.seam} strokeWidth={1.4} opacity={0.5} />
          <line x1={0} y1={209} x2={520} y2={209} stroke={bench.seam} strokeWidth={1.4} opacity={0.5} />

          {/* Grain. */}
          <path
            d="M0 24 C 130 18, 250 32, 380 24 S 520 16, 520 22"
            fill="none"
            stroke={bench.grain}
            strokeWidth={1.1}
            opacity={0.55}
          />
          <path
            d="M0 50 C 160 44, 300 58, 420 50 S 520 46, 520 50"
            fill="none"
            stroke={bench.grain}
            strokeWidth={0.9}
            opacity={0.4}
          />
          <path
            d="M0 96 C 120 88, 240 104, 360 96 S 520 90, 520 96"
            fill="none"
            stroke={bench.grainDeep}
            strokeWidth={1.1}
            opacity={0.5}
          />
          <path
            d="M0 124 C 180 118, 320 130, 450 122 S 520 120, 520 124"
            fill="none"
            stroke={bench.grainDeep}
            strokeWidth={0.8}
            opacity={0.35}
          />
          <path
            d="M0 168 C 140 160, 260 176, 390 168 S 520 162, 520 168"
            fill="none"
            stroke={bench.grain}
            strokeWidth={1.1}
            opacity={0.5}
          />
          <path
            d="M0 192 C 150 186, 290 198, 430 190 S 520 188, 520 192"
            fill="none"
            stroke={bench.grain}
            strokeWidth={0.8}
            opacity={0.32}
          />
        </pattern>

        {/* Mat grid: a fine line every centimetre, a stronger one every five. */}
        <pattern
          id={`${uid}-cp-mat-grid`}
          width={MAT_GRID}
          height={MAT_GRID}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${MAT_GRID} 0 L 0 0 0 ${MAT_GRID}`}
            fill="none"
            stroke={bench.matGrid}
            strokeWidth={0.7}
          />
        </pattern>
        <pattern
          id={`${uid}-cp-mat-grid-major`}
          width={MAT_GRID * 5}
          height={MAT_GRID * 5}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${MAT_GRID * 5} 0 L 0 0 0 ${MAT_GRID * 5}`}
            fill="none"
            stroke={bench.matGridMajor}
            strokeWidth={1.1}
          />
        </pattern>

        {/* Soft contact shadow under the mat. */}
        <filter id={`${uid}-cp-mat-shadow`} x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow
            dx="0"
            dy="5"
            stdDeviation="9"
            floodColor={bench.shadow}
            floodOpacity="0.32"
          />
        </filter>
      </defs>

      {/* Bench. */}
      <rect
        x={-BLEED}
        y={-BLEED}
        width={scene.width + BLEED * 2}
        height={scene.height + BLEED * 2}
        fill={`url(#${uid}-cp-oak)`}
      />

      {/* Cutting mat. */}
      <g filter={`url(#${uid}-cp-mat-shadow)`}>
        <rect
          x={MAT.x}
          y={MAT.y}
          width={MAT.width}
          height={MAT.height}
          rx={MAT.radius}
          fill={bench.mat}
        />
      </g>

      {/* Mat grid, clipped to the mat. */}
      <clipPath id={`${uid}-cp-mat-clip`}>
        <rect
          x={MAT.x}
          y={MAT.y}
          width={MAT.width}
          height={MAT.height}
          rx={MAT.radius}
        />
      </clipPath>
      <g clipPath={`url(#${uid}-cp-mat-clip)`} opacity={0.5}>
        <rect
          x={MAT.x}
          y={MAT.y}
          width={MAT.width}
          height={MAT.height}
          fill={`url(#${uid}-cp-mat-grid)`}
        />
        <rect
          x={MAT.x}
          y={MAT.y}
          width={MAT.width}
          height={MAT.height}
          fill={`url(#${uid}-cp-mat-grid-major)`}
        />
      </g>

      {/* Bevelled edge highlight, and the hanging holes a real mat has. */}
      <rect
        x={MAT.x}
        y={MAT.y}
        width={MAT.width}
        height={MAT.height}
        rx={MAT.radius}
        fill="none"
        stroke={bench.matBevel}
        strokeWidth={1.4}
      />
      {[
        [MAT.x + 26, MAT.y + 22],
        [MAT.x + MAT.width - 26, MAT.y + 22],
      ].map(([cx, cy]) => (
        <circle key={cx} cx={cx} cy={cy} r={3.2} fill={bench.matHole} />
      ))}
    </g>
  );
}

/** The mat's box, so parts and `fitView` can stay inside it. */
export const matBox = MAT;
