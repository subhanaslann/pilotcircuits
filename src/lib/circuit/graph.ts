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
  /**
   * What is physically making the join.
   *
   * Chapter one has no jumper wires — its parts stand in the board's own header
   * and the joins are the components' own legs. The canvas draws both the same
   * way for now; what this changes is the kit list under the step, which was
   * offering a beginner two jumper cables they do not need and do not have.
   *
   * Defaults to a jumper, because every other build is wired with them.
   */
  medium?: "jumper" | "leg";
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
  /**
   * Groups of node ids that name the same physical thing.
   *
   * A 220Ω resistor has no polarity: `res.in` and `res.out` are one component's
   * two ends, swapping them makes no electrical difference, and the step text
   * says so. The record has to call them something, and until this existed the
   * names were treated as facts — so a lamp built with the resistor turned
   * round, which is a correct circuit that lights up, was reported as four
   * faults: two connections missing and two the sketch does not ask for.
   *
   * A fact about the build, so it lives on the build. Absent on every scene
   * that has no such pair, which is every author-laid-out chapter.
   */
  interchangeable?: readonly (readonly NodeId[])[];
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

/**
 * The same lookup, for the callers that can legitimately miss.
 *
 * `node()` keeps throwing, and should: for most of this codebase an unknown id
 * is a broken invariant and a loud one is worth having. But once a part can be
 * *still in the kit*, its terminals are not on the bench, and three readers
 * have to survive that without an exception — the finding derivation, the
 * focus effect, and the scene views. Those use this; everything else keeps the
 * invariant.
 */
export function maybeNode(
  scene: CircuitScene,
  id: NodeId,
): CircuitNode | undefined {
  return scene.nodes[id];
}

/** True when both connections join the same pair of points, in either order. */
export function sameEndpoints(a: Connection, b: Connection): boolean {
  return (
    (a.from === b.from && a.to === b.to) || (a.from === b.to && a.to === b.from)
  );
}

/**
 * The same question, asked of a scene that knows which of its ends are the same
 * piece of metal.
 *
 * Every comparison in this file goes through it, so a build made with a
 * symmetrical part the other way round is one build and not two.
 */
export function sameJoin(
  scene: CircuitScene,
  a: Connection,
  b: Connection,
): boolean {
  if (sameEndpoints(a, b)) return true;
  const klass = scene.interchangeable;
  if (!klass) return false;
  const same = (x: NodeId, y: NodeId) =>
    x === y || klass.some((group) => group.includes(x) && group.includes(y));
  return (
    (same(a.from, b.from) && same(a.to, b.to)) ||
    (same(a.from, b.to) && same(a.to, b.from))
  );
}

export interface Mismatch {
  /** The connection the sketch defines. */
  expected: Connection;
  /** What is actually wired from the same origin, if anything. */
  observed?: Connection;
}

/** Ids minted for a join the sketch does not name. Builds agree on the prefix. */
export const EXTRA_PREFIX = "x.";
export const isExtraId = (id: string) => id.includes(`.${EXTRA_PREFIX}`);

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
    const exact = scene.observed.find((got) => sameJoin(scene, want, got));
    if (exact) continue;

    /* Same wire, wrong destination — the case the demo is built around.

       The observed connection carrying this id IS this join, wherever it
       landed: `sceneFrom` reuses the expected id for the join the sketch asks a
       lead to make. Falling back to origin keeps every author-laid-out build
       unchanged, and skips minted extras — a join the sketch never named is by
       definition not a badly-landed version of one it did, and counting it as
       both is how one gesture becomes two findings and two repairs. */
    const strayFromSameOrigin =
      scene.observed.find((got) => got.id === want.id) ??
      scene.observed.find((got) => got.from === want.from && !isExtraId(got.id));
    mismatches.push({ expected: want, observed: strayFromSameOrigin });
  }

  return { mismatches, matched: expected.length - mismatches.length };
}

/**
 * Joins the sketch does not ask for.
 *
 * `diff()` answers the other question: it iterates `expected`, so an observed
 * connection with no counterpart is structurally invisible to it. Matched by id
 * first — `sceneFrom` reuses an expected id for a join the sketch does ask for,
 * however badly it landed — then by endpoints, so a join made from either side
 * of the same pair is never called extra.
 *
 * No `within` parameter: `scope` scopes expected ids and cannot scope a
 * connection the sketch never named. Which step a stray belongs to is a
 * findings-layer decision, not one this can make.
 */
export function extras(scene: CircuitScene): Connection[] {
  return scene.observed.filter(
    (got) =>
      !scene.expected.some(
        (want) => want.id === got.id || sameJoin(scene, want, got),
      ),
  );
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
    return !got || !sameJoin(scene, want, got);
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
