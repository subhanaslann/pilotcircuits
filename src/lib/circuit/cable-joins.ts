import type { Connection, NodeId } from "@/lib/circuit/graph";
import type { TerminalId } from "@/lib/circuit/placement";

/**
 * Which join each cable is making — asked of the **pair of seats**, and asked
 * of all the cables at once.
 *
 * ## The hole this closes
 *
 * Four M–M jumpers out of one bag are one object as far as a person is
 * concerned, and every chapter with cables says so in the model. The obvious
 * way to say it is a single `interchangeable` class holding all eight ends: a
 * person who wires the red lamp with the cable the file happens to call "green"
 * has built the right circuit and the panel agrees. That much is right, and it
 * came at a cost that was written down as a "residual" and measured, later, as
 * the whole of the thing: `sameJoin` compares one endpoint against one
 * endpoint, so with every end equivalent to every other, the eight expected
 * SEATS are checked as a set and the four PAIRS are never checked at all — all
 * 8! = 40 320 seatings verify as a finished build.
 *
 * On chapter two that meant a jumper could short two header pins to each other.
 * From chapter three on the class spans two power rails and the `5V` pin, and
 * the same hole becomes a short across the supply: swap the two supply cables'
 * rail ends and 5 V is on the `−` rail with the LED's return at 5 V — fifteen
 * joins made, nothing to correct, and the run lights the lamp to prove it.
 *
 * ## What this does instead
 *
 * A cable's two ends are read together, and the cables are matched to the
 * expected pairs **as an assignment** rather than one end at a time. Greedy by
 * score, which is exact here: with four cables and four pairs the only thing a
 * smarter algorithm buys is a different tie-break.
 *
 * The scene then records the assignment the only way that cannot be composed
 * back into the hole: by **handing each expected connection's id to the lead
 * the assignment says is making it**. `sameJoin`'s third clause reads that id
 * (see `graph.ts`), and because an id is directed and minted once, four cables
 * standing in for one another cannot form a cycle that satisfies seats nobody
 * filled. An alias class published per pair — the shape this file shipped with
 * — could and did: it says "these two ends are the same object" in both
 * directions at once, and four of those still verified 288 wrong builds.
 *
 * Doing it globally is not tidiness. A cable with one end in the wrong rail
 * scores 1 against its own pair and 1 against the other one; deciding per end,
 * it takes the other cable's id, and the cable that is *correctly* placed then
 * finds its own id already claimed and becomes a stray. One mistake, two
 * findings, and the second one points at a cable nobody touched.
 *
 * The three cases that matter, and what each costs:
 *
 *   · **Both seats right** (however the cable was turned round, and whichever
 *     of the four it is): score 2, the expected ids, no finding.
 *   · **One seat right**: the cable still takes its own pair, so a supply cable
 *     whose board end went into `3V3` is ONE finding naming the hole it is in,
 *     rather than a stray plus a missing join. That is the property `familyOf`
 *     was written to protect, kept.
 *   · **Neither seat right**: no pair scores, and both ends are strays. Not a
 *     badly-landed version of anything the sketch asks for.
 *
 * Seats are compared through the build's own nets, so a rail end one column
 * over is the same join — which is what a rail is.
 */

/** One expected cable: the two connections its two ends are meant to make. */
export interface CablePair {
  /** The connection made by the end named first in `terminalsOf`. */
  a: Connection;
  /** The connection made by the other end. */
  b: Connection;
}

/** A cable, as the two lead ids it is made of. */
export interface CableEnds {
  a: TerminalId;
  b: TerminalId;
}

/**
 * Builds the pair table from a build's own cable list and its `expected`.
 *
 * Derived rather than written down, so a chapter cannot end up with a pair
 * table that disagrees with the connections it publishes.
 */
export function cablePairs(
  wires: readonly CableEnds[],
  expected: readonly Connection[],
): CablePair[] {
  const pairs: CablePair[] = [];
  for (const w of wires) {
    const a = expected.find((c) => c.from === w.a);
    const b = expected.find((c) => c.from === w.b);
    if (a && b) pairs.push({ a, b });
  }
  return pairs;
}

/**
 * Every cable end that is making a join the sketch asks for, by lead id.
 *
 * An end absent from the map is a stray — either its cable matched no pair at
 * all, or the pair it would have matched went to a cable that fits it better.
 */
export function assignCables(
  wires: readonly CableEnds[],
  pairs: readonly CablePair[],
  /** Where a lead is attached, whichever side stored the edge. */
  targetOf: (terminal: TerminalId) => NodeId | undefined,
  sameNet: (a: NodeId, b: NodeId) => boolean,
): Map<TerminalId, Connection> {
  const reaches = (t: NodeId | undefined, seat: NodeId) =>
    t !== undefined && sameNet(t, seat) ? 1 : 0;

  interface Candidate {
    cable: number;
    pair: number;
    /** Whether the cable's `a` end takes the pair's `a` connection. */
    straight: boolean;
    score: number;
  }

  const candidates: Candidate[] = [];
  wires.forEach((w, cable) => {
    const ta = targetOf(w.a);
    const tb = targetOf(w.b);
    /* A cable with neither end seated is in the box and makes nothing. */
    if (ta === undefined && tb === undefined) return;
    pairs.forEach((p, pair) => {
      const straight = reaches(ta, p.a.to) + reaches(tb, p.b.to);
      const turned = reaches(ta, p.b.to) + reaches(tb, p.a.to);
      if (straight > 0) candidates.push({ cable, pair, straight: true, score: straight });
      if (turned > 0) candidates.push({ cable, pair, straight: false, score: turned });
    });
  });

  /* Score first; then the pair's own declaration order, then the cable's, so
     the answer is stable and a reader can predict it. */
  candidates.sort(
    (x, y) => y.score - x.score || x.pair - y.pair || x.cable - y.cable,
  );

  const takenCable = new Set<number>();
  const takenPair = new Set<number>();
  const made = new Map<TerminalId, Connection>();

  for (const c of candidates) {
    if (takenCable.has(c.cable) || takenPair.has(c.pair)) continue;
    takenCable.add(c.cable);
    takenPair.add(c.pair);
    const w = wires[c.cable];
    const p = pairs[c.pair];
    made.set(w.a, c.straight ? p.a : p.b);
    made.set(w.b, c.straight ? p.b : p.a);
  }

  return made;
}
