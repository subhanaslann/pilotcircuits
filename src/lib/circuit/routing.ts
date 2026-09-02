import { PITCH } from "@/lib/circuit/geometry";
import type { CircuitNode } from "@/lib/circuit/graph";

/**
 * Batch 3 · Wire routing.
 *
 * A jumper wire is not a schematic line. It leaves its hole vertically for a
 * few millimetres — the leg is stiff — then sags across the gap under its own
 * weight. The path below reproduces that: a short vertical exit at each end,
 * joined by a curve whose sag grows with the distance spanned.
 *
 * Paths are derived, never stored. Move an endpoint and the wire follows.
 */

/**
 * The stiff exit. 0.6 of a pitch, not 0.9: with the round cap and the 4.2-unit
 * rim the stroke of a 9-unit stub reached 11.1 units — into the next hole on
 * every bench (G8, D29, I10, neg7 measured at 1.0 unit or closer).
 */
const EXIT = PITCH * 0.6;
/** Sag as a fraction of span, capped so long wires do not droop absurdly. */
const SAG = 0.18;
const MAX_SAG = PITCH * 9;

/**
 * Which way each leg leaves its hole, straight up or down. Exported because the
 * connector housing has to sit on the same axis — a housing drawn across the
 * leg would look like the wire is lying on the pin rather than plugged into it.
 *
 * A node that knows which way a lead leaves it says so (`exit`): a header pin
 * is on an edge of the board and its cable comes in from outside that edge, a
 * rail is on an edge of the breadboard, a module's pins are on one edge of
 * its case. Everything else — a hole in the middle of the board — leaves away
 * from the other end, which is the stiff lead rising before the cable droops.
 * The old rule was "away" for everything, so a cable from the breadboard to
 * `D13` dived under the header and came up into the pin from inside the PCB,
 * crossing the neighbouring pin's housing at 24° on the way.
 */
export function wireExits(from: CircuitNode, to: CircuitNode) {
  const of = (node: CircuitNode, other: CircuitNode) =>
    node.exit
      ? node.exit === "up"
        ? -EXIT
        : EXIT
      : node.y <= other.y
        ? -EXIT
        : EXIT;
  return { from: of(from, to), to: of(to, from) };
}

/**
 * What is physically making the join — a cable, or a component's own lead.
 *
 * `Connection.medium`, narrowed to what routing actually depends on and
 * defaulted the same way, so a caller that has a `Connection` can pass
 * `connection.medium` straight through.
 */
export type Medium = "jumper" | "leg";

/** A hole in something: the board's header, or the breadboard. */
const seatsALead = (node: CircuitNode) => node.kind !== "terminal";

/**
 * A component's own lead, which is not a cable and must not be routed as one.
 *
 * Two things a jumper's path does are wrong for a leg, and chapter one is made
 * entirely of legs:
 *
 *   1. **The exit stub goes the wrong way at the lower end.** `wireExits` sends
 *      each end *away* from the other, which is right for a cable rising out of
 *      two holes and sagging between them — and backwards the moment one end is
 *      a hole and the other is a part standing above it. The resistor's leg was
 *      drawn diving nine units *through* the board below `D9` and coming back
 *      up, and so was the LED's long leg below `D13`: two legs stabbed through
 *      the PCB and stopped on the silkscreen, on the one bench where the parts
 *      stand in the header and every unit of it is visible.
 *   2. **A 220Ω lead does not sag.** It is a stiff piece of tinned wire a third
 *      of a millimetre thick. Given `SAG`, a 49-unit leg bowed nine units out
 *      of true, which reads as a cable and not as a leg.
 *
 * So a leg leaves its hole the only way a lead can — straight out of the board
 * — and bends once, towards whatever it is reaching for. Between two leads in
 * the air (chapter one's middle join is exactly that) there is no hole to leave
 * and it is simply the shortest line, which is what a leg clipped to another
 * leg looks like from above.
 */
/**
 * Where a leg bends: straight down out of the lead's tip, straight up into the
 * hole. One control level with the far end used to sit *beside* the tip, so a
 * lead whose tip overhung its hole left backwards first — chapter one's
 * resistor leg ran four units back through the resistor's own body.
 */
function legControls(far: CircuitNode, hole: CircuitNode) {
  const drop = Math.abs(hole.y - far.y) / 2;
  const down = hole.y >= far.y ? drop : -drop;
  return {
    tip: { x: far.x, y: far.y + down },
    hole: { x: hole.x, y: hole.y - down },
  };
}

