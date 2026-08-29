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

const EXIT = PITCH * 0.9;
/** Sag as a fraction of span, capped so long wires do not droop absurdly. */
const SAG = 0.18;
const MAX_SAG = PITCH * 9;

/**
 * Which way each leg leaves its hole: away from the other end, straight up or
 * down. Exported because the connector housing has to sit on the same axis —
 * a housing drawn across the leg would look like the wire is lying on the pin
 * rather than plugged into it.
 */
export function wireExits(from: CircuitNode, to: CircuitNode) {
  return {
    from: from.y <= to.y ? -EXIT : EXIT,
    to: to.y <= from.y ? -EXIT : EXIT,
  };
}

export function wirePath(from: CircuitNode, to: CircuitNode): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const span = Math.hypot(dx, dy);

  const { from: exitFrom, to: exitTo } = wireExits(from, to);

  const ax = from.x;
  const ay = from.y + exitFrom;
  const bx = to.x;
  const by = to.y + exitTo;

  const sag = Math.min(span * SAG, MAX_SAG);
  const midX = (ax + bx) / 2;
  const midY = (ay + by) / 2 + sag;

  return [
    `M ${from.x} ${from.y}`,
    `L ${ax} ${ay}`,
    `Q ${midX} ${midY} ${bx} ${by}`,
    `L ${to.x} ${to.y}`,
  ].join(" ");
}

/** Midpoint of the curve — where a wire's label and icon sit. */
export function wireMidpoint(from: CircuitNode, to: CircuitNode) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const span = Math.hypot(dx, dy);
  const sag = Math.min(span * SAG, MAX_SAG);

  const { from: exitFrom, to: exitTo } = wireExits(from, to);
  const ay = from.y + exitFrom;
  const by = to.y + exitTo;

  /* Quadratic curve at t = 0.5. */
  const midX = (from.x + to.x) / 2;
  const controlY = (ay + by) / 2 + sag;
  const midY = 0.25 * ay + 0.5 * controlY + 0.25 * by;

  return { x: midX, y: midY };
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
