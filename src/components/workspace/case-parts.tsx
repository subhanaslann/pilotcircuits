import type { ReactElement } from "react";
import type { ComponentId } from "@/lib/projects/catalog";
import { useSvgPrefix } from "@/components/canvas/svg-ids";
import { material } from "@/components/illustration/spec";

/**
 * W-01 · What is in the case.
 *
 * Ten parts, each declared as a **solid**: a footprint on the floor of the box,
 * a height, the colour of its sides, and a drawing for its top face. The case
 * builds a real slab out of that — a top face and the two walls the camera can
 * see — and puts it through the same projection as the box itself, so a part
 * standing in the box is genuinely standing in it and gets its perspective and
 * its foreshortening from the geometry rather than from a shear worked out by
 * hand. The arrangement is fitted to the tray as a whole (`case-geometry.ts`),
 * evenly in both directions, so these numbers stay the layout they were drawn
 * as even when the box's proportions change under them.
 *
 * That is why this file changed shape. The first version drew the parts flat and
 * sheared them onto the floor plane, and flat is exactly what they looked like:
 * stickers on a mat. A servo is 22mm tall and a breadboard is 9mm tall, and the
 * difference between them is most of what makes an open toolbox read as an
 * object rather than as a diagram of one.
 *
 * ## Why these are drawn again rather than reused
 *
 * `illustration/spec.ts` settles it: the palette is shared and the drawings are
 * not. The canvas draws parts at a real breadboard pitch for someone comparing
 * them with the desk in front of them; the entry screen draws them at 920px for
 * a still life; a top face here is about 140 CSS pixels across. Every colour,
 * though, comes from the one palette, so the servo in the case is the same blue
 * as the servo on the bench.
 *
 * ## Why a slot per component id
 *
 * The case shows the *selected project's* kit, and the catalogue says which
 * parts that is. Each id owns a fixed place on the floor, so a build without a
 * servo leaves that space empty rather than the case quietly showing a part the
 * project does not need (§18).
 */

/**
 * One part, in stage units. A unit is one per cent of the case's own width, so
 * every number here is resolution-independent and the whole scene scales with
 * its column without a single `scale()`.
 */
export interface PartSpec {
  /** Centre of the footprint on the floor: `x` across, `z` front-to-back. */
  x: number;
  z: number;
  /** Footprint. */
  w: number;
  d: number;
  /** How tall the part stands. */
  h: number;
  /** The part's own sides, one step down from the colour of its top. */
  side: string;
  /**
   * Loose hardware, which lies on the liner rather than standing on it.
   *
   * LEDs, resistors, jumpers and a cable have no rectangular footprint to build
   * walls around: a slab whose top face is mostly transparent shows its own
   * inside through the gap. These get their top plane and nothing else.
   */
  flat?: boolean;
  /** The top face, drawn in a viewBox with the footprint's proportions. */
  art: ReactElement;
  /** That viewBox, so the renderer can fit the drawing to the projected quad. */
  artW: number;
  artH: number;
}

/* --- The six -------------------------------------------------------------- */

const board = (
  <g>
    <rect x={0} y={0} width={220} height={140} rx={7} fill={material.pcbGreen} />
    {/* The two headers that run the length of the board. */}
    <rect x={52} y={5} width={152} height={16} rx={3} fill={material.shell} />
    <rect x={38} y={119} width={146} height={16} rx={3} fill={material.shell} />
    {[...Array(14)].map((_, i) => (
      <rect key={`t${i}`} x={58 + i * 10} y={9} width={5} height={8} rx={1} fill={material.gold} />
    ))}
    {[...Array(13)].map((_, i) => (
      <rect key={`b${i}`} x={44 + i * 10} y={123} width={5} height={8} rx={1} fill={material.gold} />
    ))}
    {/* The package in the middle, and the mark that names the board. */}
    <rect x={70} y={62} width={104} height={34} rx={3} fill={material.chip} />
    <rect x={86} y={72} width={68} height={4} rx={2} fill="#3D444D" />
    <rect x={86} y={82} width={44} height={4} rx={2} fill="#3D444D" />
    <rect x={30} y={60} width={26} height={24} rx={3} fill={material.shellSoft} />
    <rect x={186} y={30} width={26} height={20} rx={3} fill={material.shell} />
    <g stroke={material.plasticWhite} strokeWidth={3.4} fill="none" opacity={0.9}>
      <circle cx={116} cy={40} r={11} />
      <circle cx={140} cy={40} r={11} />
    </g>
    {/* The metal USB shell, on the board's left edge. */}
    <rect x={-2} y={26} width={40} height={30} rx={2} fill={material.metal} />
    <rect x={2} y={32} width={16} height={18} rx={2} fill="#5E656C" />
  </g>
);

/**
 * The one top face with a `<defs>` element of its own, so the one that has to
 * be a component rather than an element.
 *
 * An SVG `id` is document-global: `cp-case-bb` was the pattern's name whatever
 * drew it, so a second kit case anywhere in the same document would have
 * resolved both cases' hole rows to the first one's pattern. Only one case is
 * on `/workspace` today, which is why this was latent rather than live —
 * `svg-ids.test.ts` tolerated this file and `kit-case.tsx` by name for exactly
 * that reason, and no longer has to.
 */