function legPath(from: CircuitNode, to: CircuitNode): string {
  const bend = seatsALead(from) ? from : seatsALead(to) ? to : undefined;
  if (!bend) return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;

  /* The control point sits over the hole, level with the far end: the curve
     leaves the far lead heading across, and arrives at the hole heading
     straight down into it. Never past it — a leg ends where the board is. */
  const far = bend === from ? to : from;
  const c = legControls(far, bend);
  const [c1, c2] = bend === from ? [c.hole, c.tip] : [c.tip, c.hole];
  return `M ${from.x} ${from.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${to.x} ${to.y}`;
}

type XY = { x: number; y: number };

/**
 * The run between the two stub tips: two cubics through a belly.
 *
 * A single quadratic with its control under the chord's midpoint gave the
 * cable its droop — and turned a hairpin on each stub's tip, because the curve
 * left the tip heading straight for the belly. Two cubics keep the droop (the
 * belly sits where the quadratic's did, half the sag under the midpoint, with
 * the chord's own direction as its tangent so a vertical run stays vertical
 * there) and continue each stub for a moment before bending, so the cable
 * leaves along its stub and arrives along the other one. Where the arrival
 * ends is `wireExits`' business; this only follows it.
 */
function jumperRun(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  exitFrom: number,
  exitTo: number,
) {
  const span = Math.hypot(bx - ax, by - ay);
  const sag = Math.min(span * SAG, MAX_SAG);
  const belly = { x: (ax + bx) / 2, y: (ay + by) / 2 + sag / 2 };
  const ux = span > 0 ? (bx - ax) / span : 0;
  const uy = span > 0 ? (by - ay) / span : 1;
  const handle = span / 4;
  /* How far the cable keeps to its stub's axis before it bends. */
  const reach = Math.min(EXIT * 1.5, span / 6);
  return {
    a1: { x: ax, y: ay + Math.sign(exitFrom) * reach },
    a2: { x: belly.x - ux * handle, y: belly.y - uy * handle },
    belly,
    b1: { x: belly.x + ux * handle, y: belly.y + uy * handle },
    b2: { x: bx, y: by + Math.sign(exitTo) * reach },
  };
}

export function wirePath(
  from: CircuitNode,
  to: CircuitNode,
  medium: Medium = "jumper",
): string {
  if (medium === "leg") return legPath(from, to);

  const { from: exitFrom, to: exitTo } = wireExits(from, to);

  const ax = from.x;
  const ay = from.y + exitFrom;
  const bx = to.x;
  const by = to.y + exitTo;

  const r = jumperRun(ax, ay, bx, by, exitFrom, exitTo);

  return [
    `M ${from.x} ${from.y}`,
    `L ${ax} ${ay}`,
    `C ${r.a1.x} ${r.a1.y} ${r.a2.x} ${r.a2.y} ${r.belly.x} ${r.belly.y}`,
    `C ${r.b1.x} ${r.b1.y} ${r.b2.x} ${r.b2.y} ${bx} ${by}`,
    `L ${to.x} ${to.y}`,
  ].join(" ");
}

/** A point on a cubic Bézier, `t` running 0 → 1. */
function cubicAt(p0: XY, p1: XY, p2: XY, p3: XY, t: number): XY {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return {
    x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
    y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
  };
}

/**
 * A point on the drawn curve, `t` running 0 → 1 from `from` to `to`.
 *
 * The same cubic `wirePath` emits, evaluated rather than re-derived, so a
 * label placed by this sits **on the cable** at every zoom and stays there when
 * an endpoint moves.
 */
export function wirePointAt(
  from: CircuitNode,
  to: CircuitNode,
  t: number,
  medium: Medium = "jumper",
) {
  /* A leg's own quadratic, or its straight line — read off the same two
     branches `legPath` emits, so a pill sits on the leg rather than on the
     cable the leg is not. */
  if (medium === "leg") {
    const bend = seatsALead(from) ? from : seatsALead(to) ? to : undefined;
    if (!bend) {
      return {
        x: from.x + (to.x - from.x) * t,
        y: from.y + (to.y - from.y) * t,
      };
    }
    const far = bend === from ? to : from;
    const c = legControls(far, bend);
    const [c1, c2] = bend === from ? [c.hole, c.tip] : [c.tip, c.hole];
    return cubicAt(from, c1, c2, to, t);
  }

  const { from: exitFrom, to: exitTo } = wireExits(from, to);
  const ax = from.x;
  const ay = from.y + exitFrom;
  const bx = to.x;
  const by = to.y + exitTo;
  const r = jumperRun(ax, ay, bx, by, exitFrom, exitTo);

  /* Two segments, `t` split evenly — the belly is the halfway point, which is
     where a label sits by default. */
  return t < 0.5
    ? cubicAt({ x: ax, y: ay }, r.a1, r.a2, r.belly, t * 2)
    : cubicAt(r.belly, r.b1, r.b2, { x: bx, y: by }, t * 2 - 1);
}

