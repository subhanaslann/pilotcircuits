import type { WireRole } from "@/lib/design/tokens";

/**
 * Batch 3 · The build graph.
 *
 * One structure serves two readers: the canvas draws from it, and in Batch 7
 * the WebMCP tools (`get_build_context`, `inspect_build`,
 * `verify_current_step`) answer from it. There is deliberately no second copy
 * of the truth — if the agent says Echo is on D6, the canvas is already drawing
 * it on D6.
 *
 * Wire paths are NOT stored. They are derived from their two endpoints by
 * `routing.ts`, so "I fixed it" changes one `observed` record and the geometry
 * follows on its own.
 */

/** Stable address: `board.D7`, `sensor.echo`, `bb.e12`, `servo.signal`. */
export type NodeId = string;

export type NodeKind = "board-pin" | "breadboard-hole" | "terminal";

export interface CircuitNode {
  id: NodeId;
  kind: NodeKind;
  /** Scene coordinates, in the units defined by `geometry.ts`. */
  x: number;
  y: number;
  /** Printed on the board or the part: "D7", "5V", "Echo". */
  label?: string;
  /** Breadboard address, when applicable. */
  row?: string;
  col?: number;
}

export interface Connection {
  id: string;
  from: NodeId;
  to: NodeId;
  role: WireRole;
  /** Human label drawn beside the wire when it is highlighted. */
  label?: string;
}

export interface MechanicalState {
  /** Current horn angle in degrees. */
  servoAngle: number;
  /** What the sketch's OPEN position expects. */
  expectedAngle: number;
}

export interface CircuitScene {
  nodes: Record<NodeId, CircuitNode>;
  /** What the sketch defines. */
  expected: Connection[];
  /** What the demo currently observes. */
  observed: Connection[];
  mechanical: MechanicalState;
}

/**
 * What the agent is pointing at. Lives here rather than beside the component
 * that draws it, because both the canvas and the agent panel carry one and
 * neither should have to import the other.
 */
export interface Highlight {
  /** The connection the agent is talking about. */
  connectionId?: string;
  /** Pin that is wired but should not be. */
  errorPin?: NodeId;
  /** Pin the wire belongs on. */
  targetPin?: NodeId;
  /** What is being moved, named in the callout. */
  subject?: string;
}

/* --- Queries ------------------------------------------------------------- */

export function node(scene: CircuitScene, id: NodeId): CircuitNode {
  const found = scene.nodes[id];
  if (!found) throw new Error(`Unknown circuit node: ${id}`);
  return found;
}

/** True when both connections join the same pair of points, in either order. */
export function sameEndpoints(a: Connection, b: Connection): boolean {
  return (
    (a.from === b.from && a.to === b.to) || (a.from === b.to && a.to === b.from)
  );
}

export interface Mismatch {
  /** The connection the sketch defines. */
  expected: Connection;
  /** What is actually wired from the same origin, if anything. */
  observed?: Connection;
}

/**
 * Compares the two graphs. This is what `verify_current_step` will report and
 * what `inspect_build` turns into findings — the canvas highlight and the
 * agent's sentence come from the same call.
 */
export function diff(scene: CircuitScene, within?: Connection["id"][]) {
  const expected = within
    ? scene.expected.filter((c) => within.includes(c.id))
    : scene.expected;

  const mismatches: Mismatch[] = [];

  for (const want of expected) {
    const exact = scene.observed.find((got) => sameEndpoints(want, got));
    if (exact) continue;

    /* Same wire, wrong destination — the case the demo is built around. */
    const strayFromSameOrigin = scene.observed.find(
      (got) => got.from === want.from || got.to === want.from,
    );
    mismatches.push({ expected: want, observed: strayFromSameOrigin });
  }

  return { mismatches, matched: expected.length - mismatches.length };
}

/**
 * C-20 · What the compare view draws.
 *
 * Which of the reference build's connections the current one does not match.
 * Compares observed against observed — `diff()` answers the different question
 * of observed against the sketch.
 */
export function comparedTo(
  scene: CircuitScene,
  reference: CircuitScene,
): Connection[] {
  return reference.observed.filter((want) => {
    const got = scene.observed.find((c) => c.id === want.id);
    return !got || !sameEndpoints(want, got);
  });
}

export function isServoAligned(scene: CircuitScene): boolean {
  return scene.mechanical.servoAngle === scene.mechanical.expectedAngle;
}

/**
 * Puts one observed connection back where the sketch says it belongs — what
 * "I fixed it" does. Generic, so the demo controls and the tool handlers share
 * one implementation instead of one named helper per fault.
 */
export function applyExpected(
  scene: CircuitScene,
  id: Connection["id"],
): CircuitScene {
  const want = scene.expected.find((c) => c.id === id);
  if (!want) return scene;
  return {
    ...scene,
    observed: scene.observed.map((c) => (c.id === id ? { ...want } : c)),
  };
}