function BreadboardTop() {
  const uid = useSvgPrefix();
  return (
    <g>
      <rect x={0} y={0} width={360} height={110} rx={4} fill={material.cream} />
      <line x1={14} y1={13} x2={346} y2={13} stroke="#C8474C" strokeWidth={2.4} />
      <line x1={14} y1={28} x2={346} y2={28} stroke="#3F6FB5" strokeWidth={2.4} />
      <line x1={14} y1={82} x2={346} y2={82} stroke="#C8474C" strokeWidth={2.4} />
      <line x1={14} y1={97} x2={346} y2={97} stroke="#3F6FB5" strokeWidth={2.4} />
      <rect x={8} y={50} width={344} height={10} fill="#D3D0C7" />
      <pattern
        id={`${uid}-bb`}
        x={16}
        y={36}
        width={9.5}
        height={8}
        patternUnits="userSpaceOnUse"
      >
        <rect x={2.6} y={2} width={4.2} height={4.2} rx={1} fill="#7A828A" />
      </pattern>
      <rect x={16} y={34} width={330} height={16} fill={`url(#${uid}-bb)`} />
      <rect x={16} y={60} width={330} height={16} fill={`url(#${uid}-bb)`} />
    </g>
  );
}

const breadboard = <BreadboardTop />;

const sensor = (
  <g>
    <rect x={0} y={0} width={150} height={70} rx={4} fill={material.pcbBlue} />
    {[36, 114].map((cx) => (
      <g key={cx}>
        <circle cx={cx} cy={32} r={29} fill="#9AA2AA" stroke={material.canRim} strokeWidth={2.4} />
        <circle cx={cx} cy={32} r={20} fill="none" stroke={material.canRing} strokeWidth={2.4} />
        <circle cx={cx} cy={32} r={9} fill="#2A3138" />
      </g>
    ))}
    <rect x={66} y={12} width={18} height={18} rx={3} fill={material.metal} />
    <rect x={64} y={38} width={22} height={12} rx={2} fill={material.chip} />
    <rect x={52} y={60} width={46} height={8} rx={2} fill={material.shell} />
  </g>
);

const servo = (
  <g>
    {/* Mounting tabs run past the body on both sides. */}
    <rect x={0} y={14} width={120} height={22} rx={3} fill={material.servoBlueEdge} />
    <circle cx={9} cy={25} r={3.4} fill="#173F82" />
    <circle cx={111} cy={25} r={3.4} fill="#173F82" />
    <rect x={22} y={0} width={76} height={50} rx={5} fill={material.servoBlue} />
    <rect x={28} y={5} width={64} height={40} rx={4} fill="none" stroke="#5C95EE" strokeWidth={2} opacity={0.7} />
    {/* The gearbox boss, and the cream horn fitted on it. */}
    <circle cx={41} cy={25} r={15} fill={material.servoBlueEdge} />
    <rect x={33} y={18} width={54} height={14} rx={7} fill={material.armLight} stroke={material.armLightEdge} strokeWidth={2} />
    <circle cx={41} cy={25} r={11} fill={material.armLight} stroke={material.armLightEdge} strokeWidth={2} />
    <circle cx={41} cy={25} r={3.6} fill={material.metalDark} />
  </g>
);

const led = (
  <g>
    {[
      { cx: 20, fill: material.ledRed },
      { cx: 46, fill: material.ledGreen },
    ].map((dome) => (
      <g key={dome.cx}>
        <circle cx={dome.cx} cy={22} r={13} fill={dome.fill} />
        <circle cx={dome.cx - 4} cy={17} r={4} fill="#FFFFFF" opacity={0.5} />
      </g>
    ))}
  </g>
);

const resistor = (
  <g>
    {[10, 28].map((cy) => (
      <g key={cy}>
        <line x1={2} y1={cy} x2={118} y2={cy} stroke={material.leg} strokeWidth={2.6} />
        <rect x={36} y={cy - 6} width={48} height={12} rx={6} fill={material.beige} />
        <rect x={44} y={cy - 6} width={4} height={12} fill={material.bandRed} />
        <rect x={52} y={cy - 6} width={4} height={12} fill={material.bandRed} />
        <rect x={60} y={cy - 6} width={4} height={12} fill={material.bandBrown} />
        <rect x={72} y={cy - 6} width={3.4} height={12} fill={material.gold} />
      </g>
    ))}
  </g>
);

/**
 * Where each part stands, with the floor's centre at the origin.
 *
 * The back row carries the three parts a build is *about* — the board, what it
 * senses with, what it moves with — and the front row carries the breadboard
 * they go into and the loose hardware. That is how a kit is actually packed, and
 * it is also the order the eye reads them in.
 */
export const PART_SPECS: Record<ComponentId, PartSpec> = {
  board: { x: -20, z: -10, w: 22, d: 14, h: 2, side: material.pcbGreenEdge, art: board, artW: 220, artH: 140 },
  sensor: { x: -1, z: -13, w: 15, d: 7, h: 2.4, side: material.pcbBlueEdge, art: sensor, artW: 150, artH: 70 },
  servo: { x: 14, z: -13, w: 12, d: 5, h: 3.6, side: material.servoBlueEdge, art: servo, artW: 120, artH: 50 },
  breadboard: { x: -12, z: 6.5, w: 31, d: 10.5, h: 1.5, side: material.creamEdge, art: breadboard, artW: 360, artH: 110 },
  led: { x: 10, z: 5.5, w: 6.5, d: 4.5, h: 0.8, side: "#9A5A5C", art: led, artW: 65, artH: 45, flat: true },
  resistor: { x: 11, z: 12, w: 12, d: 4, h: 0.6, side: material.beigeEdge, art: resistor, artW: 120, artH: 40, flat: true },
};