/** Midpoint of the curve — where a wire's label and icon sit by default. */
export function wireMidpoint(
  from: CircuitNode,
  to: CircuitNode,
  medium: Medium = "jumper",
) {
  return wirePointAt(from, to, 0.5, medium);
}

/* --- Label pills ---------------------------------------------------------
   The capsule `WireLabel` draws is opaque, so two of them on one midpoint do
   not blend into an unreadable knot — the later one simply erases the earlier,
   and `Trig → D8` renders as a bare `T`. Its size lives here, beside the
   placement that has to know it.                                            */

export const WIRE_LABEL_HEIGHT = PITCH * 1.8;

export function wireLabelWidth(text: string) {
  return text.length * PITCH * 0.55 + PITCH * 2.6;
}

/**
 * Slide each pill along its **own** cable until it covers no other pill.
 *
 * Why along the cable and not off to one side: a wire label is only worth
 * printing while you can tell which wire it names. Nudged perpendicular it
 * floats between two cables and names neither; slid along the curve it stays
 * exactly where the eye already is. The slots stay inside the middle half of
 * the run, because the ends are where every wire in a build converges on the
 * header and where the board prints its own silkscreen.
 *
 * Greedy and order-dependent on purpose: the first label in the list keeps the
 * midpoint, so the picture only moves where it has to. When no slot is clear —
 * more labels than the run has room for — the least-covered one wins, which
 * still beats a pill sitting exactly on top of another.
 */
const LABEL_SLOTS = [0.5, 0.58, 0.42, 0.66, 0.34, 0.74, 0.26];
/** Breathing room between two pills, so "clear" does not mean "touching". */
const LABEL_GAP = PITCH * 0.4;

export interface WireLabelSubject {
  /** Whatever the caller keys its wires by. */
  key: string;
  from: CircuitNode;
  to: CircuitNode;
  /** The text as drawn — the pill's width is measured off it. */
  text: string;
  /** Which path the pill has to sit on. Defaults to a jumper's. */
  medium?: Medium;
}

type Pill = { x: number; y: number; w: number; h: number };

function overlap(a: Pill, b: Pill) {
  const dx =
    Math.min(a.x + a.w / 2, b.x + b.w / 2) - Math.max(a.x - a.w / 2, b.x - b.w / 2);
  const dy =
    Math.min(a.y + a.h / 2, b.y + b.h / 2) - Math.max(a.y - a.h / 2, b.y - b.h / 2);
  return dx > 0 && dy > 0 ? dx * dy : 0;
}

export function placeWireLabels(
  subjects: readonly WireLabelSubject[],
): Record<string, { x: number; y: number }> {
  const placed: Pill[] = [];
  const at: Record<string, { x: number; y: number }> = {};

  for (const subject of subjects) {
    const w = wireLabelWidth(subject.text) + LABEL_GAP;
    const h = WIRE_LABEL_HEIGHT + LABEL_GAP;

    let best: Pill | null = null;
    let bestCover = Infinity;
    for (const t of LABEL_SLOTS) {
      const point = wirePointAt(subject.from, subject.to, t, subject.medium);
      const pill: Pill = { ...point, w, h };
      const cover = placed.reduce((sum, other) => sum + overlap(pill, other), 0);
      if (cover === 0) {
        best = pill;
        bestCover = 0;
        break;
      }
      if (cover < bestCover) {
        best = pill;
        bestCover = cover;
      }
    }

    /* `LABEL_SLOTS` is never empty, so `best` is always set. */
    placed.push(best!);
    at[subject.key] = { x: best!.x, y: best!.y };
  }

  return at;
}

/** Bounding box around a set of points, with padding — used by `focusOn`. */
export function boundsOf(
  points: { x: number; y: number }[],
  padding = PITCH * 6,
) {
  if (!points.length) return null;

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs) - padding;
  const minY = Math.min(...ys) - padding;
  const maxX = Math.max(...xs) + padding;
  const maxY = Math.max(...ys) + padding;

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}
